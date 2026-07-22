<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { AlertConfigApi } from '#/api/assets/alert-config';

import { computed, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  Alert,
  Button,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createServerAlarmSilenceRule,
  deleteAlertConfig,
  deleteServerAlarmSilenceRule,
  getAlertConfigList,
  getServerAlarmSilenceRules,
  testAlertConfig,
  testServerAlarmSilenceRules,
  toggleAlertConfig,
  toggleServerAlarmSilenceRule,
  updateServerAlarmSilenceRule,
} from '#/api/assets/alert-config';

import { useAlertConfigActions } from './data';
import AlertConfigForm from './modules/form.vue';
import TicketPolicyModal from './modules/ticket-policy.vue';

const actions = useAlertConfigActions();

const TARGET_TYPE_MAP: Record<string, { color: string; label: string }> = {
  single_server: { label: '单个服务器', color: 'blue' },
  region: { label: '区域', color: 'green' },
  priority_group: { label: '优先级分组', color: 'orange' },
  all: { label: '全部', color: 'purple' },
};

const SEVERITY_MAP: Record<string, { color: string; label: string }> = {
  critical: { label: '严重', color: 'red' },
  major: { label: '重要', color: 'magenta' },
  minor: { label: '次要', color: 'gold' },
  warning: { label: '警告', color: 'orange' },
  info: { label: '信息', color: 'blue' },
};

const silenceRuleModalOpen = ref(false);
const silenceRuleEditorOpen = ref(false);
const silenceRulesLoading = ref(false);
const silenceRuleSaving = ref(false);
const silenceRuleTesting = ref(false);
const silenceRules = ref<AlertConfigApi.ServerAlarmSilenceRule[]>([]);
const editingSilenceRule = ref<AlertConfigApi.ServerAlarmSilenceRule>();
const silenceRuleTestText = ref('集成RAID控制器1的巡检操作完成.');
const silenceRuleTestResult =
  ref<AlertConfigApi.ServerAlarmSilenceRuleTestResult>();

const silenceRuleForm = reactive<AlertConfigApi.ServerAlarmSilenceRulePayload>({
  description: '',
  effect: '不入库、不统计、不展示',
  enabled: true,
  example: '',
  match_type: 'regex',
  name: '',
  pattern: '',
  scene: '服务器 Redfish / BMC 告警',
  sort_order: 100,
});

const matchedSilenceRule = computed(() => silenceRuleTestResult.value?.rule);

const enabledSilenceRuleCount = computed(
  () => silenceRules.value.filter((rule) => rule.enabled).length,
);

function formatCooldown(seconds: number) {
  if (!seconds) return '-';
  if (seconds >= 3600) return `${seconds / 3600}h`;
  if (seconds >= 60) return `${seconds / 60}m`;
  return `${seconds}s`;
}

const COND_LABEL: Record<string, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: '=',
  ne: '≠',
  between: '区间内',
  not_between: '区间外',
};

function fmtTime(t?: string) {
  return t ? t.replace('T', ' ').slice(0, 19) : '-';
}

const [EditModal, editModalApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: AlertConfigForm,
});

const [TicketPolicy, ticketPolicyApi] = useVbenModal({
  connectedComponent: TicketPolicyModal,
  fullscreenButton: false,
});

