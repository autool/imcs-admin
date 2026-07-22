import { useAccess } from '@vben/access';

export function useAlertManagementActions() {
  const { hasAccessByCodes } = useAccess();

  const permissions = {
    canView: hasAccessByCodes(['property_alert_management:view']),
    canHandle: hasAccessByCodes(['property_alert_management:handle']),
    canAssign: hasAccessByCodes(['property_alert_management:assign']),
    canClose: hasAccessByCodes(['property_alert_management:close']),
    canExport: hasAccessByCodes(['property_alert_management:export']),
    canBatch: hasAccessByCodes(['property_alert_management:batch']),
  };

  return permissions;
}
