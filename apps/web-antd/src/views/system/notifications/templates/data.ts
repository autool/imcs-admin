import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Tag, Tooltip } from 'ant-design-vue';

export interface NotificationTypeMeta {
  color: string;
  group: string;
  label: string;
  value: string;
}

export const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
  alert_test: {
    color: 'gold',
    group: '告警',
    label: '告警通道测试',
    value: 'alert_test',
  },
  alert_triggered: {
    color: 'red',
    group: '告警',
    label: '监控告警触发',
    value: 'alert_triggered',
  },
  node_recovered: {
    color: 'green',
    group: '节点',
    label: '节点恢复',
    value: 'node_recovered',
  },
  node_timeout: {
    color: 'orange',
    group: '节点',
    label: '节点超时',
    value: 'node_timeout',
  },
  system_alert: {
    color: 'red',
    group: '系统',
    label: '系统告警',
    value: 'system_alert',
  },
  task_completed: {
    color: 'blue',
    group: '任务',
    label: '任务完成',
    value: 'task_completed',
  },
  task_failed: {
    color: 'red',
    group: '任务',
    label: '任务失败',
    value: 'task_failed',
  },
  work_ticket_assigned: {
    color: 'blue',
    group: '工单',
    label: '工单指派',
    value: 'work_ticket_assigned',
  },
  work_ticket_auto_recovered: {
    color: 'green',
    group: '工单',
    label: '自动恢复',
    value: 'work_ticket_auto_recovered',
  },
  work_ticket_completed: {
    color: 'green',
    group: '工单',
    label: '工单完成',
    value: 'work_ticket_completed',
  },
  work_ticket_rejected: {
    color: 'volcano',
    group: '工单',
    label: '工单驳回',
    value: 'work_ticket_rejected',
  },
  work_ticket_resolved: {
    color: 'green',
    group: '工单',
    label: '工单已处理',
    value: 'work_ticket_resolved',
  },
  work_ticket_timeout: {
    color: 'orange',
    group: '工单',
    label: '工单超时',
    value: 'work_ticket_timeout',
  },
  work_ticket_timeout_rejected: {
    color: 'volcano',
    group: '工单',
    label: '超时驳回',
    value: 'work_ticket_timeout_rejected',
  },
  work_ticket_todo: {
    color: 'processing',
    group: '工单',
    label: '待办提醒',
    value: 'work_ticket_todo',
  },
};

function inferNotificationTypeMeta(type: string): NotificationTypeMeta {
  if (type.startsWith('work_ticket_')) {
    return {
      color: 'processing',
      group: '工单',
      label: '工单通知',
      value: type,
    };
  }
  if (type.startsWith('node_')) {
    return { color: 'orange', group: '节点', label: '节点通知', value: type };
  }
  if (type.startsWith('task_')) {
    return { color: 'blue', group: '任务', label: '任务通知', value: type };
  }
  if (type.startsWith('alert_')) {
    return { color: 'red', group: '告警', label: '告警通知', value: type };
  }
  return {
    color: 'default',
    group: '自定义',
    label: type || '未命名类型',
    value: type,
  };
}

export function getNotificationTypeMeta(type: string): NotificationTypeMeta {
  return NOTIFICATION_TYPE_META[type] || inferNotificationTypeMeta(type);
}

export function renderNotificationType(type: string) {
  const meta = getNotificationTypeMeta(type);
  return h(
    Tooltip,
    {
      title: `${meta.group} / ${meta.value}`,
    },
    {
      default: () =>
        h(
          Tag,
          {
            color: meta.color,
            class: 'notification-type-tag',
          },
          () => meta.label,
        ),
    },
  );
}

export function useColumns(onActionClick: any): VxeGridProps['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canEditTemplate = hasAccessByCodes(['notifications_templates:edit']);
  const canDeleteTemplate = hasAccessByCodes([
    'notifications_templates:delete',
  ]);

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
      field: 'name',
      minWidth: 150,
      title: '模板名称',
    },
    {
      align: 'left',
      field: 'type',
      slots: {
        default: ({ row }: any) => {
          return renderNotificationType(row.type);
        },
      },
      title: '通知类型',
      width: 150,
    },
    {
      align: 'left',
      field: 'title_template',
      minWidth: 200,
      showOverflow: true,
      title: '标题模板',
    },
    {
      align: 'left',
      field: 'content_template',
      minWidth: 300,
      showOverflow: true,
      title: '内容模板',
    },
    {
      align: 'center',
      field: 'use_external',
      slots: {
        default: ({ row }: any) => {
          if (row.use_external) {
            const channelCount = row.notification_channels?.length || 0;
            if (channelCount > 0) {
              return h(
                Tag,
                { color: 'success' },
                () => `已启用 (${channelCount}个渠道)`,
              );
            }
            return h(Tag, { color: 'success' }, () => '已启用 (全部渠道)');
          }
          return h(Tag, { color: 'default' }, () => '仅系统通知');
        },
      },
      title: '外部通知',
      width: 150,
    },
    {
      align: 'center',
      field: 'updated_at',
      formatter: ({ cellValue }: any) => {
        return cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '';
      },
      title: '更新时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          const actions = [];
          if (canEditTemplate) {
            actions.push(
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
          if (canDeleteTemplate) {
            actions.push(
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
          return actions;
        },
      },
      title: '操作',
      width: 150,
    },
  ];
}
