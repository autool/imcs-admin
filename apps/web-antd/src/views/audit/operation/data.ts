import type { VbenFormSchema } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';

import { h } from 'vue';

import { Button, Tag } from 'ant-design-vue';

const moduleMap: Record<string, { color: string; text: string }> = {
  asset: { color: 'cyan', text: '资产' },
  device: { color: 'blue', text: '设备' },
  network: { color: 'geekblue', text: '网络' },
  notification: { color: 'purple', text: '通知' },
  system: { color: 'green', text: '系统' },
  task: { color: 'orange', text: '任务' },
  work: { color: 'gold', text: '工作台' },
};

const resultMap: Record<string, { color: string; text: string }> = {
  error: { color: 'error', text: '异常' },
  failed: { color: 'error', text: '失败' },
  success: { color: 'success', text: '成功' },
};

const targetTypeMap: Record<string, { color: string; text: string }> = {
  ai_model: { color: 'cyan', text: 'AI 模型' },
  alert_rule: { color: 'red', text: '告警规则' },
  asset: { color: 'cyan', text: '资产' },
  auth_session: { color: 'blue', text: '认证会话' },
  business_ip: { color: 'cyan', text: '业务地址' },
  default_credential: { color: 'gold', text: '默认凭据' },
  department: { color: 'blue', text: '部门' },
  environment_device: { color: 'blue', text: '环境设备' },
  menu: { color: 'cyan', text: '菜单' },
  monitoring_target: { color: 'geekblue', text: '监控目标' },
  notification: { color: 'purple', text: '通知消息' },
  notification_config: { color: 'purple', text: '通知配置' },
  notification_policy: { color: 'purple', text: '通知策略' },
  notification_template: { color: 'purple', text: '通知模板' },
  operation_task: { color: 'orange', text: '运维任务' },
  operation_work: { color: 'orange', text: '工作事项' },
  region: { color: 'gold', text: '区域' },
  server: { color: 'cyan', text: '服务器' },
  server_alarm: { color: 'orange', text: '服务器告警' },
  server_alarm_silence_rule: { color: 'orange', text: '告警静默规则' },
  server_alarm_ticket_policy: { color: 'orange', text: '告警转工单策略' },
  server_business_ip: { color: 'cyan', text: '业务地址' },
  server_priority_group: { color: 'orange', text: '优先级分组' },
  sms_gateway: { color: 'green', text: '短信网关' },
  system_config: { color: 'green', text: '系统配置' },
  sys_menu: { color: 'cyan', text: '菜单' },
  sys_role: { color: 'green', text: '角色' },
  task: { color: 'orange', text: '任务' },
  task_execution: { color: 'orange', text: '任务执行' },
  task_scheduled: { color: 'orange', text: '计划任务' },
  task_scheduler: { color: 'orange', text: '任务调度器' },
  terminal_asset: { color: 'cyan', text: '终端资产' },
  ticket: { color: 'gold', text: '工单' },
  user: { color: 'blue', text: '用户' },
  work_task: { color: 'orange', text: '工作任务' },
  workflow: { color: 'orange', text: '工作流' },
  workflow_template: { color: 'orange', text: '工作流模板' },
  workflow_template_node: { color: 'orange', text: '工作流节点' },
};

