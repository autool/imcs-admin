<script lang="ts" setup>
import type { PresetTemplate } from './template-meta';

import type { TemplateApi } from '#/api/operation/template';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue';
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Steps,
  Switch,
  Tag,
  Textarea,
} from 'ant-design-vue';

import {
  addNodeApi,
  createTemplateApi,
  deleteNodeApi,
  deleteTemplateApi,
  getTemplateDetailApi,
  getTemplatesApi,
  updateNodeApi,
  updateTemplateApi,
} from '#/api/operation/template';
import { loadSystemUserOptions } from '#/utils/system-user-options';

import {
  actionOptions,
  actionText,
  assigneeConfig,
  assigneeTypeOptions,
  assigneeTypeText,
  defaultAssigneeConfig,
  defaultAssigneeTarget,
  nodeTypeOptions,
  nodeTypeText,
  sourceOptions,
  sourceText,
  templatePresets,
  timeoutActionOptions,
  timeoutActionText,
} from './template-meta';
import {
  actionColor,
  assigneeValueToTarget,
  nodeTypeColor,
  normalizeArray,
  normalizeBoolean,
  parseSeparated,
  renderAssigneeValue,
} from './template-utils';

defineOptions({ name: 'WorkPlatformTemplates' });

type NodeFormState = {
  actions: string[];
  assignee_target: string | string[];
  assignee_type: string;
  node_name: string;
  node_type: string;
  required: boolean;
  sort_order: number;
  timeout_action: string;
  timeout_minutes?: number;
};

const loading = ref(false);
const { hasAccessByCodes } = useAccess();
const modalVisible = ref(false);
const nodeModalVisible = ref(false);
const saving = ref(false);
const nodeSaving = ref(false);
const templates = ref<TemplateApi.Template[]>([]);
const editingId = ref('');
const editingNodeId = ref('');
const selectedTemplate = ref<null | TemplateApi.Template>(null);
const userOptions = ref<any[]>([]);
const userLabelMap = ref(new Map<string, string>());

const form = ref<TemplateApi.TemplateCreate>({
  code: '',
  description: '',
  enabled: true,
  name: '',
  nodes: [],
  source_types: [],
});

const nodeForm = ref<NodeFormState>({
  actions: ['approve', 'reject'],
  assignee_target: 'admin',
  assignee_type: 'role',
  node_name: '',
  node_type: 'handler',
  required: true,
  sort_order: 10,
  timeout_action: '',
  timeout_minutes: undefined,
});

const selectedTemplateId = computed(() => selectedTemplate.value?.id || '');
const canAddTemplate = computed(() => hasAccessByCodes(['wp_template:add']));
const canDeleteTemplate = computed(() =>
  hasAccessByCodes(['wp_template:delete']),
);
const canEditTemplate = computed(() => hasAccessByCodes(['wp_template:edit']));
const canManageNodes = computed(() => hasAccessByCodes(['wp_template:node']));

const orderedNodes = computed(() =>
  (selectedTemplate.value?.nodes || []).toSorted(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
  ),
);

const currentAssigneeConfig = computed(
  () => assigneeConfig[nodeForm.value.assignee_type] || defaultAssigneeConfig,
);

const nodeAssigneeTargetText = computed({
  get: () => {
    const target = nodeForm.value.assignee_target;
    return Array.isArray(target) ? target.join(',') : target;
  },
  set: (value: string) => {
    nodeForm.value.assignee_target = value;
  },
});

const selectedTemplateSources = computed(() =>
  normalizeArray((selectedTemplate.value as any)?.source_types),
);

const selectedTemplateState = computed(() => {
  if (!selectedTemplate.value) return '未选择';
  if (!selectedTemplate.value.enabled) return '已停用，不会匹配新工单';
  if (orderedNodes.value.length === 0) return '未配置节点，工单不会形成待办';
  return '已启用，可匹配新工单';
});

const sourceConflicts = computed(() => {
  if (!selectedTemplate.value) return [];
  return selectedTemplateSources.value.filter((source) =>
    templates.value.some((item) => {
      const itemSources = normalizeArray((item as any).source_types);
      return (
        item.id !== selectedTemplate.value?.id &&
        normalizeBoolean(item.enabled) &&
        normalizeBoolean(selectedTemplate.value?.enabled) &&
        itemSources.includes(source)
      );
    }),
  );
});

