import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { inflateSync } from 'node:zlib';

const repoRoot = process.cwd();
const publicRoot = join(repoRoot, 'apps/web-antd/public');
const assetSource = join(
  repoRoot,
  'apps/web-antd/src/utils/server-model-assets.ts',
);
const assetManifest = join(
  repoRoot,
  'apps/web-antd/public/assets/model/SERVER_MODEL_ASSETS.md',
);
const assetQualityGates = join(
  repoRoot,
  'apps/web-antd/public/assets/model/SERVER_MODEL_ASSET_QUALITY_GATES.json',
);
const assetModelDir = join(repoRoot, 'apps/web-antd/public/assets/model');
const modelImageSize = { width: 1920, height: 1080 };
const uImageSize = { width: 1842, height: 346 };

function fail(message) {
  throw new Error(message);
}

function paethPredictor(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) {
    return left;
  }
  return aboveDistance <= upperLeftDistance ? above : upperLeft;
}

function parsePng(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    fail('not a PNG file');
  }

  let offset = 8;
  let reachedEnd = false;
  let header;
  const idatChunks = [];

  while (offset < buffer.length && !reachedEnd) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const data = buffer.subarray(dataStart, dataEnd);

    switch (type) {
      case 'IDAT': {
        idatChunks.push(data);
        break;
      }
      case 'IEND': {
        reachedEnd = true;
        break;
      }
      case 'IHDR': {
        header = {
          bitDepth: data.readUInt8(8),
          colorType: data.readUInt8(9),
          height: data.readUInt32BE(4),
          width: data.readUInt32BE(0),
        };
        break;
      }
      default: {
        break;
      }
    }

    if (!reachedEnd) {
      offset = dataEnd + 4;
    }
  }

  if (!header) {
    fail('missing IHDR chunk');
  }
  if (header.bitDepth !== 8 || header.colorType !== 6) {
    fail(
      `expected 8-bit RGBA PNG, got bitDepth=${header.bitDepth}, colorType=${header.colorType}`,
    );
  }

  return { ...header, imageData: Buffer.concat(idatChunks) };
}

function getAlphaExtrema(png) {
  const bytesPerPixel = 4;
  const scanlineLength = png.width * bytesPerPixel;
  const inflated = inflateSync(png.imageData);
  const previous = Buffer.alloc(scanlineLength);
  const current = Buffer.alloc(scanlineLength);
  let sourceOffset = 0;
  let min = 255;
  let max = 0;

  for (let y = 0; y < png.height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;

    for (let x = 0; x < scanlineLength; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= bytesPerPixel ? current[x - bytesPerPixel] : 0;
      const above = previous[x];
      const upperLeft = x >= bytesPerPixel ? previous[x - bytesPerPixel] : 0;

      switch (filter) {
        case 0: {
          current[x] = raw;
          break;
        }
        case 1: {
          current[x] = (raw + left) & 255;
          break;
        }
        case 2: {
          current[x] = (raw + above) & 255;
          break;
        }
        case 3: {
          current[x] = (raw + Math.floor((left + above) / 2)) & 255;
          break;
        }
        case 4: {
          current[x] = (raw + paethPredictor(left, above, upperLeft)) & 255;
          break;
        }
        default: {
          fail(`unsupported PNG filter ${filter}`);
        }
      }
    }

    for (let x = 3; x < scanlineLength; x += bytesPerPixel) {
      const alpha = current[x];
      if (alpha < min) min = alpha;
      if (alpha > max) max = alpha;
    }

    current.copy(previous);
    sourceOffset += scanlineLength;
  }

  return { min, max };
}

function extractAssetPaths() {
  const source = readFileSync(assetSource, 'utf8');
  const matches = [
    ...source.matchAll(/(?:modelImage|uPositionImage):\s*'([^']+)'/g),
  ];
  const paths = matches.map((match) => match[1]);
  if (paths.length === 0) {
    fail('no server model asset paths found');
  }
  return [...new Set(paths)];
}

function verifyAssetCatalogReferences(assetPaths) {
  const manifest = readFileSync(assetManifest, 'utf8');
  const missing = [];

  for (const assetPath of assetPaths) {
    const fileName = assetPath.split('/').pop();
    if (!fileName || !manifest.includes(`\`${fileName}\``)) {
      missing.push(`${assetPath}: missing from SERVER_MODEL_ASSETS.md`);
    }
  }

  if (missing.length > 0) {
    fail(missing.join('\n'));
  }
}

