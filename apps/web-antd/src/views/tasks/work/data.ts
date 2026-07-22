import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { useAccess } from '@vben/access';

import { Button } from 'ant-design-vue';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '搜索任务标题',
      },
      fieldName: 'search',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '待办', value: 'pending' },
          { label: '已办', value: 'completed' },
          { label: '已取消', value: 'cancelled' },
        ],
        placeholder: '全部状态',
      },
      defaultValue: 'pending',
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '低', value: 0 },
          { label: '中', value: 1 },
          { label: '高', value: 2 },
        ],
        placeholder: '请选择优先级',
      },
      fieldName: 'priority',
      label: '优先级',
    },
  ];
}

export function useColumns(onActionClick: any): VxeGridProps['columns'] {
  const { hasAccessByCodes } = useAccess();

  const columns: VxeGridProps['columns'] = [
    {
      type: 'seq',
      width: 50,
    },
    {
      field: 'title',
      title: '任务标题',
      minWidth: 200,
    },
    {
      field: 'description',
      title: '任务描述',
      minWidth: 200,
      showOverflow: true,
    },
    {
      field: 'task_type',
      title: '任务类型',
      width: 120,
    },
    {
      field: 'priority',
      title: '优先级',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '低', value: 0, color: 'default' },
          { label: '中', value: 1, color: 'warning' },
          { label: '高', value: 2, color: 'error' },
        ],
      },
    },
    {
      field: 'status',
      title: '状态',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '待办', value: 'pending', color: 'processing' },
          { label: '已办', value: 'completed', color: 'success' },
          { label: '已取消', value: 'cancelled', color: 'default' },
        ],
      },
    },
    {
      field: 'assigned_to',
      title: '负责人',
      width: 120,
    },
    {
      field: 'due_date',
      title: '截止日期',
      width: 180,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        return new Date(cellValue).toLocaleString('zh-CN');
      },
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 180,
      formatter: ({ cellValue }) => {
        return new Date(cellValue).toLocaleString('zh-CN');
      },
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          const buttons = [];

          // 编辑
          if (hasAccessByCodes(['tasks_work:edit'])) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'edit', row }),
                },
                () => '编辑',
              ),
            );
          }

          // 完成
          if (
            row.status === 'pending' &&
            hasAccessByCodes(['tasks_work:edit'])
          ) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'complete', row }),
                },
                () => '完成',
              ),
            );
          }

          // 删除
          if (hasAccessByCodes(['tasks_work:delete'])) {
            buttons.push(
              h(
                Button,
                {
                  danger: true,
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'delete', row }),
                },
                () => '删除',
              ),
            );
          }

          return h('div', { class: 'flex gap-2' }, buttons);
        },
      },
      title: '操作',
      width: 200,
    },
  ];

  return columns;
}