function normalizeTemplate(item: TemplateApi.Template): TemplateApi.Template {
  return {
    ...item,
    enabled: normalizeBoolean((item as any).enabled),
    source_types: normalizeArray((item as any).source_types),
  };
}

async function ensureUserOptions() {
  if (userOptions.value.length > 0) {
    return;
  }
  try {
    const { byId, options } = await loadSystemUserOptions({
      include_disabled: true,
    });
    userOptions.value = options;
    userLabelMap.value = new Map(
      [...byId.entries()].map(([userId, option]) => [userId, option.label]),
    );
  } catch (error: any) {
    message.error(error?.message || '加载用户列表失败');
  }
}

function buildAssigneeValue() {
  const target = nodeForm.value.assignee_target;
  if (nodeForm.value.assignee_type === 'user') {
    const values = Array.isArray(target)
      ? target.map((item) => String(item).trim()).filter(Boolean)
      : parseSeparated(String(target || ''));
    if (values.length === 0) {
      throw new Error(
        `请选择${currentAssigneeConfig.value?.label || '处理人'}`,
      );
    }
    return { user_ids: values };
  }

  const raw = String(target || '').trim();
  if (!raw) {
    throw new Error(`请填写${currentAssigneeConfig.value?.label || '处理人'}`);
  }
  const values = parseSeparated(raw);
  if (nodeForm.value.assignee_type === 'role') return { role_codes: values };
  if (nodeForm.value.assignee_type === 'dept') return { dept_ids: values };
  if (nodeForm.value.assignee_type === 'region') return { region_ids: values };
  if (nodeForm.value.assignee_type === 'template_var') return { field: raw };
  return { value: raw };
}

function handleAssigneeTypeChange() {
  nodeForm.value.assignee_target =
    nodeForm.value.assignee_type === 'user'
      ? []
      : defaultAssigneeTarget[nodeForm.value.assignee_type] || 'admin';
}

function renderNodeAssigneeValue(value: any) {
  return renderAssigneeValue(value, userLabelMap.value);
}

