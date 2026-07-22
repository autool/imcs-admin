import { useAccess } from '@vben/access';

export function useVLANGroupActions() {
  const { hasAccessByCodes } = useAccess();

  return {
    canView: hasAccessByCodes(['network_vlan_groups:view']),
    canAdd: hasAccessByCodes(['network_vlan_groups:add']),
    canEdit: hasAccessByCodes(['network_vlan_groups:edit']),
    canDelete: hasAccessByCodes(['network_vlan_groups:delete']),
  };
}
