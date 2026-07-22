import { useAccess } from '@vben/access';

export function useVLANActions() {
  const { hasAccessByCodes } = useAccess();

  return {
    canView: hasAccessByCodes(['network_vlans:view']),
    canAdd: hasAccessByCodes(['network_vlans:add']),
    canEdit: hasAccessByCodes(['network_vlans:edit']),
    canDelete: hasAccessByCodes(['network_vlans:delete']),
    canExport: hasAccessByCodes(['network_vlans:export']),
  };
}
