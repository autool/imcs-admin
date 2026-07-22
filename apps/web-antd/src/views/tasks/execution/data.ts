import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Tag } from 'ant-design-vue';

import {
  getTaskExecutionDisplayName,
  getTaskTypeLabel,
  taskTypeLabels,
} from './task-labels';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '搜索任务名称',
      },
      fieldName: 'search',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(taskTypeLabels).map(([value, label]) => ({
          label,
          value,
        })),
        placeholder: '全部类型',
      },
      fieldName: 'task_type',
      label: '任务类型',
    },
  ];
}

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridProps['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canView = hasAccessByCodes(['tasks_execution:view']);

  return [
    {
      align: 'center',
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 70,
    },
    {
      align: 'center',
      field: 'task_name',
      slots: {
        default: ({ row }: any) => getTaskExecutionDisplayName(row),
      },
      minWidth: 200,
      title: '任务名称',
    },
    {
      align: 'center',
      field: 'task_type',
      slots: {
        default: ({ row }: any) => {
          return getTaskTypeLabel(row.task_type);
        },
      },
      title: '任务类型',
      width: 150,
    },
    {
      align: 'center',
      field: 'total_executions',
      title: '执行次数',
      width: 100,
    },
    {
      align: 'center',
      field: 'success_count',
      slots: {
        default: ({ row }: any) => {
          return h(Tag, { color: 'success' }, () => row.success_count || 0);
        },
      },
      title: '成功次数',
      width: 100,
    },
    {
      align: 'center',
      field: 'failed_count',
      slots: {
        default: ({ row }: any) => {
          return h(Tag, { color: 'error' }, () => row.failed_count || 0);
        },
      },
      title: '业务失败',
      width: 100,
    },
    {
      align: 'center',
      field: 'cleanup_count',
      slots: {
        default: ({ row }: any) => {
          return h(Tag, { color: 'warning' }, () => row.cleanup_count || 0);
        },
      },
      title: '收口次数',
      width: 100,
    },
    {
      align: 'center',
      field: 'last_execution_status',
      slots: {
        default: ({ row }: any) => {
          const statusMap: Record<string, { color: string; text: string }> = {
            success: { color: 'success', text: '成功' },
            failed: { color: 'error', text: '失败' },
            partial: { color: 'warning', text: '部分成功' },
            running: { color: 'processing', text: '运行中' },
            submitted: { color: 'processing', text: '已投递' },
            agent_pending: { color: 'purple', text: '等待Agent拉取' },
            rerun_requested: { color: 'purple', text: '等待Agent执行' },
            skipped: { color: 'default', text: '已跳过' },
            warning: { color: 'warning', text: '警告' },
            archived: { color: 'default', text: '已归档' },
          };
          const status = statusMap[row.last_execution_status] || {
            color: 'default',
            text: row.last_execution_status || '-',
          };
          return h(Tag, { color: status.color }, () => status.text);
        },
      },
      title: '最近状态',
      width: 120,
    },
    {
      align: 'center',
      field: 'last_execution_time',
      formatter: ({ cellValue }: any) => {
        return cellValue
          ? new Date(cellValue).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '-';
      },
      title: '最近执行时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          if (!canView) return [];
          return h(
            Button,
            {
              size: 'small',
              type: 'link',
              onClick: () => onActionClick({ code: 'view', row }),
            },
            () => '查看执行记录',
          );
        },
      },
      title: '操作',
      width: 150,
    },
  ];
}
