import { requestClient } from '#/api/request';

export namespace DeviceStatusApi {
  export interface DeviceStatusItem {
    server_id: string;
    ip_address: string;
    brand_name: string;
    model_name: string;
    is_live: number;
    power_state: string;
    last_error: null | string;
    connection_mode: 'eventservice' | 'eventservice_stale' | 'none' | 'polling';
    has_subscription: boolean;
    subscription_stale: boolean;
    event_alarm_count: number;
    last_event_at?: null | string;
    subscription_destination?: null | string;
    subscription_id?: null | string;
    subscription_last_verified?: null | string;
    unresolved_alarm_count: number;
    status_category:
      | 'auth_failed'
      | 'not_supported'
      | 'offline'
      | 'online_polling'
      | 'online_subscribed'
      | 'online_subscription_stale'
      | 'other_errors';
  }

  export interface DeviceStatusOverview {
    total: number;
    online_subscribed: number;
    online_subscription_stale: number;
    online_polling: number;
    offline: number;
    auth_failed: number;
    not_supported: number;
    other_errors: number;
    devices: DeviceStatusItem[];
    event_alarm_devices: number;
    event_alarm_total: number;
    unresolved_alarm_total: number;
  }

  export interface DeviceStatusOverviewParams {
    ip_address?: string;
  }
}

export async function getDeviceStatusOverview(
  params?: DeviceStatusApi.DeviceStatusOverviewParams,
) {
  return requestClient.get<DeviceStatusApi.DeviceStatusOverview>(
    '/devices/server/status-overview',
    { params },
  );
}
