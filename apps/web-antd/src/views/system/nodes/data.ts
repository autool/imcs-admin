import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Tag } from 'ant-design-vue';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '搜索节点名称或主机地址',
      },
      fieldName: 'search',
      label: '关键词',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '服务器 Agent', value: 'servers' },
          { label: '安全 Agent', value: 'security' },
          { label: '通用 Agent', value: 'agent' },
          { label: 'Worker节点', value: 'worker' },
          { label: '报表节点', value: 'report' },
        ],
        placeholder: '全部类型',
      },
      fieldName: 'node_type',
      label: '节点类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '活跃', value: 'active' },
          { label: '警告', value: 'warning' },
          { label: '错误', value: 'error' },
          { label: '离线', value: 'offline' },
          { label: '维护中', value: 'maintenance' },
        ],
        placeholder: '全部状态',
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useColumns(onActionClick: any): VxeGridProps['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canView = hasAccessByCodes(['system_nodes:view']);
  const canEdit = hasAccessByCodes(['system_nodes:edit']);
  const canDelete = hasAccessByCodes(['system_nodes:delete']);

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
      field: 'id',
      title: '节点ID',
      width: 100,
    },
    {
      align: 'center',
      field: 'name',
      minWidth: 150,
      title: '节点名称',
    },
    {
      align: 'center',
      field: 'host',
      minWidth: 150,
      title: '主机地址',
    },
    {
      align: 'center',
      field: 'port',
      title: '端口',
      width: 100,
    },
    {
      align: 'center',
      field: 'node_type',
      slots: {
        default: ({ row }: any) => {
          const typeMap: Record<string, { color: string; text: string }> = {
            agent: { color: 'blue', text: '通用 Agent' },
            report: { color: 'geekblue', text: '报表节点' },
            server: { color: 'green', text: 'Server节点' },
            servers: { color: 'green', text: '服务器 Agent' },
            security: { color: 'purple', text: '安全 Agent' },
            worker: { color: 'orange', text: 'Worker节点' },
          };
          const type = typeMap[row.node_type] || {
            color: 'default',
            text: row.node_type,
          };
          return h(Tag, { color: type.color }, () => type.text);
        },
      },
      title: '节点类型',
      width: 120,
    },
    {
      align: 'center',
      field: 'status',
      slots: {
        default: ({ row }: any) => {
          const statusMap: Record<string, { color: string; text: string }> = {
            active: { color: 'success', text: '活跃' },
            healthy: { color: 'success', text: '健康' },
            offline: { color: 'default', text: '离线' },
            maintenance: { color: 'warning', text: '维护中' },
            warning: { color: 'warning', text: '警告' },
            error: { color: 'error', text: '错误' },
          };
          const status = statusMap[row.status] || {
            color: 'default',
            text: row.status,
          };
          return h(Tag, { color: status.color }, () => status.text);
        },
      },
      title: '状态',
      width: 100,
    },
    {
      align: 'center',
      field: 'description',
      minWidth: 200,
      showOverflow: true,
      title: '描述',
    },
    {
      align: 'center',
      field: 'last_heartbeat',
      formatter: ({ cellValue }: any) => {
        return cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '-';
      },
      title: '最后心跳',
      width: 180,
    },
    {
      align: 'center',
      field: 'created_at',
      formatter: ({ cellValue }: any) => {
        return cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '';
      },
      title: '创建时间',
      width: 180,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          const buttons = [];

          if (canView) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'history', row }),
                },
                () => '历史',
              ),
            );
          }

          if (canEdit) {
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

          if (canDelete) {
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
}