const formOptions: VbenFormProps = {
  collapsed: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  schema: [
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: Object.entries(TARGET_TYPE_MAP).map(([value, { label }]) => ({
          label,
          value,
        })),
        placeholder: '请选择目标类型',
      },
      fieldName: 'target_type',
      label: '目标类型',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '启用', value: true },
          { label: '禁用', value: false },
        ],
        placeholder: '请选择状态',
      },
      fieldName: 'enabled',
      label: '状态',
    },
  ],
  showCollapseButton: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<AlertConfigApi.AlertConfig> = {
  checkboxConfig: { highlight: true },
  columns: [
    { title: '序号', type: 'seq', width: 50, fixed: 'left' },
    {
      field: 'target_type',
      title: '目标类型',
      width: 150,
      fixed: 'left',
      slots: { default: 'target_type' },
    },
    { field: 'target_name', title: '监控目标', width: 120, fixed: 'left' },
    {
      field: 'metric_name',
      title: '监控指标',
      width: 120,
      slots: { default: 'metric_name' },
    },
    {
      field: 'threshold',
      title: '告警条件',
      width: 180,
      slots: { default: 'threshold' },
    },
    {
      field: 'severity',
      title: '严重程度',
      width: 110,
      slots: { default: 'severity' },
    },
    {
      field: 'enabled',
      title: '状态',
      width: 80,
      slots: { default: 'enabled' },
    },
    { field: 'notification_channels', title: '通知渠道', width: 140 },
    { field: 'recipients', title: '接收人', width: 150 },
    {
      field: 'cooldown_time',
      title: '静默时间',
      width: 100,
      slots: { default: 'cooldown_time' },
    },
    {
      field: 'description',
      title: '描述',
      width: 200,
      showOverflow: 'tooltip',
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 170,
      slots: { default: 'created_at' },
    },
    {
      field: 'updated_at',
      title: '更新时间',
      width: 170,
      slots: { default: 'updated_at' },
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 280,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const response = await getAlertConfigList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          return response;
        } catch (error) {
          console.error('API 请求失败:', error);
          throw error;
        }
      },
    },
    response: {
      result: 'items',
      total: 'total',
      list: 'items',
    },
  },
  toolbarConfig: {
    custom: true,
    export: true,
    refresh: true,
    zoom: true,
  },
  rowConfig: {
    isHover: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  formOptions,
});

function handleAddNew() {
  editModalApi.setState({ title: '新增告警配置' });
  editModalApi.setData(undefined);
  editModalApi.open();
}

function handleTicketPolicy() {
  ticketPolicyApi.setState({ title: '服务器告警工单策略' });
  ticketPolicyApi.open();
}

async function loadSilenceRules() {
  silenceRulesLoading.value = true;
  try {
    silenceRules.value = await getServerAlarmSilenceRules();
  } catch (error) {
    console.error('获取服务器告警静默规则失败:', error);
    message.error('获取服务器告警静默规则失败');
  } finally {
    silenceRulesLoading.value = false;
  }
}

function resetSilenceRuleForm() {
  Object.assign(silenceRuleForm, {
    description: '',
    effect: '不入库、不统计、不展示',
    enabled: true,
    example: '',
    match_type: 'regex',
    name: '',
    pattern: '',
    scene: '服务器 Redfish / BMC 告警',
    sort_order: 100,
  });
}

async function openSilenceRuleModal() {
  silenceRuleModalOpen.value = true;
  await loadSilenceRules();
  if (silenceRuleTestText.value.trim()) {
    await handleTestSilenceRule();
  }
}

function openCreateSilenceRule() {
  editingSilenceRule.value = undefined;
  resetSilenceRuleForm();
  silenceRuleEditorOpen.value = true;
}

function openEditSilenceRule(rule: AlertConfigApi.ServerAlarmSilenceRule) {
  editingSilenceRule.value = rule;
  Object.assign(silenceRuleForm, {
    description: rule.description || '',
    effect: rule.effect || '不入库、不统计、不展示',
    enabled: rule.enabled,
    example: rule.example || '',
    match_type: rule.match_type,
    name: rule.name,
    pattern: rule.pattern,
    scene: rule.scene || '',
    sort_order: rule.sort_order ?? 100,
  });
  silenceRuleEditorOpen.value = true;
}

async function saveSilenceRule() {
  if (!silenceRuleForm.name.trim() || !silenceRuleForm.pattern.trim()) {
    message.warning('请填写规则名称和匹配表达式');
    return;
  }
  silenceRuleSaving.value = true;
  try {
    if (editingSilenceRule.value) {
      await updateServerAlarmSilenceRule(
        editingSilenceRule.value.id,
        silenceRuleForm,
      );
      message.success('静默规则已更新');
    } else {
      await createServerAlarmSilenceRule(silenceRuleForm);
      message.success('静默规则已创建');
    }
    silenceRuleEditorOpen.value = false;
    await loadSilenceRules();
    if (silenceRuleTestText.value.trim()) {
      await handleTestSilenceRule();
    }
  } catch (error: any) {
    console.error('保存服务器告警静默规则失败:', error);
    message.error(error?.message || '保存服务器告警静默规则失败');
  } finally {
    silenceRuleSaving.value = false;
  }
}

