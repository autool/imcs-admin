type AssetKind = 'model' | 'u';

interface ServerModelAssetInput {
  brand?: string;
  brandName?: string;
  manufacturer?: string;
  model?: string;
  modelImage?: string;
  modelName?: string;
  model_image?: string;
  model_name?: string;
  uPositionImage?: string;
  u_position_image?: string;
}

interface ServerModelAsset {
  brandKeys: string[];
  modelKeys: string[];
  modelImage: string;
  uPositionImage: string;
}

const SERVER_MODEL_ASSETS: ServerModelAsset[] = [
  {
    brandKeys: ['huawei', '华为'],
    modelKeys: ['2288h v5', 'fusionserver 2288h v5'],
    modelImage: '/assets/model/huawei-2288h-v5.png',
    uPositionImage: '/assets/model/huawei-2288h-v5_u.png',
  },
  {
    brandKeys: ['huawei', '华为'],
    modelKeys: [
      '1288h v3',
      'rh1288 v3',
      'fusionserver 1288h v3',
      'fusionserver rh1288 v3',
    ],
    modelImage: '/assets/model/huawei-1288h-v3.png',
    uPositionImage: '/assets/model/huawei-1288h-v3_u.png',
  },
  {
    brandKeys: ['huawei', '华为'],
    modelKeys: ['1288h v5', 'fusionserver 1288h v5'],
    modelImage: '/assets/model/huawei-1288h-v5.png',
    uPositionImage: '/assets/model/huawei-1288h-v5_u.png',
  },
  {
    brandKeys: ['huawei', '华为'],
    modelKeys: ['2488h v5', 'fusionserver 2488h v5'],
    modelImage: '/assets/model/huawei-2488h-v5.png',
    uPositionImage: '/assets/model/huawei-2488h-v5_u.png',
  },
  {
    brandKeys: ['huawei', '华为'],
    modelKeys: ['taishan 2280 v2', 'taishan2280 v2', '2280 v2'],
    modelImage: '/assets/model/huawei-taishan-2280-v2.png',
    uPositionImage: '/assets/model/huawei-taishan-2280-v2_u.png',
  },
  {
    brandKeys: ['huawei', '华为'],
    modelKeys: ['2288h v7', 'fusionserver 2288h v7'],
    modelImage: '/assets/model/huawei-2288h-v7.png',
    uPositionImage: '/assets/model/huawei-2288h-v7_u.png',
  },
  {
    brandKeys: ['xfusion', '超聚变'],
    modelKeys: ['2288h v7', 'fusionserver 2288h v7'],
    modelImage: '/assets/model/xfusion-2288h-v7.png',
    uPositionImage: '/assets/model/xfusion-2288h-v7_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r740 xd', 'poweredge r740xd', 'r740 xd', 'r740xd'],
    modelImage: '/assets/model/dell-r740xd.png',
    uPositionImage: '/assets/model/dell-r740xd_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r640', 'r640'],
    modelImage: '/assets/model/dell-poweredge-r640.png',
    uPositionImage: '/assets/model/dell-poweredge-r640_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r740', 'r740'],
    modelImage: '/assets/model/dell-poweredge-r740.png',
    uPositionImage: '/assets/model/dell-poweredge-r740_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r750', 'r750'],
    modelImage: '/assets/model/dell-poweredge-r750.png',
    uPositionImage: '/assets/model/dell-poweredge-r750_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r940xa', 'r940xa'],
    modelImage: '/assets/model/dell-poweredge-r940xa.png',
    uPositionImage: '/assets/model/dell-poweredge-r940xa_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r650 xs', 'poweredge r650xs', 'r650 xs', 'r650xs'],
    modelImage: '/assets/model/dell-poweredge-r650-xs.png',
    uPositionImage: '/assets/model/dell-poweredge-r650-xs_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r730 xd', 'poweredge r730xd', 'r730 xd', 'r730xd'],
    modelImage: '/assets/model/dell-poweredge-r730-xd.png',
    uPositionImage: '/assets/model/dell-poweredge-r730-xd_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r720 xd', 'poweredge r720xd', 'r720 xd', 'r720xd'],
    modelImage: '/assets/model/dell-poweredge-r720-xd.png',
    uPositionImage: '/assets/model/dell-poweredge-r720-xd_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r730', 'r730'],
    modelImage: '/assets/model/dell-poweredge-r730.png',
    uPositionImage: '/assets/model/dell-poweredge-r730_u.png',
  },
  {
    brandKeys: ['dell', 'dell inc', '戴尔'],
    modelKeys: ['poweredge r510', 'r510'],
    modelImage: '/assets/model/dell-poweredge-r510.png',
    uPositionImage: '/assets/model/dell-poweredge-r510_u.png',
  },
  {
    brandKeys: ['inspur', '浪潮'],
    modelKeys: ['nf5180m5'],
    modelImage: '/assets/model/inspur-nf5180m5.png',
    uPositionImage: '/assets/model/inspur-nf5180m5_u.png',
  },
  {
    brandKeys: ['inspur', '浪潮'],
    modelKeys: ['nf5280m4'],
    modelImage: '/assets/model/inspur-nf5280m4.png',
    uPositionImage: '/assets/model/inspur-nf5280m4_u.png',
  },
  {
    brandKeys: ['inspur', '浪潮'],
    modelKeys: ['nf5280m5'],
    modelImage: '/assets/model/inspur-nf5280m5.png',
    uPositionImage: '/assets/model/inspur-nf5280m5_u.png',
  },
  {
    brandKeys: ['inspur', '浪潮'],
    modelKeys: ['nf5466m5'],
    modelImage: '/assets/model/inspur-nf5466m5.png',
    uPositionImage: '/assets/model/inspur-nf5466m5_u.png',
  },
  {
    brandKeys: ['inspur', '浪潮'],
    modelKeys: ['nf8260m5'],
    modelImage: '/assets/model/inspur-nf8260m5.png',
    uPositionImage: '/assets/model/inspur-nf8260m5_u.png',
  },
  {
    brandKeys: ['supermicro', 'super micro', '超微'],
    modelKeys: ['sys-7049gp-trt', '7049gp-trt'],
    modelImage: '/assets/model/supermicro-sys-7049gp-trt.png',
    uPositionImage: '/assets/model/supermicro-sys-7049gp-trt_u.png',
  },
  {
    brandKeys: ['thtf', '清华同方', '同方'],
    modelKeys: ['chaoqiang k620 series', 'chaoqiang k620', 'k620', '超强 k620'],
    modelImage: '/assets/model/thtf-chaoqiang-k620-series.png',
    uPositionImage: '/assets/model/thtf-chaoqiang-k620-series_u.png',
  },
];