async function loadData() {
  loading.value = true;
  try {
    const result = await getTemplatesApi({ page: 1, page_size: 100 });
    templates.value = (result.items || []).map((item) =>
      normalizeTemplate(item),
    );
    if (!selectedTemplate.value && templates.value[0]) {
      await openNodes(templates.value[0]);
    } else if (selectedTemplate.value) {
      const current = templates.value.find(
        (item) => item.id === selectedTemplate.value?.id,
      );
      if (current) {
        await openNodes(current);
      } else {
        selectedTemplate.value = templates.value[0]
          ? normalizeTemplate(await getTemplateDetailApi(templates.value[0].id))
          : null;
      }
    }
  } catch (error: any) {
    message.error(error.message || '加载模板失败');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  if (!canAddTemplate.value) {
    message.warning('无权限新建流程模板');
    return;
  }
  editingId.value = '';
  form.value = {
    code: '',
    description: '',
    enabled: true,
    name: '',
    nodes: [],
    source_types: [],
  };
  modalVisible.value = true;
}

function openPresetCreate(preset: PresetTemplate) {
  if (!canAddTemplate.value) {
    message.warning('无权限新建流程模板');
    return;
  }
  editingId.value = '';
  form.value = {
    code: preset.code,
    description: preset.description,
    enabled: true,
    name: preset.name,
    nodes: preset.nodes.map((node) => ({ ...node })),
    source_types: [...preset.source_types],
  };
  modalVisible.value = true;
}

function openEdit(record: TemplateApi.Template) {
  if (!canEditTemplate.value) {
    message.warning('无权限编辑流程模板');
    return;
  }
  editingId.value = record.id;
  form.value = {
    code: record.code,
    description: record.description,
    enabled: normalizeBoolean(record.enabled),
    name: record.name,
    nodes: [],
    source_types: normalizeArray((record as any).source_types),
  };
  modalVisible.value = true;
}

async function submitTemplate() {
  if (editingId.value && !canEditTemplate.value) {
    message.warning('无权限编辑流程模板');
    return;
  }
  if (!editingId.value && !canAddTemplate.value) {
    message.warning('无权限新建流程模板');
    return;
  }
  if (!form.value.name || !form.value.code) {
    message.error('请填写模板名称和编码');
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await updateTemplateApi(editingId.value, {
        description: form.value.description,
        enabled: form.value.enabled,
        name: form.value.name,
        source_types: form.value.source_types,
      });
      message.success('模板已更新');
    } else {
      await createTemplateApi(form.value);
      message.success('模板已创建');
    }
    modalVisible.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function openNodes(record: TemplateApi.Template) {
  try {
    const detail = await getTemplateDetailApi(record.id);
    selectedTemplate.value = normalizeTemplate(detail);
  } catch (error: any) {
    message.error(error.message || '加载模板节点失败');
  }
}

function openNodeCreate() {
  if (!selectedTemplate.value) return;
  if (!canManageNodes.value) {
    message.warning('无权限新增流程节点');
    return;
  }
  void ensureUserOptions();
  const nextOrder =
    Math.max(0, ...orderedNodes.value.map((node) => node.sort_order || 0)) + 10;
  editingNodeId.value = '';
  nodeForm.value = {
    actions: ['approve', 'reject'],
    assignee_target: 'admin',
    assignee_type: 'role',
    node_name: '',
    node_type: 'handler',
    required: true,
    sort_order: nextOrder,
    timeout_action: '',
    timeout_minutes: undefined,
  };
  nodeModalVisible.value = true;
}

function openNodeEdit(record: TemplateApi.Node) {
  if (!canManageNodes.value) {
    message.warning('无权限编辑流程节点');
    return;
  }
  void ensureUserOptions();
  editingNodeId.value = record.id;
  nodeForm.value = {
    actions:
      normalizeArray(record.actions).length > 0
        ? normalizeArray(record.actions)
        : ['approve'],
    assignee_target: assigneeValueToTarget(
      record.assignee_type,
      record.assignee_value,
    ),
    assignee_type: record.assignee_type || 'role',
    node_name: record.node_name,
    node_type: record.node_type,
    required: record.required !== false,
    sort_order: record.sort_order,
    timeout_action: record.timeout_action || '',
    timeout_minutes: record.timeout_minutes,
  };
  nodeModalVisible.value = true;
}

async function submitNode() {
  if (!selectedTemplate.value) return;
  if (!canManageNodes.value) {
    message.warning('无权限保存流程节点');
    return;
  }
  if (!nodeForm.value.node_name.trim()) {
    message.error('请填写节点名称');
    return;
  }

  let assigneeValue: Record<string, any>;
  try {
    assigneeValue = buildAssigneeValue();
  } catch (error: any) {
    message.error(error.message);
    return;
  }

  nodeSaving.value = true;
  try {
    const payload = {
      actions: nodeForm.value.actions,
      assignee_type: nodeForm.value.assignee_type,
      assignee_value: assigneeValue,
      node_name: nodeForm.value.node_name,
      node_type: nodeForm.value.node_type,
      required: nodeForm.value.required,
      sort_order: Number(nodeForm.value.sort_order || 0),
      timeout_action: nodeForm.value.timeout_action || undefined,
      timeout_minutes: nodeForm.value.timeout_minutes
        ? Number(nodeForm.value.timeout_minutes)
        : undefined,
    };

    if (editingNodeId.value) {
      await updateNodeApi(editingNodeId.value, payload);
      message.success('节点已更新');
    } else {
      await addNodeApi(selectedTemplate.value.id, payload);
      message.success('节点已创建');
    }
    nodeModalVisible.value = false;
    await openNodes(selectedTemplate.value);
    await loadData();
  } catch (error: any) {
    message.error(error.message || '保存节点失败');
  } finally {
    nodeSaving.value = false;
  }
}

function removeNode(record: TemplateApi.Node) {
  if (!canManageNodes.value) {
    message.warning('无权限删除流程节点');
    return;
  }
  Modal.confirm({
    content: `确定删除节点“${record.node_name}”？删除后新工单将不再经过这个节点。`,
    title: '删除节点',
    async onOk() {
      try {
        await deleteNodeApi(record.id);
        message.success('节点已删除');
        if (selectedTemplate.value) {
          await openNodes(selectedTemplate.value);
        }
        await loadData();
      } catch (error: any) {
        message.error(error.message || '删除节点失败');
      }
    },
  });
}

function removeTemplate(record: TemplateApi.Template) {
  if (!canDeleteTemplate.value) {
    message.warning('无权限删除流程模板');
    return;
  }
  Modal.confirm({
    content: `确定删除模板“${record.name}”？删除后对应来源的新工单不会再自动进入这套流程。`,
    title: '删除模板',
    async onOk() {
      try {
        await deleteTemplateApi(record.id);
        message.success('模板已删除');
        await loadData();
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
  });
}

onMounted(() => {
  void ensureUserOptions();
  void loadData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="m-0 text-lg font-semibold">流程配置</h2>
          <div class="mt-1 text-sm text-muted-foreground">
            配置工单来源、流程节点、节点处理人和允许动作
          </div>
        </div>
        <Space>
          <Button :loading="loading" @click="loadData">
            <ReloadOutlined />
            刷新
          </Button>
          <Button
            v-access:code="['wp_template:add']"
            type="primary"
            @click="openCreate"
          >
            <PlusOutlined />
            新建流程
          </Button>
        </Space>
      </div>

      <Alert
        v-if="sourceConflicts.length > 0"
        :message="`当前模板与其他启用模板重复匹配：${sourceConflicts.map((item) => sourceText[item] || item).join('、')}。同一来源建议只启用一套流程。`"
        show-icon
        type="warning"
      />

      <div
        class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)]"
      >
        <section
          class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background"
        >
          <div class="shrink-0 border-b border-border px-4 py-3">
            <div class="text-sm font-medium">流程模板</div>
            <div class="mt-1 text-xs text-muted-foreground">
              新工单按来源匹配启用模板
            </div>
          </div>
          <div class="min-h-0 flex-1 space-y-2 overflow-auto p-3">
            <button
              v-for="template in templates"
              :key="template.id"
              class="w-full rounded-md border p-3 text-left transition"
              :class="[
                template.id === selectedTemplateId
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background hover:border-primary/60 hover:bg-muted/40',
              ]"
              type="button"
              @click="openNodes(template)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">
                    {{ template.name }}
                  </div>
                  <div class="mt-1 truncate text-xs text-muted-foreground">
                    {{ template.code }}
                  </div>
                </div>
                <Tag
                  :color="
                    normalizeBoolean(template.enabled) ? 'success' : 'default'
                  "
                >
                  {{ normalizeBoolean(template.enabled) ? '启用' : '停用' }}
                </Tag>
              </div>
              <div class="mt-3 flex flex-wrap gap-1">
                <Tag
                  v-for="source in normalizeArray(
                    (template as any).source_types,
                  )"
                  :key="source"
                  color="blue"
                >
                  {{ sourceText[source] || source }}
                </Tag>
                <Tag
                  v-if="
                    normalizeArray((template as any).source_types).length === 0
                  "
                >
                  未绑定来源
                </Tag>
              </div>
              <div
                class="mt-3 flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>{{ template.nodes?.length || 0 }} 个节点</span>
                <span>{{
                  normalizeBoolean(template.enabled) ? '可匹配' : '不匹配'
                }}</span>
              </div>
            </button>

            <div v-if="templates.length === 0 && !loading" class="py-10">
              <Empty description="暂无流程模板" />
            </div>
          </div>
        </section>

        <section
          class="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-background"
        >
          <template v-if="selectedTemplate">
            <div class="shrink-0 border-b border-border px-4 py-3">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="m-0 truncate text-base font-semibold">
                      {{ selectedTemplate.name }}
                    </h3>
                    <Tag
                      :color="
                        normalizeBoolean(selectedTemplate.enabled)
                          ? 'success'
                          : 'default'
                      "
                    >
                      {{
                        normalizeBoolean(selectedTemplate.enabled)
                          ? '启用'
                          : '停用'
                      }}
                    </Tag>
                  </div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    {{ selectedTemplate.code }} · {{ selectedTemplateState }}
                  </div>
                </div>
                <Space>
                  <Button
                    v-access:code="['wp_template:edit']"
                    size="small"
                    @click="openEdit(selectedTemplate)"
                  >
                    <EditOutlined />
                    模板
                  </Button>
                  <Button
                    v-access:code="['wp_template:node']"
                    type="primary"
                    size="small"
                    @click="openNodeCreate"
                  >
                    <PlusOutlined />
                    节点
                  </Button>
                  <Button
                    v-access:code="['wp_template:delete']"
                    danger
                    size="small"
                    @click="removeTemplate(selectedTemplate)"
                  >
                    <DeleteOutlined />
                    删除
                  </Button>
                </Space>
              </div>
            </div>

            <div class="min-h-0 flex-1 overflow-auto p-4">
              <div class="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <div class="rounded-md bg-muted/40 px-3 py-2">
                  <div class="text-xs text-muted-foreground">入口来源</div>
                  <div class="mt-2 flex flex-wrap gap-1">
                    <Tag
                      v-for="source in selectedTemplateSources"
                      :key="source"
                      color="blue"
                    >
                      {{ sourceText[source] || source }}
                    </Tag>
                    <span
                      v-if="selectedTemplateSources.length === 0"
                      class="text-sm"
                    >
                      未配置
                    </span>
                  </div>
                </div>
                <div class="rounded-md bg-muted/40 px-3 py-2">
                  <div class="text-xs text-muted-foreground">执行节点</div>
                  <div class="mt-1 text-lg font-semibold">
                    {{ orderedNodes.length }}
                  </div>
                </div>
                <div class="rounded-md bg-muted/40 px-3 py-2">
                  <div class="text-xs text-muted-foreground">流程结果</div>
                  <div class="mt-1 text-sm font-medium">
                    最后节点通过后完成工单
                  </div>
                </div>
              </div>

              <div class="rounded-lg border border-border p-4">
                <div
                  class="mb-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div class="text-sm font-medium">可视化预览</div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      预览的是新工单进入模板后的节点执行顺序
                    </div>
                  </div>
                  <Tag color="processing">来源 → 节点 → 完成</Tag>
                </div>

                <div v-if="orderedNodes.length > 0" class="workflow-preview">
                  <Steps
                    :current="0"
                    :items="[]"
                    direction="vertical"
                    size="small"
                  >
                    <Steps.Step title="工单进入流程" status="finish">
                      <template #description>
                        <div class="mt-1 flex flex-wrap gap-1">
                          <Tag
                            v-for="source in selectedTemplateSources"
                            :key="source"
                            color="blue"
                          >
                            {{ sourceText[source] || source }}
                          </Tag>
                          <span
                            v-if="selectedTemplateSources.length === 0"
                            class="text-xs text-muted-foreground"
                          >
                            未指定来源时不会自动匹配
                          </span>
                        </div>
                      </template>
                    </Steps.Step>

                    <Steps.Step
                      v-for="(node, index) in orderedNodes"
                      :key="node.id"
                      :status="index === 0 ? 'process' : 'wait'"
                      :title="`${index + 1}. ${node.node_name}`"
                    >
                      <template #description>
                        <div
                          class="mt-2 rounded-md border border-border bg-muted/20 p-3"
                        >
                          <div class="flex flex-wrap items-center gap-2">
                            <Tag :color="nodeTypeColor(node.node_type)">
                              {{
                                nodeTypeText[node.node_type] || node.node_type
                              }}
                            </Tag>
                            <Tag color="blue">
                              {{
                                assigneeTypeText[node.assignee_type] ||
                                node.assignee_type
                              }}
                            </Tag>
                            <Tag v-if="node.required === false">可跳过</Tag>
                            <Tag v-else color="success">必经</Tag>
                          </div>
                          <div class="mt-2 text-xs text-muted-foreground">
                            处理人：{{
                              renderNodeAssigneeValue(node.assignee_value)
                            }}
                          </div>
                          <div class="mt-2 flex flex-wrap gap-1">
                            <Tag
                              v-for="action in normalizeArray(node.actions)
                                .length > 0
                                ? normalizeArray(node.actions)
                                : ['approve']"
                              :key="action"
                              :color="actionColor(action)"
                            >
                              {{ actionText[action] || action }}
                            </Tag>
                          </div>
                          <div
                            v-if="node.timeout_minutes || node.timeout_action"
                            class="mt-2 text-xs text-muted-foreground"
                          >
                            超时：{{ node.timeout_minutes || '-' }} 分钟，
                            {{
                              timeoutActionText[node.timeout_action || ''] ||
                              node.timeout_action ||
                              '无动作'
                            }}
                          </div>
                          <div class="mt-3 flex gap-2">
                            <Button
                              v-access:code="['wp_template:node']"
                              size="small"
                              type="link"
                              @click="openNodeEdit(node)"
                            >
                              编辑节点
                            </Button>
                            <Button
                              v-access:code="['wp_template:node']"
                              danger
                              size="small"
                              type="link"
                              @click="removeNode(node)"
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      </template>
                    </Steps.Step>

                    <Steps.Step title="流程完成" status="wait">
                      <template #description>
                        <div class="mt-1 text-xs text-muted-foreground">
                          最后一个节点通过后，工单进入已完成/已关闭阶段，不再产生待办。
                        </div>
                      </template>
                    </Steps.Step>
                  </Steps>
                </div>

                <div v-else class="py-12 text-center">
                  <Empty description="这个模板还没有节点，工单无法形成待办" />
                  <Button
                    v-access:code="['wp_template:node']"
                    class="mt-3"
                    type="primary"
                    @click="openNodeCreate"
                  >
                    <PlusOutlined />
                    添加第一个节点
                  </Button>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="flex h-full min-h-80 items-center justify-center">
            <Empty description="请选择流程模板" />
          </div>
        </section>
      </div>
    </div>

    <Modal
      v-model:open="modalVisible"
      :confirm-loading="saving"
      :title="editingId ? '编辑流程模板' : '新建流程模板'"
      width="1080px"
      @ok="submitTemplate"
    >
      <Form layout="vertical">
        <Alert
          class="mb-4"
          message="模板负责匹配工单来源；节点负责定义协同流程。使用快速创建时会同时创建默认节点。"
          show-icon
          type="info"
        />
        <div
          v-if="!editingId"
          class="template-helper mb-4 rounded-md border p-4"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2 text-sm font-medium">
                <span class="helper-mark"></span>
                配置助手
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                选择一个场景会自动填入来源和默认节点，也可以继续手动修改。
              </div>
            </div>
            <Tag color="processing">来源 → 节点 → 完成</Tag>
          </div>
          <div class="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <button
              v-for="preset in templatePresets"
              :key="preset.key"
              class="preset-card rounded-md border p-3 text-left transition"
              type="button"
              @click="openPresetCreate(preset)"
            >
              <div class="text-sm font-medium">{{ preset.name }}</div>
              <div class="mt-1 text-xs text-muted-foreground">
                {{ preset.description }}
              </div>
              <div class="mt-2 flex flex-wrap gap-1">
                <Tag
                  v-for="source in preset.source_types"
                  :key="source"
                  color="blue"
                >
                  {{ sourceText[source] || source }}
                </Tag>
                <Tag>{{ preset.nodes.length }} 个默认节点</Tag>
              </div>
            </button>
          </div>
          <div
            class="helper-rule mt-3 rounded-md p-3 text-xs text-muted-foreground"
          >
            新工单先按来源匹配启用模板，节点按顺序执行，当前节点处理人会收到待办，最后节点通过后流程结束。
          </div>
        </div>
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item label="模板名称" required>
            <Input v-model:value="form.name" placeholder="请输入模板名称" />
          </Form.Item>
          <Form.Item label="模板编码" required>
            <Input
              v-model:value="form.code"
              :disabled="!!editingId"
              placeholder="例如 alarm_flow"
            />
          </Form.Item>
          <Form.Item label="适用来源">
            <Select
              v-model:value="form.source_types"
              :options="sourceOptions"
              mode="multiple"
              placeholder="选择这个流程处理哪些来源工单"
            />
          </Form.Item>
          <Form.Item label="启用状态">
            <Switch v-model:checked="form.enabled" />
          </Form.Item>
        </div>
        <Form.Item label="描述">
          <Textarea
            v-model:value="form.description"
            :rows="3"
            placeholder="请输入描述"
          />
        </Form.Item>
        <div
          v-if="!editingId && form.nodes?.length"
          class="default-nodes rounded-md border p-3"
        >
          <div class="text-sm font-medium">将同时创建的默认节点</div>
          <div class="mt-2 space-y-2">
            <div
              v-for="node in form.nodes"
              :key="`${node.sort_order}-${node.node_name}`"
              class="flex items-center justify-between gap-3 text-sm"
            >
              <span>{{ node.sort_order }} · {{ node.node_name }}</span>
              <Tag :color="nodeTypeColor(node.node_type)">
                {{ nodeTypeText[node.node_type] || node.node_type }}
              </Tag>
            </div>
          </div>
        </div>
      </Form>
    </Modal>

    <Modal
      v-model:open="nodeModalVisible"
      :confirm-loading="nodeSaving"
      :title="editingNodeId ? '编辑流程节点' : '新建流程节点'"
      width="720px"
      @ok="submitNode"
    >
      <Form layout="vertical">
        <Alert
          class="mb-4"
          message="节点就是流程中的一个处理步骤。顺序越小越先执行；当前节点通过后进入下一节点。"
          show-icon
          type="info"
        />
        <div class="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item label="节点名称" required>
            <Input
              v-model:value="nodeForm.node_name"
              placeholder="例如 一线处理 / 主管审批"
            />
          </Form.Item>
          <Form.Item label="节点类型">
            <Select
              v-model:value="nodeForm.node_type"
              :options="nodeTypeOptions"
            />
          </Form.Item>
          <Form.Item label="顺序">
            <InputNumber
              v-model:value="nodeForm.sort_order"
              :min="0"
              class="w-full"
            />
          </Form.Item>
          <Form.Item label="处理人类型">
            <Select
              v-model:value="nodeForm.assignee_type"
              :options="assigneeTypeOptions"
              @change="handleAssigneeTypeChange"
            />
          </Form.Item>
          <Form.Item :label="currentAssigneeConfig.label" required>
            <Select
              v-if="nodeForm.assignee_type === 'user'"
              v-model:value="nodeForm.assignee_target"
              :allow-clear="true"
              :options="userOptions"
              :show-search="true"
              mode="multiple"
              :placeholder="currentAssigneeConfig.placeholder"
            />
            <Input
              v-else
              v-model:value="nodeAssigneeTargetText"
              :placeholder="currentAssigneeConfig.placeholder"
            />
            <div class="mt-1 text-xs text-muted-foreground">
              {{ currentAssigneeConfig.help }}
            </div>
          </Form.Item>
          <Form.Item label="允许动作">
            <Select
              v-model:value="nodeForm.actions"
              :options="actionOptions"
              mode="multiple"
            />
          </Form.Item>
          <Form.Item label="是否必经">
            <Switch v-model:checked="nodeForm.required" />
          </Form.Item>
          <Form.Item label="超时分钟">
            <InputNumber
              v-model:value="nodeForm.timeout_minutes"
              :min="1"
              class="w-full"
              placeholder="可留空"
            />
          </Form.Item>
          <Form.Item label="超时动作">
            <Select
              v-model:value="nodeForm.timeout_action"
              :options="timeoutActionOptions"
              allow-clear
              placeholder="超时后怎么处理，可留空"
            />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  </Page>
</template>

<style scoped>
.template-helper {
  background:
    linear-gradient(135deg, rgb(37 99 235 / 10%), transparent 42%),
    hsl(var(--background));
  border-color: rgb(37 99 235 / 28%);
}

.helper-mark {
  display: inline-block;
  width: 4px;
  height: 16px;
  background: rgb(37 99 235);
  border-radius: 999px;
  box-shadow: 0 0 16px rgb(37 99 235 / 50%);
}

.preset-card {
  background: rgb(148 163 184 / 6%);
  border-color: rgb(148 163 184 / 28%);
}

.preset-card:hover {
  background: rgb(37 99 235 / 12%);
  border-color: rgb(37 99 235 / 70%);
}

.helper-rule,
.default-nodes {
  background: rgb(148 163 184 / 8%);
  border-color: rgb(148 163 184 / 22%);
}

.workflow-preview :deep(.ant-steps-item-description) {
  max-width: 100%;
}
</style>