async function toggleSilenceRule(rule: AlertConfigApi.ServerAlarmSilenceRule) {
  try {
    await toggleServerAlarmSilenceRule(rule.id);
    message.success(rule.enabled ? '静默规则已停用' : '静默规则已启用');
    await loadSilenceRules();
    if (silenceRuleTestText.value.trim()) {
      await handleTestSilenceRule();
    }
  } catch (error) {
    console.error('切换服务器告警静默规则失败:', error);
    message.error('切换服务器告警静默规则失败');
  }
}

function confirmDeleteSilenceRule(rule: AlertConfigApi.ServerAlarmSilenceRule) {
  Modal.confirm({
    title: '删除静默规则',
    content: `确定删除「${rule.name}」吗？删除后命中的服务器告警将重新进入告警链路。`,
    okText: '删除',
    okType: 'danger',
    async onOk() {
      try {
        await deleteServerAlarmSilenceRule(rule.id);
        message.success('静默规则已删除');
        await loadSilenceRules();
        if (silenceRuleTestText.value.trim()) {
          await handleTestSilenceRule();
        }
      } catch (error: any) {
        console.error('删除服务器告警静默规则失败:', error);
        message.error(error?.message || '删除服务器告警静默规则失败');
      }
    },
  });
}

async function handleTestSilenceRule() {
  const text = silenceRuleTestText.value.trim();
  if (!text) {
    silenceRuleTestResult.value = undefined;
    return;
  }
  silenceRuleTesting.value = true;
  try {
    silenceRuleTestResult.value = await testServerAlarmSilenceRules(text);
  } catch (error) {
    console.error('测试服务器告警静默规则失败:', error);
    message.error('测试服务器告警静默规则失败');
  } finally {
    silenceRuleTesting.value = false;
  }
}

function handleEdit(row: AlertConfigApi.AlertConfig) {
  editModalApi.setState({ title: '编辑告警配置' });
  editModalApi.setData(row);
  editModalApi.open();
}

async function handleDelete(row: AlertConfigApi.AlertConfig) {
  try {
    await deleteAlertConfig(row.id);
    message.success('删除成功');
    gridApi.reload();
  } catch (error) {
    console.error('删除失败:', error);
  }
}

async function handleToggleStatus(row: AlertConfigApi.AlertConfig) {
  try {
    await toggleAlertConfig(row.id);
    message.success(row.enabled ? '已禁用' : '已启用');
    gridApi.reload();
  } catch (error) {
    console.error('操作失败:', error);
  }
}

async function handleTest(row: AlertConfigApi.AlertConfig) {
  try {
    await testAlertConfig(row.id);
    message.success('测试通知已发送');
  } catch (error) {
    console.error('测试失败:', error);
  }
}
</script>