const actionMap: Record<string, string> = {
  assign_alarm: '分派服务器告警',
  assign_role_menus: '分配角色菜单',
  assign_ticket: '分派工单',
  backfill_default_credentials: '补录默认凭据',
  backup_template_file: '备份模板文件',
  change_password: '修改密码',
  close_alarm: '关闭服务器告警',
  close_stale_execution: '关闭陈旧任务执行',
  complete_workflow_node: '完成工作流节点',
  create_business_ip: '创建业务地址',
  create_department: '创建部门',
  create_menu: '创建菜单',
  create_region: '创建区域',
  create_role: '创建角色',
  create_scheduled_task: '创建计划任务',
  create_server: '创建服务器',
  delete_department: '删除部门',
  delete_menu: '删除菜单',
  delete_region: '删除区域',
  delete_role: '删除角色',
  delete_scheduled_task: '删除计划任务',
  delete_user: '删除用户',
  handle_alarm: '处理服务器告警',
  ldap_login: 'LDAP 登录',
  login: '登录',
  local_login: '本地登录',
  logout: '退出登录',
  mark_all_notifications_read: '全部通知标记已读',
  mark_server_lifecycle_read: '标记服务器生命周期已读',
  refresh_token: '刷新令牌',
  rerun_execution: '重新执行任务',
  run_scheduled_task: '立即执行计划任务',
  save_ldap_config: '保存 LDAP 配置',
  save_oauth2_config: '保存 OAuth2 配置',
  scan_due_tasks: '扫描到期任务',
  schedule_ldap_sync: '安排 LDAP 同步任务',
  sync_ldap: '同步 LDAP',
  sync_ldap_directory: '同步 LDAP 目录',
  test_ldap_connection: '测试 LDAP 连接',
  test_notification_config: '测试通知配置',
  toggle_scheduled_task: '切换计划任务状态',
  update_business_ip: '更新业务地址',
  update_default_credential: '更新默认凭据',
  update_department: '更新部门',
  update_menu: '更新菜单',
  update_notification_policy: '更新通知策略',
  update_notification_template: '更新通知模板',
  update_region: '更新区域',
  update_role: '更新角色',
  update_scheduled_task: '更新计划任务',
  update_server: '更新服务器',
  update_user: '更新用户',
  upload_ldap_certificate: '上传 LDAP 证书',
  wopi_put_template_file: '通过 WOPI 保存模板文件',
};

const actionVerbMap: Record<string, string> = {
  add: '新增',
  analyze: '分析',
  assign: '分配',
  backfill: '补录',
  backup: '备份',
  batch: '批量',
  bind: '绑定',
  calculate: '计算',
  close: '关闭',
  collect: '采集',
  complete: '完成',
  confirm: '确认',
  create: '创建',
  delete: '删除',
  disable: '停用',
  distribute: '分发',
  download: '下载',
  enable: '启用',
  ensure: '确保',
  execute: '执行',
  export: '导出',
  generate: '生成',
  handle: '处理',
  import: '导入',
  login: '登录',
  logout: '退出登录',
  manual: '手动',
  mark: '标记',
  match: '匹配',
  preview: '预览',
  process: '处理',
  receipt: '回执',
  recollect: '重新采集',
  reanalyze: '重新分析',
  refresh: '刷新',
  remove: '移除',
  reset: '重置',
  restart: '重启',
  rerun: '重新执行',
  run: '执行',
  save: '保存',
  scan: '扫描',
  schedule: '安排',
  skip: '跳过',
  sync: '同步',
  test: '测试',
  toggle: '切换',
  unbind: '解绑',
  update: '更新',
  upload: '上传',
};

const tokenTextMap: Record<string, string> = {
  ai: 'AI',
  alarm: '告警',
  auth: '认证',
  config: '配置',
  credential: '凭据',
  credentials: '凭据',
  dataset: '数据集',
  default: '默认',
  department: '部门',
  device: '设备',
  directory: '目录',
  due: '到期',
  execution: '执行',
  file: '文件',
  group: '分组',
  included: '纳入状态',
  infra: '基础设施',
  ldap: 'LDAP',
  lifecycle: '生命周期',
  local: '本地',
  log: '日志',
  menu: '菜单',
  model: '模型',
  monitoring: '监控',
  notification: '通知',
  oauth2: 'OAuth2',
  password: '密码',
  pending: '待处理',
  policy: '策略',
  put: '保存',
  read: '已读',
  region: '区域',
  saved: '已保存',
  scheduler: '调度器',
  role: '角色',
  rule: '规则',
  server: '服务器',
  setting: '设置',
  silence: '静默',
  sms: '短信',
  target: '目标',
  task: '任务',
  template: '模板',
  ticket: '工单',
  token: '令牌',
  user: '用户',
  workflow: '工作流',
  wopi: 'WOPI',
};

const sensitiveAuditKeyTokens = [
  'access_key',
  'access_token',
  'api_key',
  'authorization',
  'cookie',
  'credential',
  'password',
  'passwd',
  'private_key',
  'pwd',
  'refresh_token',
  'secret',
  'secret_key',
  'session',
  'session_id',
  'token',
];

const sensitiveAuditTextTokens = [
  'access_token',
  'authorization',
  'cookie',
  'password',
  'passwd',
  'pwd',
  'refresh_token',
  'secret',
  'session_id',
  'token',
];

