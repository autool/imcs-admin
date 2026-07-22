import { useAccess } from '@vben/access';

export function useRegionManagementActions() {
  const { hasAccessByCodes } = useAccess();

  const permissions = {
    canView: hasAccessByCodes(['property_region_management:view']),
    canAdd: hasAccessByCodes(['property_region_management:add']),
    canEdit: hasAccessByCodes(['property_region_management:edit']),
    canDelete: hasAccessByCodes(['property_region_management:delete']),
    canLock: hasAccessByCodes(['property_region_management:lock']),
    canUnlock: hasAccessByCodes(['property_region_management:unlock']),
  };

  return permissions;
}
