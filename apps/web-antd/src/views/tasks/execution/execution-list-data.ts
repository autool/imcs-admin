import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Space, Tag, Tooltip } from 'ant-design-vue';

function getFailureMeta(row: any) {
  if (row.failure_category === 'manual_cleanup') {
    return { color: 'warning', label: '人工收口' };
  }
  if (row.failure_category === 'system_cleanup') {
    return { color: 'warning', label: '系统收口' };
  }
  return { color: 'error', label: '业务失败' };
}

const activeStatuses = new Set([
  'agent_pending',
  'rerun_requested',
  'running',
  'submitted',
]);

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
};

export function useExecutionListColumns(
  onViewDetail: (row: any) => void,
  onCreateTicket: (row: any) => void,
  onRerun: (row: any) => void,
  onCloseStale: (row: any) => void,
): VxeGridProps['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canCreateTicket = hasAccessByCodes(['tasks_execution:view']);
  const canRerun = hasAccessByCodes(['tasks_scheduled:edit']);

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
      field: 'status',
      slots: {
        default: ({ row }: any) => {
          if (row.system_closed) {
            const { label } = getFailureMeta(row);
            return h(Tag, { color: 'warning' }, () => label);
          }
          const status = statusMap[row.status] || {
            color: 'default',
            text: row.status,
          };
          return h(Tag, { color: row.stale ? 'warning' : status.color }, () =>
            row.stale && activeStatuses.has(row.status)
              ? '疑似卡住'
              : status.text,
          );
        },
      },
      title: '状态',
      width: 120,
    },
    {
      align: 'center',
      field: 'failure_summary',
      slots: {
        default: ({ row }: any) => {
          if (!['failed', 'partial'].includes(row.status)) return '-';
          const summary =
            row.failure_summary || '业务执行失败，查看详情获取更多信息';
          const { color, label } = getFailureMeta(row);
          return h(Space, { size: 4 }, () => [
            h(Tag, { color }, () => label),
            h(Tooltip, { title: summary }, () =>
              h(
                'span',
                {
                  class:
                    'inline-block max-w-[180px] truncate align-middle text-xs text-gray-500',
                },
                summary,
              ),
            ),
          ]);
        },
      },
      title: '失败说明',
      width: 260,
    },
    {
      align: 'center',
      field: 'total',
      title: '总数',
      width: 80,
    },
    {
      align: 'center',
      field: 'collected',
      title: '成功数',
      width: 90,
    },
    {
      align: 'center',
      field: 'failed',
      title: '失败数',
      width: 90,
    },
    {
      align: 'center',
      field: 'start_time',
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
          : '';
      },
      title: '开始时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'end_time',
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
      title: '结束时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          const buttons = [
            h(
              Button,
              {
                size: 'small',
                type: 'link',
                onClick: () => onViewDetail(row),
              },
              () => '查看详情',
            ),
          ];
          if (
            canCreateTicket &&
            !row.system_closed &&
            ['failed', 'partial'].includes(row.status)
          ) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onCreateTicket(row),
                },
                () => '转工单',
              ),
            );
          }
          if (canRerun && (!activeStatuses.has(row.status) || row.stale)) {
            if (row.stale && activeStatuses.has(row.status)) {
              buttons.push(
                h(
                  Button,
                  {
                    danger: true,
                    size: 'small',
                    type: 'link',
                    onClick: () => onCloseStale(row),
                  },
                  () => '收口',
                ),
              );
            }
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onRerun(row),
                },
                () => '重跑',
              ),
            );
          }
          return h(Space, { size: 4 }, () => buttons);
        },
      },
      title: '操作',
      width: 210,
    },
  ];
}