function isSensitiveAuditKey(key?: string) {
  if (!key) {
    return false;
  }
  const normalized = key.replaceAll('-', '_').toLowerCase();
  return sensitiveAuditKeyTokens.some(
    (token) =>
      normalized === token ||
      normalized.endsWith(`_${token}`) ||
      normalized.includes(`${token}_`),
  );
}

function redactSensitiveAuditText(value: string) {
  let text = value;
  for (const token of sensitiveAuditTextTokens) {
    text = text
      .replaceAll(
        new RegExp(String.raw`("?${token}"?\s*:\s*)"[^"]*"`, 'gi'),
        '$1"***"',
      )
      .replaceAll(
        new RegExp(String.raw`\b(${token})(\s*[:=]\s*)[^,;&\s]+`, 'gi'),
        '$1$2***',
      );
  }
  return text;
}

export function sanitizeAuditDisplayValue(value: any, key?: string): any {
  if (isSensitiveAuditKey(key)) {
    return '***';
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditDisplayValue(item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitizeAuditDisplayValue(entryValue, entryKey),
      ]),
    );
  }
  if (typeof value !== 'string') {
    return value;
  }
  return redactSensitiveAuditText(value);
}

export function auditDisplayText(value?: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const sanitized = sanitizeAuditDisplayValue(value);
  if (typeof sanitized === 'string') {
    return sanitized || '-';
  }
  try {
    return JSON.stringify(sanitized);
  } catch {
    return String(sanitized);
  }
}

export function auditModuleText(value?: string) {
  if (!value) return '-';
  return moduleMap[value]?.text || value;
}

export function auditModuleColor(value?: string) {
  return value ? moduleMap[value]?.color || 'default' : 'default';
}

export function auditResultColor(value?: string) {
  return value ? resultMap[value]?.color || 'default' : 'default';
}

export function auditResultText(value?: string) {
  if (!value) return '-';
  return resultMap[value]?.text || value;
}

function normalizeAuditCode(value?: string) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function prettifyAuditTokens(value?: string) {
  const normalized = normalizeAuditCode(value);
  if (!normalized) return '-';
  return normalized
    .split('_')
    .filter(Boolean)
    .map((token) => tokenTextMap[token] || token)
    .join('');
}

export function auditTargetTypeText(value?: string) {
  const normalized = normalizeAuditCode(value);
  if (!normalized) return '-';
  return targetTypeMap[normalized]?.text || prettifyAuditTokens(normalized);
}

export function auditTargetTypeColor(value?: string) {
  const normalized = normalizeAuditCode(value);
  return normalized ? targetTypeMap[normalized]?.color || 'default' : 'default';
}

const genericAuditTargets = new Set([
  'alarm',
  'asset',
  'config',
  'credential',
  'definition',
  'file',
  'group',
  'ip',
  'menu',
  'notification',
  'policy',
  'role',
  'rule',
  'server',
  'task',
  'template',
  'ticket',
  'user',
]);

function deriveActionTargetText(restValue?: string, targetType?: string) {
  const normalizedRest = normalizeAuditCode(restValue);
  const targetText = auditTargetTypeText(targetType);
  if (!normalizedRest) {
    return targetText === '-' ? '' : targetText;
  }

  const remainderTokens = normalizedRest.split('_').filter(Boolean);
  const remainderText = prettifyAuditTokens(normalizedRest);
  const isGenericTarget =
    remainderTokens.length > 0 &&
    remainderTokens.every((token) => genericAuditTargets.has(token));

  if (targetText === '-') {
    return remainderText;
  }
  if (
    isGenericTarget ||
    targetText.includes(remainderText) ||
    remainderText.includes(targetText)
  ) {
    return targetText;
  }
  return remainderText;
}

export function auditActionText(
  value?: string,
  targetType?: string,
  _summary?: string,
) {
  const normalized = normalizeAuditCode(value);
  if (!normalized) return '-';
  if (actionMap[normalized]) {
    return actionMap[normalized];
  }
  const [verb, ...rest] = normalized.split('_').filter(Boolean);
  if (!verb) return '-';
  const verbText = actionVerbMap[verb] || prettifyAuditTokens(verb);
  const targetText = deriveActionTargetText(rest.join('_'), targetType);
  return `${verbText}${targetText}`.trim() || prettifyAuditTokens(normalized);
}

function renderAuditCodeCell(primary: string, color?: string) {
  return color
    ? h(Tag, { color, style: 'margin-inline-end: 0;' }, () => primary)
    : h(
        'div',
        { style: 'line-height: 1.35; padding: 2px 0; font-weight: 500;' },
        primary,
      );
}