<template>
  <Page auto-content-height>
    <EditModal />
    <TicketPolicy />
    <Modal
      v-model:open="silenceRuleModalOpen"
      :footer="null"
      title="服务器告警静默匹配"
      width="860px"
    >
      <div class="silence-rule-panel">
        <Alert
          show-icon
          type="info"
          message="命中静默规则的服务器告警会在采集、事件推送和入库前过滤，不进入告警展示、统计和工单链路。"
        />

        <section class="silence-rule-section">
          <div class="silence-rule-title">
            <span>数据库规则</span>
            <div class="silence-rule-title-actions">
              <Tag color="processing">
                启用 {{ enabledSilenceRuleCount }}/{{ silenceRules.length }}
              </Tag>
              <Button
                size="small"
                type="primary"
                @click="openCreateSilenceRule"
              >
                新增规则
              </Button>
              <Button
                :loading="silenceRulesLoading"
                size="small"
                @click="loadSilenceRules"
              >
                刷新
              </Button>
            </div>
          </div>
          <div v-if="silenceRules.length > 0" class="silence-rule-list">
            <div
              v-for="rule in silenceRules"
              :key="rule.id"
              class="silence-rule-item"
            >
              <div class="silence-rule-item-main">
                <strong>
                  {{ rule.name }}
                  <Tag v-if="rule.builtin" color="blue">内置</Tag>
                </strong>
                <span>{{ rule.scene || '-' }}</span>
                <code>{{ rule.pattern }}</code>
              </div>
              <div class="silence-rule-item-side">
                <Switch
                  :checked="rule.enabled"
                  checked-children="启用"
                  size="small"
                  un-checked-children="停用"
                  @change="toggleSilenceRule(rule)"
                />
                <em>{{ rule.effect }}</em>
                <div class="silence-rule-actions">
                  <Button
                    size="small"
                    type="link"
                    @click="openEditSilenceRule(rule)"
                  >
                    编辑
                  </Button>
                  <Button
                    danger
                    :disabled="rule.builtin"
                    size="small"
                    type="link"
                    @click="confirmDeleteSilenceRule(rule)"
                  >
                    删除
                  </Button>
                </div>
              </div>
              <p>示例：{{ rule.example || '-' }}</p>
            </div>
          </div>
          <div v-else class="silence-rule-empty">
            {{ silenceRulesLoading ? '正在加载静默规则...' : '暂无静默规则' }}
          </div>
        </section>

        <section class="silence-rule-section">
          <div class="silence-rule-title">
            <span>匹配测试</span>
            <Tag :color="matchedSilenceRule ? 'success' : 'default'">
              {{ matchedSilenceRule ? '命中静默' : '未命中' }}
            </Tag>
          </div>
          <Input.TextArea
            v-model:value="silenceRuleTestText"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            placeholder="粘贴服务器告警内容，例如：集成RAID控制器1的巡检操作完成."
          />
          <Button
            :loading="silenceRuleTesting"
            type="primary"
            @click="handleTestSilenceRule"
          >
            测试匹配
          </Button>
          <div
            class="silence-rule-result"
            :class="{ matched: matchedSilenceRule }"
          >
            <template v-if="matchedSilenceRule">
              <strong>命中规则：{{ matchedSilenceRule.name }}</strong>
              <span>处理结果：{{ matchedSilenceRule.effect }}</span>
            </template>
            <template v-else>
              <strong>未命中静默规则</strong>
              <span>该内容会继续按正常服务器告警流程处理。</span>
            </template>
          </div>
        </section>
      </div>
    </Modal>
    <Modal
      v-model:open="silenceRuleEditorOpen"
      :confirm-loading="silenceRuleSaving"
      :title="editingSilenceRule ? '编辑静默规则' : '新增静默规则'"
      width="720px"
      @ok="saveSilenceRule"
    >
      <div class="silence-rule-form">
        <label>
          <span>规则名称</span>
          <Input
            v-model:value="silenceRuleForm.name"
            placeholder="例如：RAID 巡检完成通知"
          />
        </label>
        <label>
          <span>匹配类型</span>
          <Select
            v-model:value="silenceRuleForm.match_type"
            :options="[
              { label: '正则匹配', value: 'regex' },
              { label: '包含文本', value: 'contains' },
            ]"
          />
        </label>
        <label class="silence-rule-form-wide">
          <span>匹配表达式</span>
          <Input.TextArea
            v-model:value="silenceRuleForm.pattern"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="例如：巡检\\s*操作\\s*完成"
          />
        </label>
        <label>
          <span>适用场景</span>
          <Input
            v-model:value="silenceRuleForm.scene"
            placeholder="服务器 Redfish / BMC 告警"
          />
        </label>
        <label>
          <span>排序</span>
          <InputNumber
            v-model:value="silenceRuleForm.sort_order"
            class="w-full"
          />
        </label>
        <label class="silence-rule-form-wide">
          <span>示例内容</span>
          <Input.TextArea
            v-model:value="silenceRuleForm.example"
            :auto-size="{ minRows: 2, maxRows: 4 }"
            placeholder="集成RAID控制器1的巡检操作完成."
          />
        </label>
        <label class="silence-rule-form-wide">
          <span>规则说明</span>
          <Input.TextArea
            v-model:value="silenceRuleForm.description"
            :auto-size="{ minRows: 2, maxRows: 4 }"
          />
        </label>
        <label class="silence-rule-form-inline">
          <Switch v-model:checked="silenceRuleForm.enabled" />
          <span>启用该静默规则</span>
        </label>
      </div>
    </Modal>
    <Grid>
      <template #toolbar-tools>
        <Button class="mr-2" @click="handleTicketPolicy()"> 工单策略 </Button>
        <Button class="mr-2" @click="openSilenceRuleModal()"> 静默匹配 </Button>
        <Button
          v-if="actions.canAdd"
          class="mr-2"
          type="primary"
          @click="handleAddNew()"
        >
          新增告警配置
        </Button>
      </template>
      <template #target_type="{ row }">
        <Tag :color="TARGET_TYPE_MAP[row.target_type]?.color || 'default'">
          {{ TARGET_TYPE_MAP[row.target_type]?.label || row.target_type }}
        </Tag>
      </template>
      <template #metric_name="{ row }">
        <Tag color="cyan">{{ row.metric_name }}</Tag>
      </template>
      <template #threshold="{ row }">
        <span>
          {{ COND_LABEL[row.condition] || row.condition }} {{ row.threshold }}
          <span v-if="row.threshold_max">~ {{ row.threshold_max }}</span>
        </span>
      </template>
      <template #severity="{ row }">
        <Tag :color="SEVERITY_MAP[row.severity]?.color || 'default'">
          {{ SEVERITY_MAP[row.severity]?.label || row.severity }}
        </Tag>
      </template>
      <template #notification_channels="{ row }">
        <span v-if="row.notification_channels">
          {{ row.notification_channels.split(',').filter(Boolean).join(', ') }}
        </span>
        <span v-else class="text-gray-400">未配置</span>
      </template>
      <template #recipients="{ row }">
        <span v-if="row.recipient_names || row.recipients">{{
          (row.recipient_names || row.recipients)
            .split(',')
            .filter(Boolean)
            .join(', ')
        }}</span>
        <span v-else class="text-gray-400">-</span>
      </template>
      <template #cooldown_time="{ row }">
        {{ formatCooldown(row.cooldown_time) }}
      </template>
      <template #description="{ row }">
        <span>{{ row.description || '-' }}</span>
      </template>
      <template #created_at="{ row }">
        {{ fmtTime(row.created_at) }}
      </template>
      <template #updated_at="{ row }">
        {{ fmtTime(row.updated_at) }}
      </template>
      <template #enabled="{ row }">
        <Switch
          v-if="actions.canEnable || actions.canDisable"
          :checked="row.enabled"
          @change="handleToggleStatus(row)"
        />
        <Tag v-else :color="row.enabled ? 'success' : 'default'">
          {{ row.enabled ? '启用' : '禁用' }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button v-if="actions.canView" type="link" @click="handleEdit(row)">
          查看
        </Button>
        <Button v-if="actions.canEdit" type="link" @click="handleEdit(row)">
          编辑
        </Button>
        <Button v-if="actions.canTest" type="link" @click="handleTest(row)">
          测试
        </Button>
        <Popconfirm
          v-if="actions.canDelete"
          title="确定要删除这个告警配置吗？"
          @confirm="handleDelete(row)"
        >
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      </template>
    </Grid>
  </Page>
</template>

<style scoped>
.silence-rule-panel {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.silence-rule-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.silence-rule-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.silence-rule-title-actions,
.silence-rule-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.silence-rule-list {
  display: grid;
  gap: 10px;
}

.silence-rule-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 14px;
  padding: 12px 14px;
  background: hsl(var(--muted) / 32%);
  border: 1px solid hsl(var(--border));
  border-radius: 10px;
}

.silence-rule-item-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.silence-rule-item-main span,
.silence-rule-item p,
.silence-rule-item-side em,
.silence-rule-result span {
  color: hsl(var(--muted-foreground));
}

.silence-rule-item-main code {
  width: fit-content;
  max-width: 100%;
  padding: 2px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: hsl(var(--foreground));
  white-space: nowrap;
  background: hsl(var(--background));
  border-radius: 5px;
}

.silence-rule-item-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  white-space: nowrap;
}

.silence-rule-item-side em {
  font-size: 12px;
  font-style: normal;
}

.silence-rule-item p {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 12px;
}

.silence-rule-empty {
  padding: 22px;
  color: hsl(var(--muted-foreground));
  text-align: center;
  background: hsl(var(--muted) / 22%);
  border: 1px dashed hsl(var(--border));
  border-radius: 10px;
}

.silence-rule-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: hsl(var(--muted) / 28%);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.silence-rule-result.matched {
  background: rgb(34 197 94 / 10%);
  border-color: rgb(34 197 94 / 30%);
}

.silence-rule-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.silence-rule-form label {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.silence-rule-form label > span {
  font-weight: 600;
}

.silence-rule-form-wide {
  grid-column: 1 / -1;
}

.silence-rule-form-inline {
  flex-direction: row !important;
  grid-column: 1 / -1;
  align-items: center;
}
</style>
