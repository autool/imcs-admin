import { useAccess } from '@vben/access';

export function useAlertConfigActions() {
  const { hasAccessByCodes } = useAccess();

  const permissions = {
    canView: hasAccessByCodes(['property_alert_config:view']),
    canAdd: hasAccessByCodes(['property_alert_config:add']),
    canEdit: hasAccessByCodes(['property_alert_config:edit']),
    canDelete: hasAccessByCodes(['property_alert_config:delete']),
    canEnable: hasAccessByCodes(['property_alert_config:enable']),
    canDisable: hasAccessByCodes(['property_alert_config:disable']),
    canTest: hasAccessByCodes(['property_alert_config:test']),
  };

  return permissions;
}
