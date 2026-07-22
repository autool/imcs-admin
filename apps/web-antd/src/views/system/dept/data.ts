import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemDeptApi } from '#/api/system/dept';

import { h } from 'vue';

import { useAccess } from '@vben/access';
import { getPopupContainer } from '@vben/utils';

import { Tag } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { getDeptList } from '#/api/system/dept';
import { $t } from '#/locales';

/**
 * 获取编辑表单的字段配置。如果没有使用多语言，可以直接export一个数组常量
 */
export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.dept.deptName'),
      rules: z
        .string()
        .min(2, $t('ui.formRules.minLength', [$t('system.dept.deptName'), 2]))
        .max(
          20,
          $t('ui.formRules.maxLength', [$t('system.dept.deptName'), 20]),
        ),
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: async () => {
          const res = await getDeptList();
          return res.list;
        },
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
        childrenField: 'children',
      },
      fieldName: 'pid',
      label: $t('system.dept.parentDept'),
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
      label: $t('system.dept.status'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 50,
        rows: 3,
        showCount: true,
      },
      fieldName: 'remark',
      label: $t('system.dept.remark'),
      rules: z
        .string()
        .max(50, $t('ui.formRules.maxLength', [$t('system.dept.remark'), 50]))
        .optional(),
    },
  ];
}

/**
 * 获取表格列配置
 * @description 使用函数的形式返回列数据而不是直接export一个Array常量，是为了响应语言切换时重新翻译表头
 * @param onActionClick 表格操作按钮点击事件
 */
export function useColumns(
  onActionClick?: OnActionClickFn<SystemDeptApi.SystemDept>,
): VxeTableGridOptions<SystemDeptApi.SystemDept>['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canAdd = hasAccessByCodes(['system_dept:add']);
  const canEdit = hasAccessByCodes(['system_dept:edit']);
  const canDelete = hasAccessByCodes(['system_dept:delete']);

  return [
    {
      align: 'center',
      field: 'name',
      fixed: 'left',
      title: $t('system.dept.deptName'),
      treeNode: true,
      width: 220,
    },
    {
      field: 'code',
      minWidth: 180,
      showOverflow: true,
      title: '部门编码',
    },
    {
      field: 'parent_name',
      minWidth: 180,
      showOverflow: true,
      title: '上级部门',
    },
    {
      align: 'center',
      field: 'source_label',
      slots: {
        default: ({ row }: { row: SystemDeptApi.SystemDept }) =>
          h(
            Tag,
            {
              color: row.source_type === 'ldap' ? 'blue' : 'default',
            },
            () => row.source_label || '本地部门',
          ),
      },
      title: '来源',
      width: 120,
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('system.dept.status'),
      width: 100,
    },
    {
      field: 'updateTime',
      title: '更新时间',
      width: 180,
    },
    {
      field: 'createTime',
      title: $t('system.dept.createTime'),
      width: 180,
    },
    {
      field: 'remark',
      minWidth: 220,
      showOverflow: true,
      title: $t('system.dept.remark'),
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.dept.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          ...(canAdd
            ? [
                {
                  code: 'append',
                  text: '新增下级',
                },
              ]
            : []),
          ...(canEdit ? ['edit'] : []),
          ...(canDelete
            ? [
                {
                  code: 'delete',
                  disabled: (row: SystemDeptApi.SystemDept) => {
                    return !!(row.children && row.children.length > 0);
                  },
                },
              ]
            : []),
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.dept.operation'),
      width: 200,
    },
  ];
}
