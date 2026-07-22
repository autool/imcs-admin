import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { useAccess } from '@vben/access';
import { getPopupContainer } from '@vben/utils';

import { z } from '#/adapter/form';
import { getRegionList } from '#/api/system';
import { getDeptList } from '#/api/system/dept';
import { getRoleList } from '#/api/system/role';
import { $t } from '#/locales';

export function getAuthTypeOptions() {
  return [
    { color: 'default', label: '本地认证', value: 'local' },
    { color: 'processing', label: 'LDAP', value: 'ldap' },
    { color: 'success', label: 'OAuth2', value: 'oauth2' },
  ];
}

export function getDirectoryStatusOptions() {
  return [
    { color: 'success', label: '目录正常', value: 'active' },
    { color: 'error', label: '目录停用', value: 'disabled' },
    { color: 'default', label: '-', value: '' },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      dependencies: {
        disabled: (values) => values.auth_type === 'ldap',
        triggerFields: ['auth_type'],
      },
      fieldName: 'username',
      label: $t('system.user.username'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.user.username'), 2]))
        .max(20, $t('ui.formRules.maxLength', [$t('system.user.username'), 20]))
        .nonempty($t('ui.formRules.required', [$t('system.user.username')])),
    },
    {
      component: 'Input',
      dependencies: {
        disabled: (values) => values.auth_type === 'ldap',
        triggerFields: ['auth_type'],
      },
      fieldName: 'full_name',
      label: $t('system.user.fullName'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.user.fullName'), 2]))
        .max(20, $t('ui.formRules.maxLength', [$t('system.user.fullName'), 20]))
        .nonempty($t('ui.formRules.required', [$t('system.user.fullName')])),
    },
    {
      component: 'Input',
      dependencies: {
        disabled: (values) => values.auth_type === 'ldap',
        triggerFields: ['auth_type'],
      },
      fieldName: 'email',
      label: $t('system.user.email'),
      rules: z.string().email('请输入正确的邮箱'),
    },
    {
      component: 'Input',
      dependencies: {
        disabled: (values) => values.auth_type === 'ldap',
        triggerFields: ['auth_type'],
      },
      fieldName: 'tel',
      label: $t('system.user.mobilePhone'),
      rules: z
        .string()
        .min(
          11,
          $t('ui.formRules.minLength', [$t('system.user.mobilePhone'), 11]),
        )
        .max(
          11,
          $t('ui.formRules.maxLength', [$t('system.user.mobilePhone'), 11]),
        )
        .nonempty($t('ui.formRules.required', [$t('system.user.mobilePhone')])),
    },
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.password'),
      },
      dependencies: {
        disabled: (values) => values.auth_type === 'ldap',
        triggerFields: ['auth_type'],
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      renderComponentContent() {
        return {
          strengthText: () => $t('authentication.passwordStrength'),
        };
      },
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const res = await getDeptList();
          return res.list;
        },
        childrenField: 'children',
        class: 'w-full',
        filterTreeNode(input: string, node: Recordable<any>) {
          if (!input) return true;
          return String(node.name || '').includes(input);
        },
        getPopupContainer,
        labelField: 'name',
        showSearch: true,
        treeDefaultExpandAll: true,
        valueField: 'id',
      },
      dependencies: {
        disabled: (values) => values.auth_type === 'ldap',
        triggerFields: ['auth_type'],
      },
      fieldName: 'department_id',
      label: $t('system.user.department'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const res = await getRegionList();
          const allOption = { region_id: 'all', region_name: '全部区域' };
          return [allOption, ...(res.list || [])];
        },
        class: 'w-full',
        labelField: 'region_name',
        valueField: 'region_id',
      },
      fieldName: 'region_id',
      label: '所属区域',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const res = await getRoleList({});
          return res.list || [];
        },
        class: 'w-full',
        labelField: 'name',
        mode: 'multiple',
        valueField: 'id',
      },
      fieldName: 'roles',
      help: '管理员身份会根据所选角色自动判断，不再单独设置。',
      label: $t('system.user.position'),
      rules: z
        .array(z.string())
        .min(1, $t('ui.formRules.required', [$t('system.user.position')])),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('system.user.unlocked'), value: false },
          { label: $t('system.user.locked'), value: true },
        ],
        optionType: 'button',
      },
      defaultValue: false,
      fieldName: 'is_locked',
      label: $t('system.user.status'),
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        class: 'w-full',
        placeholder: '输入用户名',
      },
      fieldName: 'username',
      label: $t('system.user.username'),
    },
    {
      component: 'Input',
      componentProps: {
        class: 'w-full',
        placeholder: '输入姓名',
      },
      fieldName: 'full_name',
      label: $t('system.user.fullName'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: [
          { label: $t('system.user.unlocked'), value: false },
          { label: $t('system.user.locked'), value: true },
        ],
        placeholder: '全部状态',
      },
      fieldName: 'is_locked',
      label: $t('system.user.status'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-full',
        options: [
          { label: '目录正常', value: false },
          { label: '目录停用', value: true },
        ],
        placeholder: '全部目录状态',
      },
      fieldName: 'ldap_disabled',
      label: '目录状态',
    },
    {
      component: 'RangePicker',
      componentProps: {
        class: 'w-full',
      },
      fieldName: 'create_time',
      label: $t('system.user.createTime'),
    },
  ];
}

export function useColumns<T = SystemUserApi.SystemUser>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
): VxeTableGridOptions['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canEdit = hasAccessByCodes(['system_user:edit']);
  const canDelete = hasAccessByCodes(['system_user:delete']);

  return [
    {
      field: 'username',
      minWidth: 100,
      title: $t('system.user.username'),
    },
    {
      field: 'full_name',
      minWidth: 100,
      title: $t('system.user.fullName'),
    },
    {
      field: 'email',
      minWidth: 150,
      title: $t('system.user.email'),
    },
    {
      field: 'mobile_phone',
      minWidth: 120,
      title: $t('system.user.mobilePhone'),
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getAuthTypeOptions() },
      field: 'auth_type',
      title: '认证方式',
      width: 110,
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getDirectoryStatusOptions() },
      field: 'directory_status',
      title: '目录状态',
      width: 110,
    },
    {
      field: 'department',
      minWidth: 100,
      title: $t('system.user.department'),
    },
    {
      field: 'region_name',
      minWidth: 100,
      title: '所属区域',
    },
    {
      cellRender: {
        name: 'CellTag',
      },
      field: 'role_names',
      minWidth: 150,
      title: '角色',
    },
    {
      cellRender: {
        attrs: {
          beforeChange: onStatusChange,
        },
        props: {
          checkedValue: false,
          unCheckedValue: true,
        },
        name: canEdit && onStatusChange ? 'CellSwitch' : 'CellTag',
      },
      field: 'is_locked',
      title: $t('system.user.status'),
      width: 120,
    },
    {
      field: 'create_time',
      title: $t('system.user.createTime'),
      width: 180,
    },
    {
      field: 'last_login',
      title: $t('system.user.lastLogin'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: $t('system.user.username'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          ...(canEdit ? ['edit'] : []),
          ...(canDelete
            ? [
                {
                  code: 'delete',
                  disabled: (row: SystemUserApi.SystemUser) => {
                    return row.username === 'admin';
                  },
                },
              ]
            : []),
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.user.operation'),
      width: 130,
    },
  ];
}
