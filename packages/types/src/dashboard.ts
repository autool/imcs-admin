// @vben/types/dashboard.ts
export interface DashboardData {
  code: number;
  data: Array<{
    alarms_count?: number;
    assets_count?: number;
    backup_count?: number;
    day_alarms?: number;
    day_all_backup?: number;
    day_assets?: number;
    day_backup?: number;
    day_servers?: number;
    mouth_alarms?: number;
    mouth_assets?: number;
    mouth_servers?: number;
    servers_count?: number;
  }>;
  error: string;
  message: string;
}
