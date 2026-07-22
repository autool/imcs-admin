export interface RowType {
  ip_address: string; // IP地址
  info: string; // 备注
  id: string;
  model_name: string; // 型号
  brand_name: string; // 品牌
  open: boolean; // 电源状态
  serial_number: string; // 序列号
  bios_version: string; // BIOS版本
  addDate: string; // 添加时间
}

export interface ServersData {
  code: number;
  // RowType 或者空
  data: '';
  error: string;
  message: string;
}

export interface ServerDetailResponse {
  ip?: string;
  modelName?: string;
  modelImage?: string;
  motherboard?: string;
  biosVersion?: string;
  cpldVersion?: string;
  bmcVersion?: string;
  serialNumber?: string;
  cpuList?: Array<{
    cores: number;
    frequency: number;
    manufacturer: string;
    model: string;
    serialNumber: string;
    slot: string;
    status: string;
    threads: number;
  }>;
  memoryList?: Array<{
    capacity: number;
    frequency: number;
    manufacturer: string;
    model: string;
    partNumber: string;
    serialNumber: string;
    slot: string;
    status: string;
  }>;
  diskList?: Array<{
    capacity: number;
    interface: string;
    manufacturer: string;
    mediaType: string;
    model: string;
    partNumber: string;
    rpm: number;
    serialNumber: string;
    slot: string;
    status: string;
    wearRate: null | number;
  }>;
  fanList?: Array<{
    id: string;
    location: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    speed: number;
    status: string;
  }>;
  powerList?: Array<{
    capacity: number;
    efficiency: number;
    manufacturer: string;
    model: string;
    name: string;
    serialNumber: string;
    status: string;
  }>;
  raidList?: Array<{
    controller: string;
    firmware: string;
    level: string;
    location: string;
    manufacturer: string;
    model: string;
    serialNumber: string;
    status: string;
  }>;
  hbaList?: Array<{
    firmware: string;
    ipAddress: string;
    macAddress: string;
    manufacturer: string;
    model: string;
    partNumber: string;
    ports: number;
    serialNumber: string;
    slot: string;
    status: string;
  }>;
  riserList?: Array<{
    boardId: string;
    firmware: string;
    manufacturer: string;
    model: string;
    name: string;
    partNumber: string;
    pcbVersion: string;
    serialNumber: string;
    slot: string;
    status: string;
    type: string;
  }>;
  driveBackplaneList?: Array<{
    boardId: string;
    cpldVersion: string;
    firmware: string;
    location: string;
    manufacturer: string;
    model: string;
    name: string;
    number: string;
    partNumber: string;
    pcbVersion: string;
    serialNumber: string;
    status: string;
    type: string;
  }>;
}
