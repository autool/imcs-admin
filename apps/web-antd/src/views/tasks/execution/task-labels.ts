export const taskTypeLabels: Record<string, string> = {
  node_timeout_check: 'Agent 节点心跳超时检查',
  reports_scan_pending: '报表到期任务扫描',
  server_alarm_policy_scan: '服务器告警工单策略扫描',
  servers_alerts: '服务器告警兜底扫描',
  servers_cache_repush: '服务器缓存补传',
  servers_device_discovery: '服务器设备发现',
  servers_event_subscription: 'EventService 订阅检查',
  servers_hardware: '采集设备硬件信息',
  servers_identity_sync: '服务器身份/IP 生命周期同步',
  servers_maintenance: '系统维护任务',
  servers_monitoring: '设备监控检查',
  servers_power_history: '采集设备电源历史',
  servers_power_info: '采集设备电源信息',
  servers_vpn_monitoring: '服务器 VPN 状态监控',
  vpn_monitor: 'VPN 状态监控',
  workflow_timeout_check: '流程节点超时检查',
};

export function getTaskTypeLabel(taskType?: string) {
  if (!taskType) return '-';
  return taskTypeLabels[taskType] || taskType;
}

export function getTaskExecutionDisplayName(row: {
  task_name?: string;
  task_type?: string;
}) {
  return row.task_name || getTaskTypeLabel(row.task_type);
}
