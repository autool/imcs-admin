import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Button, Tag } from 'ant-design-vue';

// 格式化时间
function formatTime(cellValue: string) {
  if (!cellValue) return '';
  const date = new Date(cellValue);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleString('zh-CN');
}

export function useColumns(onActionClick: any): VxeGridProps['columns'] {
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
      field: 'is_read',
      slots: {
        default: ({ row }: any) => {
          return row.is_read
            ? h(Tag, { color: 'default' }, () => '已读')
            : h(Tag, { color: 'processing' }, () => '未读');
        },
      },
      title: '状态',
      width: 100,
    },
    {
      align: 'center',
      field: 'level',
      slots: {
        default: ({ row }: any) => {
          const levelMap: Record<string, { color: string; text: string }> = {
            success: { color: 'success', text: '成功' },
            info: { color: 'blue', text: '信息' },
            warning: { color: 'orange', text: '警告' },
            error: { color: 'red', text: '错误' },
          };
          const level = levelMap[row.level] || {
            color: 'default',
            text: row.level,
          };
          return h(Tag, { color: level.color }, () => level.text);
        },
      },
      title: '级别',
      width: 100,
    },
    {
      align: 'left',
      field: 'title',
      minWidth: 200,
      title: '标题',
    },
    {
      align: 'left',
      field: 'content',
      minWidth: 300,
      showOverflow: true,
      title: '内容',
    },
    {
      align: 'center',
      field: 'created_at',
      formatter: ({ cellValue }: any) => formatTime(cellValue),
      title: '时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          const buttons = [
            // 标记已读按钮 - 已读时禁用
            h(
              Button,
              {
                disabled: row.is_read,
                size: 'small',
                type: 'link',
                onClick: () =>
                  !row.is_read && onActionClick({ code: 'read', row }),
              },
              () => '标记已读',
            ),
            // 详情按钮 - 始终可用
            h(
              Button,
              {
                size: 'small',
                type: 'link',
                onClick: () => onActionClick({ code: 'view', row }),
              },
              () => '详情',
            ),
          ];
          const canGo =
            row.data?.route ||
            row.data?.ticket_id ||
            row.data?.node_id ||
            row.data?.task_id ||
            row.data?.report_id;
          if (canGo) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'go', row }),
                },
                () => '去处理',
              ),
            );
          }

          return h('div', { class: 'flex gap-2' }, buttons);
        },
      },
      title: '操作',
      width: 230,
    },
  ];
}
