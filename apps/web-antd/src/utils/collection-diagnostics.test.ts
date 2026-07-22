import { describe, expect, it } from 'vitest';

import {
  formatDiagnosticArea,
  formatDiagnosticList,
  formatMissingField,
  formatModelReferenceCatalogIssue,
  formatQualityFlag,
} from './collection-diagnostics';

describe('collection diagnostics formatters', () => {
  it('formats known missing fields and diagnostic areas', () => {
    expect(formatMissingField('system.serial_number')).toBe('序列号');
    expect(formatMissingField('firmware.bmc_version')).toBe('BMC');
    expect(formatDiagnosticArea('drive_backplane')).toBe('硬盘背板');
    expect(formatDiagnosticArea('unknown_area')).toBe('unknown_area');
  });

  it('formats known quality flags', () => {
    expect(formatQualityFlag('model_reference_unmatched')).toBe(
      '型号目录未匹配',
    );
    expect(formatQualityFlag('model_reference_suspect')).toBe(
      '型号目录疑似错录',
    );
    expect(formatQualityFlag('memory_missing_identity')).toBe('内存缺序列号');
    expect(formatQualityFlag('fan_missing_identity')).toBe('风扇缺序列号');
    expect(formatQualityFlag('drive_backplane_missing_identity')).toBe(
      '硬盘背板缺序列号',
    );
    expect(formatQualityFlag('no_fan_collected')).toBe('未采风扇');
  });

  it('formats dynamic Redfish path miss flags', () => {
    expect(formatQualityFlag('no_riser_path_hit')).toBe('Riser路径未命中');
    expect(formatQualityFlag('no_firmware_path_hit')).toBe('固件路径未命中');
    expect(formatQualityFlag('no_vendor_oem_path_hit')).toBe(
      'vendor_oem路径未命中',
    );
  });

  it('formats lists with fallback for empty values', () => {
    expect(formatDiagnosticList([], formatQualityFlag)).toBe('-');
    expect(
      formatDiagnosticList(
        ['missing_system_serial', 'no_storage_path_hit'],
        formatQualityFlag,
      ),
    ).toBe('缺序列号、存储路径未命中');
  });

  it('formats suspect model reference catalog issues', () => {
    expect(formatModelReferenceCatalogIssue(undefined)).toBe('');
    expect(
      formatModelReferenceCatalogIssue({
        catalog_issue: {
          candidate_official_skus: [
            { sku: 'SYS-6029U-TR4' },
            { sku: 'SYS-2049U-TR4' },
          ],
        },
      }),
    ).toBe('型号目录疑似错录，候选：SYS-6029U-TR4、SYS-2049U-TR4');
  });
});
