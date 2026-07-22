import type { TemplateApi } from '#/api/operation/template';

export type PresetTemplate = {
  code: string;
  description: string;
  key: string;
  name: string;
  nodes: Omit<TemplateApi.Node, 'id' | 'template_id'>[];
  source_types: string[];
};

export const sourceOptions = [
  { label: '手动', value: 'manual' },
  { label: '反馈', value: 'feedback' },
  { label: '告警', value: 'alarm' },
  { label: '任务失败', value: 'task_failure' },
  { label: '节点超时', value: 'node_timeout' },
];

export const sourceText = Object.fromEntries(
  sourceOptions.map((item) => [item.value, item.label]),
);

export const nodeTypeOptions = [
  { label: '处理', value: 'handler' },
  { label: '审批', value: 'approver' },
  { label: '通知', value: 'notifier' },
];

export const nodeTypeText = Object.fromEntries(
  nodeTypeOptions.map((item) => [item.value, item.label]),
);

export const assigneeTypeOptions = [
  { label: '指定用户', value: 'user' },
  { label: '指定角色', value: 'role' },
  { label: '指定部门', value: 'dept' },
  { label: '区域负责人', value: 'region' },
  { label: '来源字段', value: 'template_var' },
];

export const assigneeTypeText = Object.fromEntries(
  assigneeTypeOptions.map((item) => [item.value, item.label]),
);

export const actionOptions = [
  { label: '通过', value: 'approve' },
  { label: '驳回', value: 'reject' },
  { label: '转派', value: 'transfer' },
  { label: '关闭', value: 'close' },
];

export const actionText = Object.fromEntries(
  actionOptions.map((item) => [item.value, item.label]),
);

export const timeoutActionOptions = [
  { label: '创建超时工单', value: 'create_timeout_ticket' },
  { label: '自动通过', value: 'auto_approve' },
  { label: '自动驳回', value: 'auto_reject' },
];

export const timeoutActionText = Object.fromEntries(
  timeoutActionOptions.map((item) => [item.value, item.label]),
);

export const defaultAssigneeConfig = {
  help: '填写一个或多个角色编码，适合一线处理、主管审批等固定职责。',
  label: '角色编码',
  placeholder: 'admin, ops',
};

export const assigneeConfig: Record<
  string,
  { help: string; label: string; placeholder: string }
> = {
  dept: {
    help: '填写一个或多个部门 ID，系统会把待办派给该部门用户。',
    label: '部门 ID',
    placeholder: 'dept_ops, dept_security',
  },
  region: {
    help: '填写一个或多个区域 ID，适合按资产或节点归属派给区域负责人。',
    label: '区域 ID',
    placeholder: 'region_east',
  },
  role: {
    help: '填写一个或多个角色编码，适合一线处理、主管审批等固定职责。',
    label: '角色编码',
    placeholder: 'admin, ops',
  },
  template_var: {
    help: '填写工单来源数据里的字段名，系统会从来源上下文中取处理人。',
    label: '来源字段名',
    placeholder: 'requester_id',
  },
  user: {
    help: '直接选择一个或多个系统用户，适合固定负责人或小范围协作。',
    label: '指定用户',
    placeholder: '请选择用户',
  },
};

export const defaultAssigneeTarget: Record<string, string> = {
  dept: 'dept_id',
  region: 'region_id',
  role: 'admin',
  template_var: 'requester_id',
  user: '',
};

export const templatePresets: PresetTemplate[] = [
  {
    code: 'manual_flow',
    description: '手动创建的工作请求进入一线处理，必要时由主管确认。',
    key: 'manual',
    name: '手动工单流程',
    nodes: [
      {
        actions: ['approve', 'reject', 'transfer'],
        assignee_type: 'role',
        assignee_value: { role_codes: ['admin'] },
        node_name: '一线处理',
        node_type: 'handler',
        required: true,
        sort_order: 10,
      },
      {
        actions: ['approve', 'reject'],
        assignee_type: 'role',
        assignee_value: { role_codes: ['admin'] },
        node_name: '主管确认',
        node_type: 'approver',
        required: false,
        sort_order: 20,
      },
    ],
    source_types: ['manual'],
  },
  {
    code: 'alarm_flow',
    description: '告警先处置，再确认是否关闭，适合安全、监控、资产告警。',
    key: 'alarm',
    name: '告警处理流程',
    nodes: [
      {
        actions: ['approve', 'reject', 'transfer'],
        assignee_type: 'role',
        assignee_value: { role_codes: ['admin'] },
        node_name: '告警处置',
        node_type: 'handler',
        required: true,
        sort_order: 10,
        timeout_action: 'create_timeout_ticket',
        timeout_minutes: 120,
      },
      {
        actions: ['approve', 'reject', 'close'],
        assignee_type: 'role',
        assignee_value: { role_codes: ['admin'] },
        node_name: '结果复核',
        node_type: 'approver',
        required: true,
        sort_order: 20,
      },
    ],
    source_types: ['alarm'],
  },
  {
    code: 'task_failure_flow',
    description: '自动化任务失败后进入排查节点，可在工单详情里执行来源动作。',
    key: 'task',
    name: '任务失败流程',
    nodes: [
      {
        actions: ['approve', 'reject', 'transfer'],
        assignee_type: 'role',
        assignee_value: { role_codes: ['admin'] },
        node_name: '失败排查',
        node_type: 'handler',
        required: true,
        sort_order: 10,
      },
    ],
    source_types: ['task_failure'],
  },
  {
    code: 'node_timeout_flow',
    description: '节点心跳或流程超时后自动生成工单，派给运维角色跟进。',
    key: 'timeout',
    name: '节点超时流程',
    nodes: [
      {
        actions: ['approve', 'reject', 'transfer'],
        assignee_type: 'role',
        assignee_value: { role_codes: ['admin'] },
        node_name: '超时确认',
        node_type: 'handler',
        required: true,
        sort_order: 10,
        timeout_action: 'create_timeout_ticket',
        timeout_minutes: 60,
      },
    ],
    source_types: ['node_timeout'],
  },
];