function extractManifestRows(sectionTitle, manifest) {
  const sectionStart = manifest.indexOf(`## ${sectionTitle}`);
  if (sectionStart === -1) {
    fail(`missing SERVER_MODEL_ASSETS.md section: ${sectionTitle}`);
  }

  const nextSectionStart = manifest.indexOf('\n## ', sectionStart + 1);
  const section = manifest.slice(
    sectionStart,
    nextSectionStart === -1 ? undefined : nextSectionStart,
  );

  return section
    .split('\n')
    .filter((line) => line.startsWith('| '))
    .filter((line) => !line.includes('---'));
}

function parseMarkdownRow(line) {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

function extractManifestAssetRows(manifest) {
  return extractManifestRows('已落地资源', manifest)
    .map((line) => parseMarkdownRow(line))
    .filter((cells) => cells.length >= 6 && cells[2].includes('`'))
    .map((cells) => {
      const [brand, model, modelImage, uPositionImage, sourceType] = cells;
      return {
        brand,
        model,
        modelImage: modelImage.replaceAll('`', ''),
        sourceType,
        uPositionImage: uPositionImage.replaceAll('`', ''),
      };
    });
}

function verifyReferenceRegistry() {
  const manifest = readFileSync(assetManifest, 'utf8');
  const assetRows = extractManifestAssetRows(manifest);
  const referenceKeys = new Set(
    extractManifestRows('参考登记', manifest)
      .map((line) => parseMarkdownRow(line))
      .filter((cells) => cells.length >= 4 && cells[0] !== '品牌')
      .map((cells) => `${cells[0]}::${cells[1]}`),
  );

  const missing = [];
  for (const { brand, model } of assetRows) {
    const key = `${brand}::${model}`;
    if (!referenceKeys.has(key)) {
      missing.push(`${brand} ${model}: missing reference registry row`);
    }
  }

  if (missing.length > 0) {
    fail(missing.join('\n'));
  }
}

function verifyNoDuplicatedFiles(assetPaths) {
  const hashToPaths = new Map();

  for (const assetPath of assetPaths) {
    const filePath = join(publicRoot, assetPath);
    const buffer = readFileSync(filePath);
    const hash = createHash('sha256').update(buffer).digest('hex');
    const paths = hashToPaths.get(hash) || [];
    paths.push(assetPath);
    hashToPaths.set(hash, paths);
  }

  const duplicated = [...hashToPaths.values()].filter(
    (paths) => paths.length > 1,
  );
  if (duplicated.length > 0) {
    fail(
      duplicated
        .map(
          (paths) => `duplicated server model asset file: ${paths.join(', ')}`,
        )
        .join('\n'),
    );
  }
}

function verifyAllModelPngFilesAreCataloged(assetPaths) {
  const catalogedPaths = new Set(assetPaths);
  const imageFiles = readdirSync(assetModelDir)
    .filter((fileName) => fileName.endsWith('.png'))
    .map((fileName) => `/assets/model/${fileName}`);

  const missingFromCatalog = imageFiles.filter(
    (assetPath) => !catalogedPaths.has(assetPath),
  );
  if (missingFromCatalog.length > 0) {
    fail(
      missingFromCatalog
        .map((assetPath) => `${assetPath}: file exists but is not cataloged`)
        .join('\n'),
    );
  }
}

function verifyModelAndUImagePairs(assetPaths) {
  const catalogedPaths = new Set(assetPaths);
  const missingPairs = [];

  for (const assetPath of assetPaths) {
    if (assetPath.endsWith('_u.png')) {
      const modelPath = assetPath.replace(/_u\.png$/, '.png');
      if (!catalogedPaths.has(modelPath)) {
        missingPairs.push(
          `${assetPath}: missing paired model image ${modelPath}`,
        );
      }
      continue;
    }

    const uPositionPath = assetPath.replace(/\.png$/, '_u.png');
    if (!catalogedPaths.has(uPositionPath)) {
      missingPairs.push(
        `${assetPath}: missing paired U-position image ${uPositionPath}`,
      );
    }
  }

  if (missingPairs.length > 0) {
    fail(missingPairs.join('\n'));
  }
}

function readQualityGates() {
  try {
    return JSON.parse(readFileSync(assetQualityGates, 'utf8'));
  } catch (error) {
    fail(`invalid SERVER_MODEL_ASSET_QUALITY_GATES.json: ${error.message}`);
  }
}

function verifyQualityGates(assetPaths) {
  const gates = readQualityGates();
  const manifest = readFileSync(assetManifest, 'utf8');
  const catalogedPaths = new Set(assetPaths);
  const existingFiles = new Set(
    readdirSync(assetModelDir)
      .filter((fileName) => fileName.endsWith('.png'))
      .map((fileName) => `/assets/model/${fileName}`),
  );
  const errors = [];

  if (!Array.isArray(gates.blockedAssets)) {
    errors.push('blockedAssets must be an array');
  }
  if (!Array.isArray(gates.releasedAssets)) {
    errors.push('releasedAssets must be an array');
  }
  if (!Array.isArray(gates.structuralConstraints)) {
    errors.push('structuralConstraints must be an array');
  }

  const blockedPaths = new Set();
  const blockedKeys = new Set();
  for (const gate of gates.blockedAssets || []) {
    if (!gate.brand || !gate.model || !Array.isArray(gate.paths)) {
      errors.push('blocked asset gate must include brand, model and paths');
      continue;
    }
    if (!gate.reason || !Array.isArray(gate.requiredBeforeRelease)) {
      errors.push(
        `${gate.brand} ${gate.model}: missing reason or release gates`,
      );
    }
    if (!manifest.includes(gate.model)) {
      errors.push(
        `${gate.brand} ${gate.model}: missing from SERVER_MODEL_ASSETS.md`,
      );
    }
    blockedKeys.add(`${gate.brand}::${gate.model}`);

    for (const assetPath of gate.paths) {
      if (
        !assetPath.startsWith('/assets/model/') ||
        !assetPath.endsWith('.png')
      ) {
        errors.push(
          `${gate.brand} ${gate.model}: invalid blocked path ${assetPath}`,
        );
        continue;
      }
      if (blockedPaths.has(assetPath)) {
        errors.push(`${assetPath}: duplicated blocked asset path`);
      }
      blockedPaths.add(assetPath);
      if (catalogedPaths.has(assetPath)) {
        errors.push(`${assetPath}: blocked asset is cataloged`);
      }
      if (existingFiles.has(assetPath)) {
        errors.push(`${assetPath}: blocked asset file exists`);
      }
    }
  }

  const manifestAssets = extractManifestAssetRows(manifest);
  const manifestAssetKeys = new Set(
    manifestAssets.map((asset) => `${asset.brand}::${asset.model}`),
  );
  const releasedKeys = new Set();
  const releasedPaths = new Set();

  for (const gate of gates.releasedAssets || []) {
    if (!gate.brand || !gate.model || !Array.isArray(gate.paths)) {
      errors.push('released asset gate must include brand, model and paths');
      continue;
    }
    const key = `${gate.brand}::${gate.model}`;
    if (releasedKeys.has(key)) {
      errors.push(`${key}: duplicated released asset gate`);
    }
    releasedKeys.add(key);

    if (blockedKeys.has(key)) {
      errors.push(`${key}: cannot be both released and blocked`);
    }
    if (!manifestAssetKeys.has(key)) {
      errors.push(
        `${key}: released asset gate missing from SERVER_MODEL_ASSETS.md`,
      );
    }
    if (!gate.sourceType || !gate.driveBayLayout || !gate.uPositionView) {
      errors.push(
        `${key}: missing sourceType, driveBayLayout or uPositionView`,
      );
    }
    if (
      gate.expectedRackUnits !== undefined &&
      (!Number.isInteger(gate.expectedRackUnits) || gate.expectedRackUnits <= 0)
    ) {
      errors.push(`${key}: expectedRackUnits must be a positive integer`);
    }
    if (
      gate.expectedDriveBays !== undefined &&
      (!Number.isInteger(gate.expectedDriveBays) || gate.expectedDriveBays <= 0)
    ) {
      errors.push(`${key}: expectedDriveBays must be a positive integer`);
    }
    if (gate.paths.length !== 2) {
      errors.push(
        `${key}: released asset gate must contain model and U-position paths`,
      );
    }

    for (const assetPath of gate.paths) {
      if (
        !assetPath.startsWith('/assets/model/') ||
        !assetPath.endsWith('.png')
      ) {
        errors.push(`${key}: invalid released path ${assetPath}`);
        continue;
      }
      if (releasedPaths.has(assetPath)) {
        errors.push(`${assetPath}: duplicated released asset path`);
      }
      releasedPaths.add(assetPath);
      if (!catalogedPaths.has(assetPath)) {
        errors.push(`${assetPath}: released asset path is not cataloged`);
      }
      if (blockedPaths.has(assetPath)) {
        errors.push(`${assetPath}: cannot be both released and blocked`);
      }
    }
  }

  for (const asset of manifestAssets) {
    const key = `${asset.brand}::${asset.model}`;
    const gate = (gates.releasedAssets || []).find(
      (item) => item.brand === asset.brand && item.model === asset.model,
    );
    if (!gate) {
      errors.push(`${key}: missing released asset quality gate`);
      continue;
    }
    if (gate.sourceType !== asset.sourceType) {
      errors.push(
        `${key}: sourceType mismatch, manifest=${asset.sourceType}, gate=${gate.sourceType}`,
      );
    }
    for (const assetPath of [asset.modelImage, asset.uPositionImage]) {
      if (!gate.paths.includes(`/assets/model/${assetPath}`)) {
        errors.push(`${key}: quality gate missing manifest path ${assetPath}`);
      }
    }
  }

  for (const constraint of gates.structuralConstraints || []) {
    if (!constraint.brand || !constraint.model) {
      errors.push('structural constraint must include brand and model');
      continue;
    }
    if (
      constraint.expectedDriveBays !== undefined &&
      (!Number.isInteger(constraint.expectedDriveBays) ||
        constraint.expectedDriveBays <= 0)
    ) {
      errors.push(
        `${constraint.brand} ${constraint.model}: expectedDriveBays must be a positive integer`,
      );
    }
    if (!constraint.driveBayLayout && !constraint.uPositionView) {
      errors.push(
        `${constraint.brand} ${constraint.model}: missing structural description`,
      );
    }
  }

  if (errors.length > 0) {
    fail(errors.join('\n'));
  }
}

function assertExpectedSize(assetPath, png) {
  const expected = assetPath.endsWith('_u.png') ? uImageSize : modelImageSize;
  if (png.width !== expected.width || png.height !== expected.height) {
    fail(
      `expected ${expected.width}x${expected.height}, got ${png.width}x${png.height}`,
    );
  }
}

function verifyAsset(assetPath) {
  if (!assetPath.startsWith('/assets/model/') || !assetPath.endsWith('.png')) {
    fail(`${assetPath}: invalid asset path`);
  }

  const filePath = join(publicRoot, assetPath);
  const buffer = readFileSync(filePath);
  const png = parsePng(buffer);
  assertExpectedSize(assetPath, png);

  const alpha = getAlphaExtrema(png);
  if (alpha.min !== 0 || alpha.max !== 255) {
    fail(
      `${assetPath}: expected transparent background alpha range 0..255, got ${alpha.min}..${alpha.max}`,
    );
  }
}

const assetPaths = extractAssetPaths();
const errors = [];

for (const assetPath of assetPaths) {
  try {
    verifyAsset(assetPath);
  } catch (error) {
    errors.push(`${assetPath}: ${error.message}`);
  }
}

try {
  verifyAssetCatalogReferences(assetPaths);
} catch (error) {
  errors.push(error.message);
}

try {
  verifyReferenceRegistry();
} catch (error) {
  errors.push(error.message);
}

try {
  verifyNoDuplicatedFiles(assetPaths);
} catch (error) {
  errors.push(error.message);
}

try {
  verifyAllModelPngFilesAreCataloged(assetPaths);
} catch (error) {
  errors.push(error.message);
}

try {
  verifyModelAndUImagePairs(assetPaths);
} catch (error) {
  errors.push(error.message);
}

try {
  verifyQualityGates(assetPaths);
} catch (error) {
  errors.push(error.message);
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(`Verified ${assetPaths.length} server model assets.`);
