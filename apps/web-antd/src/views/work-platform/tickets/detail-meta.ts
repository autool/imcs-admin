import type { TicketsApi } from '#/api/operation/tickets';

export const approveOpinionPresets = [
  '已确认问题并完成处理，同意推进到下一节点',
  '已按流程完成核查，处理结果符合预期',
  '无需进一步处置，同意完成当前节点',
];

export const rejectOpinionPresets = [
  '信息不完整，请补充影响范围和复现步骤',
  '处理结果不满足闭环要求，请重新处置',
  '当前不符合推进条件，退回补充材料',
];

export const sourceActionHelp: Record<string, { desc: string; tone?: string }> =
  {
    close_alarm_source: {
      desc: '把关联告警标记为已确认/已处置，用于告警闭环。',
      tone: 'success',
    },
    create_followup_task: {
      desc: '创建一个后续工作任务，用于把未完成事项转到任务模块继续跟踪。',
    },
    rerun_task_execution: {
      desc: '重新运行关联的失败任务，用于验证问题是否已恢复。',
      tone: 'warning',
    },
  };

export const statusActionHelp: Record<
  string,
  { danger?: boolean; desc: string; label: string }
> = {
  closed: {
    danger: true,
    desc: '工单已经无需继续流转，归档结束。',
    label: '关闭',
  },
  pending: {
    desc: '等待外部条件、补充信息或暂不处理。',
    label: '挂起',
  },
};

export const priorityColor: Record<string, string> = {
  high: 'orange',
  low: 'default',
  medium: 'blue',
  urgent: 'red',
};

export const statusText: Record<string, string> = {
  closed: '已关闭',
  in_progress: '处理中',
  open: '待处理',
  pending: '挂起',
  resolved: '已归档',
};

interface SourceContextItem {
  key: string;
  label: string;
  value: any;
}

const sourceTypeText: Record<string, string> = {
  alarm: '服务器告警',
  feedback: '用户反馈',
  manual: '手工录入',
  node_timeout: '节点超时',
  task_failure: '任务失败',
  workflow_timeout: '流程超时',
};

const sourceFieldLabels: Record<string, Record<string, string>> = {
  alarm: {
    acknowledged: '是否确认',
    acknowledged_at: '确认时间',
    acknowledged_by: '确认人',
    action_note: '处置说明',
    alarm_code: '告警代码',
    alarm_id: '告警ID',
    alarm_time: '告警时间',
    alarm_type: '告警类型',
    asset_id: '资产ID',
    close_note: '处置说明',
    closed: '是否已关闭',
    code: '告警代码',
    component: '组件',
    device_ip: '设备IP',
    ip: '设备IP',
    level: '告警级别',
    message: '告警内容',
    resolved: '是否闭环',
    resolved_at: '闭环时间',
    severity: '严重级别',
    source: '来源系统',
    status: '告警状态',
    timestamp: '发生时间',
    title: '告警标题',
  },
  node_timeout: {
    host: '主机地址',
    hostname: '主机名',
    id: '节点ID',
    last_heartbeat: '最后心跳',
    name: '节点名称',
    node_id: '节点ID',
    node_name: '节点名称',
    reason: '超时原因',
    status: '节点状态',
    updated_at: '更新时间',
  },
  task_failure: {
    celery_task_id: 'Celery任务ID',
    created_at: '创建时间',
    created_by: '创建人',
    dispatch_mode: '派发方式',
    end_time: '结束时间',
    error: '错误信息',
    error_message: '错误信息',
    executed_at: '执行时间',
    execution_id: '执行记录ID',
    failed_count: '失败数',
    failure_category: '失败分类',
    failure_summary: '失败说明',
    cleanup_source: '收口来源',
    report_id: '报表ID',
    rerunnable: '是否可重跑',
    scheduled_time: '计划执行时间',
    start_time: '开始时间',
    status: '执行状态',
    system_closed: '系统收口',
    task_id: '任务ID',
    task_name: '任务名称',
    task_type: '任务类型',
    template_id: '模板ID',
    total_count: '总数',
  },
  workflow_timeout: {
    assignee_id: '节点处理人',
    node_id: '节点ID',
    node_name: '节点名称',
    record_id: '流程记录ID',
    started_at: '开始时间',
    timeout_minutes: '超时时长',
  },
};

const genericSourceFieldLabels: Record<string, string> = {
  created_at: '创建时间',
  description: '说明',
  id: 'ID',
  name: '名称',
  ref_id: '来源ID',
  source_ref_id: '来源ID',
  source_type: '来源类型',
  title: '标题',
  type: '类型',
  updated_at: '更新时间',
};

const preferredSourceFields: Record<string, string[]> = {
  alarm: [
    'alarm_id',
    'id',
    'device_ip',
    'ip',
    'level',
    'severity',
    'component',
    'alarm_code',
    'code',
    'title',
    'message',
    'alarm_time',
    'timestamp',
    'status',
    'acknowledged',
    'acknowledged_by',
    'acknowledged_at',
    'closed',
    'resolved',
    'resolved_at',
    'close_note',
    'action_note',
  ],
  node_timeout: [
    'node_id',
    'id',
    'node_name',
    'name',
    'hostname',
    'host',
    'status',
    'last_heartbeat',
    'updated_at',
    'reason',
  ],
  task_failure: [
    'task_name',
    'task_type',
    'status',
    'scheduled_time',
    'start_date',
    'end_date',
    'executed_at',
    'created_at',
    'created_by',
    'report_id',
    'template_id',
    'failed_count',
    'total_count',
    'failure_category',
    'failure_summary',
    'cleanup_source',
    'system_closed',
    'start_time',
    'end_time',
    'rerunnable',
    'error_message',
    'error',
  ],
  workflow_timeout: [
    'record_id',
    'node_id',
    'node_name',
    'assignee_id',
    'started_at',
    'timeout_minutes',
  ],
};

export function renderSourceValue(value: any) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? '是' : '否';
  if (Array.isArray(value)) return `${value.length} 项`;
  if (typeof value === 'object') {
    if ('length' in value && 'sha256' in value) {
      return `已隐藏原文，长度 ${value.length}，摘要 ${value.sha256}`;
    }
    if ('count' in value) {
      return `${value.count} 项${value.truncated ? '，已截断' : ''}`;
    }
    if ('key_count' in value) {
      return `${value.key_count} 个字段：${(value.keys || []).join('、')}`;
    }
    const text = JSON.stringify(value);
    return text.length > 300 ? `${text.slice(0, 300)}...` : text;
  }
  return String(value);
}

export function getSourceTypeLabel(type?: string) {
  return sourceTypeText[type || ''] || type || '未知来源';
}

function getSourceFieldLabel(type: string, key: string) {
  return (
    sourceFieldLabels[type]?.[key] ||
    genericSourceFieldLabels[key] ||
    key.replaceAll('_', ' ')
  );
}

export function sourceContextItems(
  source?: TicketsApi.ClosureContext['source'],
) {
  if (!source?.data) return [];
  const data = source.data;
  const type = source.type || '';
  const usedKeys = new Set<string>();
  const items: SourceContextItem[] = [];

  for (const key of preferredSourceFields[type] || []) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      usedKeys.add(key);
      items.push({
        key,
        label: getSourceFieldLabel(type, key),
        value: data[key],
      });
    }
  }

  for (const [key, value] of Object.entries(data)) {
    if (usedKeys.has(key)) continue;
    items.push({
      key,
      label: getSourceFieldLabel(type, key),
      value,
    });
  }

  return items;
}
