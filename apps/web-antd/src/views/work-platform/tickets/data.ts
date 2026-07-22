import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { useAccess } from '@vben/access';

import { EyeOutlined, UserSwitchOutlined } from '@ant-design/icons-vue';
import { Button } from 'ant-design-vue';

const statusOptions = [
  { label: '待处理', value: 'open' },
  { label: '处理中', value: 'in_progress' },
  { label: '挂起', value: 'pending' },
  { label: '已归档', value: 'resolved' },
  { label: '已关闭', value: 'closed' },
];

const priorityOptions = [
  { label: '低', value: 'low' },
  { label: '中', value: 'medium' },
  { label: '高', value: 'high' },
  { label: '紧急', value: 'urgent' },
];

const typeOptions = [
  { label: '事件', value: 'incident' },
  { label: '请求', value: 'request' },
  { label: '问题', value: 'problem' },
  { label: '变更', value: 'change' },
];

const sourceTypeOptions = [
  { label: '手动', value: 'manual' },
  { label: '反馈', value: 'feedback' },
  { label: '告警', value: 'alarm' },
  { label: '任务失败', value: 'task_failure' },
  { label: '节点超时', value: 'node_timeout' },
];

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '搜索标题或描述' },
      fieldName: 'search',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: statusOptions,
        placeholder: '全部状态',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: typeOptions,
        placeholder: '全部类型',
      },
      fieldName: 'type',
      label: '类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: priorityOptions,
        placeholder: '全部优先级',
      },
      fieldName: 'priority',
      label: '优先级',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: sourceTypeOptions,
        placeholder: '全部来源',
      },
      fieldName: 'source_type',
      label: '来源',
    },
  ];
}

export function useColumns(
  onActionClick: (e: { code: string; row: any }) => void,
): VxeGridProps['columns'] {
  const { hasAccessByCodes } = useAccess();

  return [
    { type: 'seq', width: 50 },
    { field: 'title', title: '工单标题', minWidth: 260, showOverflow: true },
    {
      field: 'type',
      title: '类型',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '事件', value: 'incident', color: 'error' },
          { label: '请求', value: 'request', color: 'primary' },
          { label: '问题', value: 'problem', color: 'warning' },
          { label: '变更', value: 'change', color: 'default' },
        ],
      },
    },
    {
      field: 'priority',
      title: '优先级',
      width: 90,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '低', value: 'low', color: 'default' },
          { label: '中', value: 'medium', color: 'warning' },
          { label: '高', value: 'high', color: 'error' },
          { label: '紧急', value: 'urgent', color: 'error' },
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
          { label: '待处理', value: 'open', color: 'processing' },
          { label: '处理中', value: 'in_progress', color: 'warning' },
          { label: '挂起', value: 'pending', color: 'default' },
          { label: '已归档', value: 'resolved', color: 'success' },
          { label: '已关闭', value: 'closed', color: 'success' },
        ],
      },
    },
    {
      field: 'source_type',
      title: '来源',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: [
          { label: '手动', value: 'manual', color: 'default' },
          { label: '反馈', value: 'feedback', color: 'primary' },
          { label: '告警', value: 'alarm', color: 'error' },
          { label: '任务失败', value: 'task_failure', color: 'warning' },
          { label: '节点超时', value: 'node_timeout', color: 'warning' },
        ],
      },
    },
    {
      field: 'assignee_id',
      title: '处理人',
      width: 140,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'department',
      title: '部门',
      width: 120,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 180,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
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
          if (hasAccessByCodes(['wp_tickets:view'])) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'detail', row }),
                },
                () => [h(EyeOutlined), '详情'],
              ),
            );
          }
          if (
            row.status === 'open' &&
            hasAccessByCodes(['wp_tickets:assign'])
          ) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'assign', row }),
                },
                () => [h(UserSwitchOutlined), '分配'],
              ),
            );
          }
          return h('div', { class: 'flex gap-2' }, buttons);
        },
      },
      title: '操作',
      width: 150,
    },
  ];
}