function normalizeAssetKey(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9\u4E00-\u9FA5]+/g, '');
}

function hasImagePath(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function findServerModelAsset(server?: null | ServerModelAssetInput) {
  if (!server) {
    return undefined;
  }

  const brandKey = normalizeAssetKey(
    server.brand || server.brandName || server.manufacturer,
  );
  const modelKey = normalizeAssetKey(
    server.modelName || server.model_name || server.model,
  );

  const modelCandidates = SERVER_MODEL_ASSETS.filter((asset) =>
    asset.modelKeys.some((key) => modelKey.includes(normalizeAssetKey(key))),
  );
  if (brandKey) {
    return modelCandidates.find((asset) =>
      asset.brandKeys.some((key) => brandKey.includes(normalizeAssetKey(key))),
    );
  }

  return modelCandidates.length === 1 ? modelCandidates[0] : undefined;
}

export function resolveServerModelImage(server?: null | ServerModelAssetInput) {
  if (hasImagePath(server?.model_image)) {
    return server?.model_image as string;
  }
  if (hasImagePath(server?.modelImage)) {
    return server?.modelImage as string;
  }

  return findServerModelAsset(server)?.modelImage || '';
}

export function resolveServerUPositionImage(
  server?: null | ServerModelAssetInput,
) {
  if (hasImagePath(server?.u_position_image)) {
    return server?.u_position_image as string;
  }
  if (hasImagePath(server?.uPositionImage)) {
    return server?.uPositionImage as string;
  }

  return findServerModelAsset(server)?.uPositionImage || '';
}

export function resolveServerAssetImage(
  server: null | ServerModelAssetInput | undefined,
  kind: AssetKind,
) {
  return kind === 'u'
    ? resolveServerUPositionImage(server)
    : resolveServerModelImage(server);
}