function renderAuditTextCell(value?: unknown) {
  return h('span', auditDisplayText(value));
}

export function formatAuditJson(value: any) {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    try {
      return JSON.stringify(
        sanitizeAuditDisplayValue(JSON.parse(value)),
        null,
        2,
      );
    } catch {
      return sanitizeAuditDisplayValue(value);
    }
  }
  return JSON.stringify(sanitizeAuditDisplayValue(value), null, 2);
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'RangePicker',
      componentProps: {
        allowClear: true,
        format: 'YYYY-MM-DD',
        placeholder: ['开始日期', '结束日期'],
        showTime: false,
        valueFormat: 'YYYY-MM-DD',
      },
      fieldName: 'date_range',
      label: '时间范围',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(moduleMap).map(([value, item]) => ({
          label: item.text,
          value,
        })),
        placeholder: '全部模块',
      },
      fieldName: 'module',
      label: '业务模块',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '输入动作关键字',
      },
      fieldName: 'action',
      label: '操作动作',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(targetTypeMap).map(([value, item]) => ({
          label: item.text,
          value,
        })),
        placeholder: '全部目标',
        showSearch: true,
      },
      fieldName: 'target_type',
      label: '目标类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(resultMap).map(([value, item]) => ({
          label: item.text,
          value,
        })),
        placeholder: '全部结果',
      },
      fieldName: 'result',
      label: '操作结果',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '输入操作人',
      },
      fieldName: 'operator_name',
      label: '操作人',
    },
    {
      component: 'Input',
      componentProps: {
        allowClear: true,
        placeholder: '摘要、目标ID、操作人',
      },
      fieldName: 'search',
      label: '关键词',
    },
  ];
}

export function useColumns(
  onActionClick: (params: any) => void,
): VxeGridProps['columns'] {
  return [
    {
      align: 'center',
      field: 'seq',
      fixed: 'left',
      title: '序号',
      type: 'seq',
      width: 70,
    },
    {
      align: 'center',
      field: 'created_at',
      fixed: 'left',
      minWidth: 170,
      title: '时间',
    },
    {
      align: 'center',
      field: 'module',
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: auditModuleColor(row.module) }, () =>
            auditModuleText(row.module),
          ),
      },
      title: '模块',
      width: 110,
    },
    {
      align: 'center',
      field: 'action',
      minWidth: 190,
      slots: {
        default: ({ row }: any) =>
          renderAuditCodeCell(
            auditActionText(row.action, row.target_type, row.summary),
          ),
      },
      title: '动作',
    },
    {
      align: 'center',
      field: 'operator_name',
      slots: {
        default: ({ row }: any) => renderAuditTextCell(row.operator_name),
      },
      title: '操作人',
      width: 120,
    },
    {
      align: 'center',
      field: 'target_type',
      minWidth: 160,
      slots: {
        default: ({ row }: any) =>
          renderAuditCodeCell(
            auditTargetTypeText(row.target_type),
            auditTargetTypeColor(row.target_type),
          ),
      },
      title: '目标类型',
    },
    {
      align: 'center',
      field: 'target_id',
      minWidth: 180,
      showOverflow: true,
      slots: {
        default: ({ row }: any) => renderAuditTextCell(row.target_id),
      },
      title: '目标ID',
    },
    {
      align: 'left',
      field: 'summary',
      minWidth: 300,
      showOverflow: true,
      slots: {
        default: ({ row }: any) => renderAuditTextCell(row.summary),
      },
      title: '摘要',
    },
    {
      align: 'center',
      field: 'ip_address',
      slots: {
        default: ({ row }: any) => renderAuditTextCell(row.ip_address),
      },
      title: '来源IP',
      width: 140,
    },
    {
      align: 'center',
      field: 'result',
      slots: {
        default: ({ row }: any) =>
          h(Tag, { color: auditResultColor(row.result) }, () =>
            auditResultText(row.result),
          ),
      },
      title: '结果',
      width: 90,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: {
        default: ({ row }: any) =>
          h(
            Button,
            {
              size: 'small',
              type: 'link',
              onClick: () => onActionClick({ code: 'detail', row }),
            },
            () => '详情',
          ),
      },
      title: '操作',
      width: 90,
    },
  ];
}
