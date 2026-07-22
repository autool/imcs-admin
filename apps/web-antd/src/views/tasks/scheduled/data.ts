/**
 * 定时任务 - 表格配置
 */
import type { VbenFormSchema } from '@vben/common-ui';

import type { VxeGridProps } from '#/adapter/vxe-table';

import { h, ref } from 'vue';

import { useAccess } from '@vben/access';

import { Button, Tag, Tooltip } from 'ant-design-vue';

import { getNodesApi } from '#/api/system/nodes';
import { getTaskTypesApi } from '#/api/tasks/scheduled';

// 节点列表缓存
const nodeOptions = ref<Array<{ label: string; value: string }>>([]);
const nodeMap = ref<Record<string, string>>({});
const taskTypeOptions = ref<Array<{ label: string; value: string }>>([]);
const taskTypeMap = ref<Record<string, string>>({});

// 加载节点列表
export async function loadNodes() {
  try {
    const nodes = await getNodesApi();
    nodeOptions.value = nodes.map((node) => ({
      label: node.name,
      value: node.id,
    }));

    // 使用for循环替代reduce
    const map: Record<string, string> = {};
    for (const node of nodes) {
      map[node.id] = node.name;
    }
    nodeMap.value = map;
  } catch (error) {
    console.error('加载节点列表失败:', error);
  }
}

// 加载任务类型，避免任务类型展示和筛选在前端重复硬编码
export async function loadTaskTypes() {
  try {
    const taskTypes = await getTaskTypesApi();
    taskTypeOptions.value = taskTypes.map((item) => ({
      label: item.label,
      value: item.value,
    }));

    const map: Record<string, string> = {};
    for (const item of taskTypes) {
      map[item.value] = item.label;
    }
    taskTypeMap.value = map;
  } catch (error) {
    console.error('加载任务类型失败:', error);
  }
}

/**
 * 解析Cron表达式为中文描述
 */
export function parseCronExpression(cron: string): string {
  if (!cron) return '';

  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return cron;

  const minute = parts[0] || '*';
  const hour = parts[1] || '*';
  const day = parts[2] || '*';
  const month = parts[3] || '*';
  const weekday = parts[4] || '*';

  const descriptions: string[] = [];

  // 解析月份（最大单位）
  if (month !== '*') {
    const monthNames: Record<string, string> = {
      '1': '1月',
      '2': '2月',
      '3': '3月',
      '4': '4月',
      '5': '5月',
      '6': '6月',
      '7': '7月',
      '8': '8月',
      '9': '9月',
      '10': '10月',
      '11': '11月',
      '12': '12月',
    };
    if (month.includes(',')) {
      const months = month
        .split(',')
        .map((m) => monthNames[m] || m)
        .join('、');
      descriptions.push(`每${months}`);
    } else {
      descriptions.push(`每${monthNames[month] || month}`);
    }
  }

  // 解析日期
  if (day !== '*') {
    if (day.startsWith('*/')) {
      descriptions.push(`每${day.slice(2)}天`);
    } else if (day.includes(',')) {
      descriptions.push(`每月${day.replaceAll(',', '、')}日`);
    } else {
      descriptions.push(`每月${day}日`);
    }
  }

  // 解析星期
  if (weekday !== '*') {
    const weekNames: Record<string, string> = {
      '0': '周日',
      '1': '周一',
      '2': '周二',
      '3': '周三',
      '4': '周四',
      '5': '周五',
      '6': '周六',
      '7': '周日',
    };
    if (weekday.includes(',')) {
      const weeks = weekday
        .split(',')
        .map((w) => weekNames[w] || w)
        .join('、');
      descriptions.push(`每${weeks}`);
    } else {
      descriptions.push(`每${weekNames[weekday] || weekday}`);
    }
  }

  // 解析小时
  if (hour === '*') {
    if (minute !== '*' && !minute.startsWith('*/')) {
      descriptions.push('每小时');
    }
  } else if (hour.startsWith('*/')) {
    descriptions.push(`每${hour.slice(2)}小时`);
  } else if (hour.includes(',')) {
    descriptions.push(`每天${hour.replaceAll(',', '、')}点`);
  } else if (hour.includes('-')) {
    const [start, end] = hour.split('-');
    descriptions.push(`每天${start}-${end}点`);
  } else {
    descriptions.push(`每天${hour}点`);
  }

  // 解析分钟
  if (minute === '*') {
    descriptions.push('每分钟');
  } else if (minute.startsWith('*/')) {
    descriptions.push(`每${minute.slice(2)}分钟`);
  } else if (minute.includes(',')) {
    descriptions.push(`每小时第${minute.replaceAll(',', '、')}分钟`);
  } else if (minute.includes('-')) {
    const [start, end] = minute.split('-');
    descriptions.push(`每小时第${start}-${end}分钟`);
  } else if (minute !== '0') {
    descriptions.push(`每小时第${minute}分钟`);
  }

  return descriptions.length > 0 ? descriptions.join('，') : '自定义时间';
}

