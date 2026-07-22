export const deviceTypeOptions = [
  { label: '服务器', value: 'server' },
  { label: '交换机', value: 'switch' },
];

export const credentialScopeOptions = [
  { label: '全局通用', value: 'global' },
  { label: '厂商/平台通用', value: 'vendor' },
  { label: '实例专属', value: 'instance' },
];

export const protocolOptionsByDeviceType = {
  server: [
    { label: 'Redfish', value: 'redfish' },
    { label: 'IPMI', value: 'ipmi' },
    { label: 'SSH', value: 'ssh' },
  ],
  switch: [
    { label: 'SSH', value: 'ssh' },
    { label: 'SNMP', value: 'snmp' },
    { label: 'Telnet', value: 'telnet' },
  ],
} as const;

export const defaultProtocolByDeviceType = {
  server: 'redfish',
  switch: 'ssh',
};

export const vendorOptionsByDeviceType = {
  server: [
    { label: 'Dell / iDRAC', value: 'dell' },
    { label: 'Huawei / iBMC', value: 'huawei' },
    { label: 'xFusion / 超聚变', value: 'xfusion' },
    { label: 'HPE / iLO', value: 'hpe' },
    { label: 'Lenovo / XCC', value: 'lenovo' },
    { label: 'Supermicro', value: 'supermicro' },
    { label: 'Inspur / 浪潮', value: 'inspur' },
    { label: 'H3C / HDM', value: 'h3c' },
    { label: 'Sugon / 曙光', value: 'sugon' },
    { label: 'Suma', value: 'suma' },
    { label: 'THTF / 同方', value: 'thtf' },
    { label: 'XSky', value: 'xsky' },
  ],
  switch: [
    { label: 'H3C / 新华三', value: 'h3c' },
    { label: 'Huawei / 华为', value: 'huawei' },
    { label: 'Ruijie / 锐捷', value: 'ruijie' },
    { label: 'Cisco', value: 'cisco' },
    { label: 'Juniper', value: 'juniper' },
  ],
} as const;

export function getProtocolOptions(deviceType?: string) {
  return (
    protocolOptionsByDeviceType[
      (deviceType || 'server') as keyof typeof protocolOptionsByDeviceType
    ] || protocolOptionsByDeviceType.server
  );
}

export function getVendorOptions(deviceType?: string) {
  return (
    vendorOptionsByDeviceType[
      (deviceType || 'server') as keyof typeof vendorOptionsByDeviceType
    ] || vendorOptionsByDeviceType.server
  );
}

export function getDefaultProtocol(deviceType?: string) {
  return (
    defaultProtocolByDeviceType[
      (deviceType || 'server') as keyof typeof defaultProtocolByDeviceType
    ] || defaultProtocolByDeviceType.server
  );
}

export function getVendorLabel(deviceType: string, vendorKey?: string) {
  if (!vendorKey) return '-';
  const option = getVendorOptions(deviceType).find(
    (item) => item.value === vendorKey,
  );
  return option?.label || vendorKey;
}
