export function normalizeBoolean(value: any) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }
  return Boolean(value);
}

export function normalizeArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function parseSeparated(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function renderAssigneeValue(
  value: any,
  userLabelMap?: Map<string, string>,
) {
  const parsed = parseJsonValue(value);
  if (!parsed) return '未指定';
  if (typeof parsed === 'string') return parsed;
  if (parsed.role_codes) return `角色：${parsed.role_codes.join(', ')}`;
  if (parsed.user_ids) {
    const userLabels = normalizeArray(parsed.user_ids).map(
      (userId) => userLabelMap?.get(userId) || userId,
    );
    return `用户：${userLabels.join(', ')}`;
  }
  if (parsed.dept_ids) return `部门：${parsed.dept_ids.join(', ')}`;
  if (parsed.region_ids) return `区域：${parsed.region_ids.join(', ')}`;
  if (parsed.field || parsed.var_name)
    return `来源字段：${parsed.field || parsed.var_name}`;
  return JSON.stringify(parsed);
}

export function assigneeValueToTarget(type: string, value: any) {
  const parsed = parseJsonValue(value);
  if (!parsed) return '';
  if (typeof parsed === 'string') return parsed;
  if (type === 'role') return normalizeArray(parsed.role_codes).join(', ');
  if (type === 'user') return normalizeArray(parsed.user_ids);
  if (type === 'dept') return normalizeArray(parsed.dept_ids).join(', ');
  if (type === 'region') return normalizeArray(parsed.region_ids).join(', ');
  if (type === 'template_var') return parsed.field || parsed.var_name || '';
  return '';
}

export function actionColor(action: string) {
  if (action === 'reject') return 'red';
  if (action === 'close') return 'purple';
  if (action === 'transfer') return 'blue';
  return 'green';
}

export function nodeTypeColor(type: string) {
  if (type === 'approver') return 'orange';
  if (type === 'notifier') return 'cyan';
  return 'blue';
}

function parseJsonValue(value: any) {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