/**
 * 搜索表单配置
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入任务名称',
      },
      fieldName: 'search',
      label: '任务名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: nodeOptions,
        placeholder: '请选择节点',
      },
      fieldName: 'node_id',
      label: '所属节点',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: taskTypeOptions,
        placeholder: '请选择任务类型',
      },
      fieldName: 'task_type',
      label: '任务类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '已启用', value: true },
          { label: '已禁用', value: false },
        ],
        placeholder: '请选择状态',
      },
      fieldName: 'enabled',
      label: '状态',
    },
  ];
}

/**
 * 表格列配置
 */
export function useColumns(
  onActionClick: (params: any) => void,
  options: { archived?: () => boolean } = {},
): VxeGridProps['columns'] {
  const { hasAccessByCodes } = useAccess();
  const isArchivedView = () => Boolean(options.archived?.());
  const renderRuntime = (row: any) => {
    if (row.dispatch_mode === 'agent' || row.requires_node) {
      return h('div', { class: 'flex flex-col items-center gap-1' }, [
        h(Tag, { color: 'geekblue' }, () => 'Agent 拉取'),
        h('span', { class: 'text-xs text-gray-500' }, () =>
          row.node_id ? '节点执行' : '待绑定节点',
        ),
      ]);
    }
    return h('div', { class: 'flex flex-col items-center gap-1' }, [
      h(Tag, { color: 'green' }, () => 'Admin Celery'),
      h('span', { class: 'text-xs text-gray-500' }, () =>
        row.queue_name ? `${row.queue_name} 队列` : '默认队列',
      ),
    ]);
  };

  return [
    {
      align: 'center',
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 70,
    },
    {
      align: 'left',
      field: 'task_name',
      slots: {
        default: ({ row }: any) => {
          if (!isArchivedView()) return row.task_name;
          return h('div', { class: 'flex items-center gap-2' }, [
            h('span', row.task_name),
            h(
              Tag,
              { color: 'default' },
              () => `归档 ${row.archive_count || 1}`,
            ),
          ]);
        },
      },
      minWidth: 200,
      title: '任务名称',
    },
    {
      align: 'center',
      field: 'node_id',
      slots: {
        default: ({ row }: any) => {
          return nodeMap.value[row.node_id] || '-';
        },
      },
      title: '所属节点',
      width: 150,
    },
    {
      align: 'left',
      field: 'task_type',
      slots: {
        default: ({ row }: any) => {
          return taskTypeMap.value[row.task_type] || row.task_type;
        },
      },
      title: '任务类型',
      width: 150,
    },
    {
      align: 'center',
      field: 'dispatch_mode',
      slots: {
        default: ({ row }: any) => renderRuntime(row),
      },
      title: '执行归属',
      width: 130,
    },
    {
      align: 'center',
      field: 'schedule_rule',
      minWidth: 150,
      slots: {
        default: ({ row }: any) => {
          // schedule_rule现在是对象，包含cron和其他参数
          const scheduleRule = row.schedule_rule;
          let cronExpression = '';

          if (typeof scheduleRule === 'string') {
            // 兼容旧数据：如果是字符串，直接使用
            cronExpression = scheduleRule;
          } else if (scheduleRule && typeof scheduleRule === 'object') {
            // 新数据：从对象中提取cron
            cronExpression = scheduleRule.cron || '0 16 * * *';
          }

          const description = parseCronExpression(cronExpression);
          return h(
            Tag,
            {
              color: 'blue',
              title: description, // 鼠标悬停显示中文描述
            },
            () => cronExpression,
          );
        },
      },
      title: 'Cron表达式',
    },
    {
      align: 'center',
      field: 'next_run_at',
      formatter: ({ cellValue }: any) => {
        return cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '-';
      },
      title: '下次执行时间',
      width: 160,
    },
    {
      align: 'center',
      field: 'last_run_status',
      slots: {
        default: ({ row }: any) => {
          const status = row.last_run_status;
          if (!status) return '-';
          if (row.last_system_closed) {
            const label =
              row.last_failure_category === 'manual_cleanup'
                ? '人工收口'
                : '系统收口';
            return h(
              Tooltip,
              { title: row.last_failure_summary || label },
              () => h(Tag, { color: 'warning' }, () => label),
            );
          }

          const statusConfig: Record<string, { color: string; text: string }> =
            {
              success: { color: 'green', text: '成功' },
              failed: { color: 'red', text: '失败' },
              running: { color: 'blue', text: '运行中' },
              partial: { color: 'orange', text: '部分成功' },
              agent_pending: { color: 'purple', text: '等待Agent拉取' },
              archived: { color: 'default', text: '已归档' },
              rerun_requested: { color: 'purple', text: '等待Agent执行' },
              submitted: { color: 'cyan', text: '已提交' },
            };

          const config = statusConfig[status] || {
            color: 'default',
            text: status,
          };
          return h(Tag, { color: config.color }, () => config.text);
        },
      },
      title: '上次执行状态',
      width: 120,
    },
    {
      align: 'center',
      field: 'description',
      minWidth: 200,
      slots: {
        default: ({ row }: any) => {
          return row.description || '-';
        },
      },
      title: '任务描述',
    },
    {
      align: 'center',
      field: 'enabled',
      slots: {
        default: ({ row }: any) => {
          if (isArchivedView()) {
            return h(Tag, { color: 'default' }, () => '已归档');
          }
          return h(Tag, { color: row.enabled ? 'green' : 'default' }, () =>
            row.enabled ? '已启用' : '已禁用',
          );
        },
      },
      title: '状态',
      width: 100,
    },
    {
      align: 'center',
      field: 'created_at',
      formatter: ({ cellValue }: any) => {
        return cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '';
      },
      title: '创建时间',
      width: 160,
    },
    {
      align: 'center',
      field: 'updated_at',
      formatter: ({ cellValue }: any) => {
        return cellValue ? new Date(cellValue).toLocaleString('zh-CN') : '';
      },
      title: '更新时间',
      width: 160,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }: any) => {
          const buttons = [];

          // 查看详情 - 所有人都可以查看
          if (hasAccessByCodes(['tasks_scheduled:view'])) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'view', row }),
                },
                () => '详情',
              ),
            );
          }

          // 编辑
          if (!isArchivedView() && hasAccessByCodes(['tasks_scheduled:edit'])) {
            buttons.push(
              h(
                Button,
                {
                  size: 'small',
                  type: 'link',
                  onClick: () => onActionClick({ code: 'run', row }),
                },
                () => '执行',
              ),
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

          // 启用/禁用
          if (
            !isArchivedView() &&
            hasAccessByCodes([
              'tasks_scheduled:enable',
              'tasks_scheduled:disable',
            ])
          ) {
            buttons.push(
              row.enabled
                ? h(
                    Button,
                    {
                      size: 'small',
                      type: 'link',
                      onClick: () => onActionClick({ code: 'disable', row }),
                    },
                    () => '禁用',
                  )
                : h(
                    Button,
                    {
                      size: 'small',
                      type: 'link',
                      onClick: () => onActionClick({ code: 'enable', row }),
                    },
                    () => '启用',
                  ),
            );
          }

          // 删除
          if (
            !isArchivedView() &&
            hasAccessByCodes(['tasks_scheduled:delete'])
          ) {
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
      width: 260,
    },
  ];
}
