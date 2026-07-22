import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api';

import { h } from 'vue';

import { useAccess } from '@vben/access';

import { Tag } from 'ant-design-vue';

import { $t } from '#/locales';

function roleTypeColor(value?: number) {
  return value === 1 ? 'gold' : 'blue';
}

function roleTypeText(row: SystemRoleApi.SystemRole) {
  if (row.role_type_label) return row.role_type_label;
  return row.role_type === 1 ? '系统内置' : '自定义';
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: '角色代码',
      rules: 'required',
      help: '角色的唯一标识，用于权限控制（如：admin, user, operator）',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('system.role.status'),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: $t('system.role.remark'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('common.enabled'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
      },
      fieldName: 'status',
      label: $t('system.role.status'),
    },
    {
      component: 'Input',
      fieldName: 'remark',
      label: $t('system.role.remark'),
    },
    {
      component: 'RangePicker',
      fieldName: 'createTime',
      label: $t('system.role.createTime'),
    },
  ];
}

export function useColumns<T = SystemRoleApi.SystemRole>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canEdit = hasAccessByCodes(['system_role:edit']);
  const canDelete = hasAccessByCodes(['system_role:delete']);

  return [
    {
      type: 'seq',
      title: '序号',
      width: 60,
      fixed: 'left',
    },
    {
      field: 'name',
      title: $t('system.role.roleName'),
      width: 150,
    },
    {
      field: 'code',
      title: '角色代码',
      width: 150,
    },
    {
      align: 'center',
      field: 'role_type_label',
      slots: {
        default: ({ row }: { row: SystemRoleApi.SystemRole }) =>
          h(Tag, { color: roleTypeColor(row.role_type) }, () =>
            roleTypeText(row),
          ),
      },
      title: '角色类型',
      width: 110,
    },
    {
      cellRender: {
        attrs: { beforeChange: onStatusChange },
        name: canEdit && onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'status',
      title: $t('system.role.status'),
      width: 100,
    },
    {
      field: 'remark',
      minWidth: 100,
      title: $t('system.role.remark'),
    },
    {
      align: 'center',
      field: 'user_count',
      title: '绑定用户数',
      width: 110,
    },
    {
      align: 'center',
      field: 'menu_count',
      title: '菜单数',
      width: 90,
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 200,
    },
    {
      field: 'createTime',
      title: $t('system.role.createTime'),
      width: 200,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.role.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          ...(canEdit ? ['edit'] : []),
          ...(canDelete ? ['delete'] : []),
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.role.operation'),
      width: 130,
    },
  ];
}
