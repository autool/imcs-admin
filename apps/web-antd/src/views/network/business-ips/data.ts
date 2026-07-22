import { useAccess } from '@vben/access';

export function useBusinessIPActions() {
  const { hasAccessByCodes } = useAccess();

  return {
    canView: hasAccessByCodes(['network_business_ips:view']),
    canAdd: hasAccessByCodes(['network_business_ips:add']),
    canEdit: hasAccessByCodes(['network_business_ips:edit']),
    canDelete: hasAccessByCodes(['network_business_ips:delete']),
    canExport: hasAccessByCodes(['network_business_ips:export']),
  };
}
