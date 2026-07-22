export const missingFieldLabels: Record<string, string> = {
  'firmware.bios_version': 'BIOS',
  'firmware.bmc_version': 'BMC',
  'firmware.cpld_version': 'CPLD',
  'system.guuid': 'GUUID',
  'system.manufacturer': '厂商',
  'system.model': '型号',
  'system.serial_number': '序列号',
};

export const qualityFlagLabels: Record<string, string> = {
  cpu_missing_identity: 'CPU缺序列号',
  drive_backplane_missing_identity: '硬盘背板缺序列号',
  fan_missing_identity: '风扇缺序列号',
  memory_missing_identity: '内存缺序列号',
  motherboard_missing_identity: '主板缺序列号',
  missing_bmc_firmware: '缺BMC版本',
  missing_system_guuid: '缺GUUID',
  missing_system_serial: '缺序列号',
  model_reference_suspect: '型号目录疑似错录',
  model_reference_unmatched: '型号目录未匹配',
  network_missing_identity: '网卡缺标识',
  no_cpu_collected: '未采CPU',
  no_drive_backplane_collected: '未采硬盘背板',
  no_fan_collected: '未采风扇',
  no_memory_collected: '未采内存',
  no_motherboard_collected: '未采主板',
  no_network_collected: '未采网卡',
  no_power_collected: '未采电源',
  no_raid_collected: '未采RAID',
  no_riser_collected: '未采Riser',
  no_storage_collected: '未采硬盘',
  power_missing_identity: '电源缺序列号',
  raid_missing_identity: 'RAID缺序列号',
  riser_missing_identity: 'Riser缺序列号',
  storage_missing_identity: '硬盘缺序列号',
};

export const diagnosticAreaLabels: Record<string, string> = {
  backplane: '背板',
  chassis: '机箱',
  cpu: 'CPU',
  drive_backplane: '硬盘背板',
  drives: '硬盘',
  fan: '风扇',
  fan_chassis: '风扇机箱',
  fans: '风扇',
  firmware: '固件',
  identity: '身份',
  managers: 'BMC',
  memory: '内存',
  motherboard: '主板',
  network: '网卡',
  power: '电源',
  raid: 'RAID',
  riser: 'Riser',
  storage: '存储',
  storage_drives: '硬盘',
  systems: '系统',
  thermal: '温度',
};

export function formatMissingField(field: string) {
  return missingFieldLabels[field] || field;
}

export function formatDiagnosticArea(area: string) {
  return diagnosticAreaLabels[area] || area;
}

export function formatQualityFlag(flag: string) {
  if (qualityFlagLabels[flag]) {
    return qualityFlagLabels[flag];
  }

  const pathHitMatch = /^no_(.+)_path_hit$/.exec(flag);
  const pathArea = pathHitMatch?.[1];
  if (pathArea) {
    return `${formatDiagnosticArea(pathArea)}路径未命中`;
  }

  return flag;
}

export function formatModelReferenceCatalogIssue(reference?: any) {
  const issue = reference?.catalog_issue;
  if (!issue || typeof issue !== 'object') {
    return '';
  }
  const candidates = Array.isArray(issue.candidate_official_skus)
    ? issue.candidate_official_skus
        .map((candidate: any) => candidate?.sku)
        .filter(Boolean)
    : [];
  if (candidates.length === 0) {
    return '型号目录疑似错录';
  }
  return `型号目录疑似错录，候选：${candidates.join('、')}`;
}

export function formatDiagnosticList(
  values: any[],
  formatter: (value: any) => string,
) {
  if (!Array.isArray(values) || values.length === 0) {
    return '-';
  }
  return values.map((value) => formatter(value)).join('、');
}
