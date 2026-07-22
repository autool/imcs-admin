export interface tagsType {
  ip_address: string; // IP地址
  id: string;
  model_name: string; // 型号
  brand_name: string; // 品牌
  serial_number: string; // 序列号
  tag_number: string;
  loc: string;
  cabinet: string;
  uPosition: string;
  asset_person: string;
  addDate: string; // 添加时间
}

export interface TagsData {
  code: number;
  // RowType 或者空
  data: '';
  error: string;
  message: string;
}
