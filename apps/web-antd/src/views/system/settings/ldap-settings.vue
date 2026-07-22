<script lang="ts" setup>
import type { Rule } from 'ant-design-vue/es/form';

import type { SystemSettingsApi } from '#/api/system/settings';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';

import { UploadOutlined } from '@ant-design/icons-vue';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Segmented,
  Select,
  Space,
  Switch,
  Upload,
} from 'ant-design-vue';

import { getRoleList } from '#/api/system/role';
import {
  getLdapConfigApi,
  MASKED_SECRET_VALUE,
  saveLdapConfigApi,
  syncLdapDirectoryApi,
  testLdapConnectionApi,
  uploadLdapCertificateApi,
} from '#/api/system/settings';

defineOptions({ name: 'LdapSettings' });

const activeTab = ref('basic');
const formRef = ref();
const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const testing = ref(false);
const syncing = ref(false);
const certUploading = ref(false);
const testUsername = ref('');
const testError = ref('');
const testResult = ref<null | SystemSettingsApi.LdapTestResult>(null);
const syncError = ref('');
const syncResult = ref<null | SystemSettingsApi.LdapSyncResult>(null);
const roleOptions = ref<Array<{ label: string; value: string }>>([]);
const canManageSettings = hasAccessByCodes(['system_settings:config']);
const excludedDeptRulesText = ref('');
const syncIntervalUnitOptions = [
  { label: '分钟', value: 'minute' },
  { label: '小时', value: 'hour' },
  { label: '天', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
];
const ldapTabOptions = [
  { label: '基础配置', value: 'basic' },
  { label: '用户搜索', value: 'search' },
  { label: '字段映射', value: 'mapping' },
  { label: '用户同步', value: 'sync' },
];

const defaultFormState: SystemSettingsApi.LdapConfig = {
  enabled: false,
  server: '',
  port: 389,
  useSsl: false,
  baseDn: '',
  userDnTemplate: 'uid={username},ou=users,{base_dn}',
  bindDn: '',
  bindPassword: '',
  userSearchBase: '',
  userSearchFilter: '(&(objectClass=person)(uid={username}))',
  usernameAttribute: 'uid',
  emailAttribute: 'mail',
  fullNameAttribute: 'cn',
  phoneAttribute: 'mobile',
  caCertPath: '',
  caCertFilename: '',
  caCertUploadedAt: '',
  caCertInfo: {},
  syncEnabled: false,
  syncInterval: 60,
  syncIntervalUnit: 'minute',
  defaultRoleIds: [],
  syncDisabledUsers: false,
  hideDisabledUsers: false,
  excludedDeptRules: [],
};

const formState = ref<SystemSettingsApi.LdapConfig>({ ...defaultFormState });

const rules: Record<string, Rule[]> = {
  server: [
    {
      required: true,
      message: '请输入 LDAP 服务器',
      trigger: 'blur',
      type: 'string',
    },
  ],
  port: [
    {
      required: true,
      message: '请输入端口',
      trigger: 'change',
      type: 'number',
    },
  ],
  baseDn: [
    {
      required: true,
      message: '请输入 Base DN',
      trigger: 'blur',
      type: 'string',
    },
  ],
  userDnTemplate: [
    {
      required: true,
      message: '请输入用户 DN 模板',
      trigger: 'blur',
      type: 'string',
    },
  ],
};

function handleSslToggle(checked: boolean | number | string) {
  const enabled = checked === true;
  formState.value.useSsl = enabled;
  formState.value.port = enabled ? 636 : 389;
}

function resolveErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}

function renderValue(value?: null | string) {
  return value && value.trim() ? value : '-';
}

function normalizeExcludedDeptRules(text: string) {
  return [
    ...new Set(
      text
        .split(/\r?\n|,/u)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function buildRequestConfig(): SystemSettingsApi.LdapConfig {
  return {
    ...formState.value,
    excludedDeptRules: normalizeExcludedDeptRules(excludedDeptRulesText.value),
  };
}

async function loadConfig() {
  try {
    loading.value = true;
    const response = await getLdapConfigApi();
    if (response) {
      formState.value = {
        ...defaultFormState,
        ...(response as unknown as SystemSettingsApi.LdapConfig),
      };
      excludedDeptRulesText.value = (
        formState.value.excludedDeptRules || []
      ).join('\n');
    }
  } catch (error) {
    console.error('加载配置失败:', error);
  } finally {
    loading.value = false;
  }
}

async function loadRoleOptions() {
  try {
    const response = await getRoleList({ page: 1, pageSize: 1000 });
    roleOptions.value = (response.list || []).map((role) => ({
      label: role.name,
      value: role.id,
    }));
  } catch (error) {
    console.error('加载角色列表失败:', error);
  }
}

async function handleSave() {
  if (!canManageSettings) {
    message.warning('无权限保存系统设置');
    return;
  }
  try {
    await formRef.value?.validate();
    loading.value = true;
    const payload = buildRequestConfig();
    await saveLdapConfigApi(payload);
    formState.value = payload;
    message.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

async function handleTest() {
  if (!canManageSettings) {
    message.warning('无权限测试 LDAP 连接');
    return;
  }
  try {
    testing.value = true;
    testError.value = '';
    testResult.value = await testLdapConnectionApi({
      config: buildRequestConfig(),
      testUsername: testUsername.value.trim(),
    });
    if (testResult.value.sampleUser) {
      message.success('连接与用户查询成功');
      return;
    }
    message.success('连接测试成功');
  } catch (error) {
    console.error('测试失败:', error);
    testResult.value = null;
    testError.value = resolveErrorMessage(error, '连接测试失败');
    message.error(testError.value);
  } finally {
    testing.value = false;
  }
}

async function handleCertUpload(options: any) {
  const { file, onError, onSuccess } = options;

  if (!file?.name) {
    message.error('未获取到证书文件');
    return;
  }
  if (!/\.(?:pem|crt|cer)$/i.test(file.name)) {
    message.error('只支持 .pem / .crt / .cer 证书文件');
    return;
  }

  try {
    certUploading.value = true;
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    const res = await uploadLdapCertificateApi(uploadFormData);
    formState.value.caCertFilename = res.caCertFilename ?? file.name;
    formState.value.caCertPath = res.caCertPath ?? '';
    formState.value.caCertUploadedAt = res.caCertUploadedAt ?? '';
    formState.value.caCertInfo = res.caCertInfo ?? {};
    onSuccess?.(res);
    message.success('证书上传成功');
  } catch (error) {
    console.error('证书上传失败:', error);
    onError?.(error);
    message.error('证书上传失败');
  } finally {
    certUploading.value = false;
  }
}

async function handleSync() {
  if (!canManageSettings) {
    message.warning('无权限执行 LDAP 同步');
    return;
  }
  try {
    await formRef.value?.validate();
    syncing.value = true;
    syncError.value = '';
    const payload = buildRequestConfig();
    syncResult.value = await syncLdapDirectoryApi({
      config: payload,
    });
    formState.value = payload;
    message.success('LDAP 同步完成');
  } catch (error) {
    console.error('LDAP 同步失败:', error);
    syncResult.value = null;
    syncError.value = resolveErrorMessage(error, 'LDAP 同步失败');
    message.error(syncError.value);
  } finally {
    syncing.value = false;
  }
}

onMounted(() => {
  loadConfig();
  loadRoleOptions();
});
</script>

<template>
  <div class="ldap-settings">
    <Row :gutter="[24, 24]">
      <Col :xs="24" :xl="15">
        <Card>
          <template #title>
            <span>LDAP 配置</span>
          </template>

          <Form
            ref="formRef"
            :model="formState"
            :rules="rules"
            :label-col="{ span: 6 }"
            :wrapper-col="{ span: 14 }"
          >
            <Segmented
              v-model:value="activeTab"
              :options="ldapTabOptions"
              class="ldap-tabs"
            />
            <div class="ldap-tab-panel">
              <template v-if="activeTab === 'basic'">
                <Form.Item label="启用 LDAP" name="enabled">
                  <Switch v-model:checked="formState.enabled" />
                </Form.Item>

                <Form.Item label="LDAP 服务器" name="server">
                  <Input
                    v-model:value="formState.server"
                    placeholder="ldap.example.com"
                  />
                </Form.Item>

                <Form.Item label="端口" name="port">
                  <InputNumber
                    v-model:value="formState.port"
                    :min="1"
                    :max="65_535"
                    placeholder="389"
                    class="w-32"
                  />
                </Form.Item>

                <Form.Item label="使用 SSL" name="useSsl">
                  <Switch
                    v-model:checked="formState.useSsl"
                    @change="handleSslToggle"
                  />
                </Form.Item>

                <Form.Item label="Base DN" name="baseDn">
                  <Input
                    v-model:value="formState.baseDn"
                    placeholder="dc=example,dc=com"
                  />
                </Form.Item>

                <Form.Item label="用户 DN 模板" name="userDnTemplate">
                  <Input
                    v-model:value="formState.userDnTemplate"
                    placeholder="uid={username},ou=users,{base_dn}"
                  />
                </Form.Item>

                <Form.Item label="绑定 DN" name="bindDn">
                  <Input
                    v-model:value="formState.bindDn"
                    placeholder="cn=admin,dc=example,dc=com"
                  />
                </Form.Item>

                <Form.Item label="绑定密码" name="bindPassword">
                  <Input.Password
                    v-model:value="formState.bindPassword"
                    placeholder="请输入新的绑定密码"
                  />
                  <div class="secret-field-help">
                    显示
                    {{ MASKED_SECRET_VALUE }}
                    表示已配置绑定密码；保持不变会继续使用原密码，输入新值才会替换。
                  </div>
                </Form.Item>

                <Form.Item
                  v-if="formState.useSsl"
                  label="CA 证书"
                  name="caCertFilename"
                >
                  <Space direction="vertical" style="width: 100%">
                    <Upload
                      :custom-request="handleCertUpload"
                      :show-upload-list="false"
                      accept=".pem,.crt,.cer"
                    >
                      <Button
                        v-access:code="['system_settings:config']"
                        :loading="certUploading"
                      >
                        <UploadOutlined />
                        上传 CA 证书
                      </Button>
                    </Upload>
                    <div class="text-sm text-muted-foreground">
                      当前证书：{{ formState.caCertFilename || '未上传' }}
                    </div>
                    <div
                      v-if="formState.caCertUploadedAt"
                      class="text-sm text-muted-foreground"
                    >
                      上传时间：{{ formState.caCertUploadedAt }}
                    </div>
                  </Space>
                </Form.Item>
              </template>

              <template v-else-if="activeTab === 'search'">
                <Form.Item label="用户搜索基础" name="userSearchBase">
                  <Input
                    v-model:value="formState.userSearchBase"
                    placeholder="ou=users,dc=example,dc=com（留空则使用 Base DN）"
                  />
                </Form.Item>

                <Form.Item label="用户搜索过滤器" name="userSearchFilter">
                  <Input
                    v-model:value="formState.userSearchFilter"
                    placeholder="(&(objectClass=person)(uid={username}))"
                  />
                </Form.Item>

                <div class="mt-4 rounded bg-muted p-4 dark:bg-gray-800">
                  <h4 class="mb-2 font-semibold text-foreground">
                    搜索配置说明：
                  </h4>
                  <ul
                    class="list-inside list-disc space-y-1 text-sm text-muted-foreground"
                  >
                    <li>
                      用户搜索基础：指定搜索用户的起始位置，留空则使用 Base DN
                    </li>
                    <li>
                      用户搜索过滤器：LDAP 搜索过滤条件，{username}
                      会被替换为实际用户名
                    </li>
                    <li>
                      常用过滤器示例：(&(objectClass=person)(uid={username}))
                    </li>
                  </ul>
                </div>
              </template>

              <template v-else-if="activeTab === 'mapping'">
                <Form.Item label="用户名属性" name="usernameAttribute">
                  <Input
                    v-model:value="formState.usernameAttribute"
                    placeholder="uid"
                    class="w-48"
                  />
                </Form.Item>

                <Form.Item label="邮箱属性" name="emailAttribute">
                  <Input
                    v-model:value="formState.emailAttribute"
                    placeholder="mail"
                    class="w-48"
                  />
                </Form.Item>

                <Form.Item label="姓名属性" name="fullNameAttribute">
                  <Input
                    v-model:value="formState.fullNameAttribute"
                    placeholder="cn"
                    class="w-48"
                  />
                </Form.Item>

                <Form.Item label="手机号属性" name="phoneAttribute">
                  <Input
                    v-model:value="formState.phoneAttribute"
                    placeholder="mobile"
                    class="w-48"
                  />
                </Form.Item>

                <div class="mt-4 rounded bg-muted p-4 dark:bg-gray-800">
                  <h4 class="mb-2 font-semibold text-foreground">
                    字段映射说明：
                  </h4>
                  <ul
                    class="list-inside list-disc space-y-1 text-sm text-muted-foreground"
                  >
                    <li>用于将 LDAP 属性映射到系统用户字段</li>
                    <li>
                      常用属性：uid（用户名）、mail（邮箱）、cn（姓名）、mobile（手机号）
                    </li>
                    <li>
                      不同 LDAP 服务器的属性名可能不同，请根据实际情况配置
                    </li>
                  </ul>
                </div>
              </template>

              <template v-else-if="activeTab === 'sync'">
                <Form.Item label="启用同步" name="syncEnabled">
                  <Switch v-model:checked="formState.syncEnabled" />
                </Form.Item>

                <Form.Item label="同步间隔" name="syncInterval">
                  <InputNumber
                    v-model:value="formState.syncInterval"
                    :min="1"
                    :max="365"
                    placeholder="60"
                    class="ldap-sync-interval-number"
                  />
                </Form.Item>

                <Form.Item label="同步单位" name="syncIntervalUnit">
                  <Select
                    v-model:value="formState.syncIntervalUnit"
                    :options="syncIntervalUnitOptions"
                    class="ldap-sync-interval-unit"
                  />
                </Form.Item>

                <Form.Item label="默认角色" name="defaultRoleIds">
                  <Select
                    v-model:value="formState.defaultRoleIds"
                    mode="multiple"
                    allow-clear
                    :options="roleOptions"
                    placeholder="选择新同步 LDAP 用户的默认角色"
                    class="ldap-default-role-select"
                  />
                </Form.Item>

                <Form.Item label="同步停用用户" name="syncDisabledUsers">
                  <Switch v-model:checked="formState.syncDisabledUsers" />
                </Form.Item>

                <Form.Item label="隐藏停用用户" name="hideDisabledUsers">
                  <Switch v-model:checked="formState.hideDisabledUsers" />
                </Form.Item>

                <Form.Item label="排除部门" name="excludedDeptRules">
                  <Input.TextArea
                    v-model:value="excludedDeptRulesText"
                    :rows="4"
                    placeholder="每行一个部门名或相对路径，例如：&#10;离职人员&#10;外包部门&#10;研发中心/测试组"
                    class="ldap-excluded-dept-input"
                  />
                </Form.Item>

                <div class="mt-4 rounded bg-muted p-4 dark:bg-gray-800">
                  <h4 class="mb-2 font-semibold text-foreground">
                    同步配置说明：
                  </h4>
                  <ul
                    class="list-inside list-disc space-y-1 text-sm text-muted-foreground"
                  >
                    <li>
                      启用同步后，系统会定期从 LDAP 同步用户信息到本地数据库
                    </li>
                    <li>
                      同步间隔支持分钟、小时、天、周、月，后端会按所选单位执行定时同步
                    </li>
                    <li>同步会自动创建新用户、更新已有用户信息</li>
                    <li>
                      默认角色仅在新建本地 LDAP
                      用户时自动分配，不会覆盖已有人员角色
                    </li>
                    <li>
                      关闭“同步停用用户”后，目录中已停用账号会被过滤，并在本地自动锁定
                    </li>
                    <li>
                      开启“隐藏停用用户”后，用户管理默认列表不再显示已停用 LDAP
                      用户
                    </li>
                    <li>
                      排除部门支持按“部门名”或“相对路径”过滤，命中的部门及其下级人员不会参与同步
                    </li>
                  </ul>
                </div>
              </template>
            </div>

            <Form.Item :wrapper-col="{ offset: 6, span: 14 }">
              <Space wrap>
                <Button
                  v-access:code="['system_settings:config']"
                  type="primary"
                  :loading="loading"
                  @click="handleSave"
                >
                  保存配置
                </Button>
                <Button
                  v-access:code="['system_settings:config']"
                  :loading="testing"
                  @click="handleTest"
                >
                  测试连接
                </Button>
                <Button
                  v-access:code="['system_settings:config']"
                  :loading="syncing"
                  @click="handleSync"
                >
                  立即同步
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col :xs="24" :xl="9">
        <Space direction="vertical" style="width: 100%" :size="16">
          <Card title="测试结果">
            <Space direction="vertical" style="width: 100%" :size="16">
              <Input
                v-model:value="testUsername"
                placeholder="输入测试用户名后可同时验证用户搜索"
              />

              <Alert
                v-if="testError"
                type="error"
                show-icon
                :message="testError"
              />
              <Alert
                v-else-if="testResult"
                :type="testResult.sampleUser ? 'success' : 'info'"
                show-icon
                :message="
                  testResult.sampleUser
                    ? '连接成功，已获取到测试用户'
                    : '连接成功，当前未返回测试用户'
                "
                :description="
                  testResult.legacyTlsFallbackUsed
                    ? '本次测试已自动启用旧证书兼容模式。'
                    : '本次测试使用标准 TLS 校验。'
                "
              />
              <Alert
                v-if="testResult?.attributeFallbackUsed"
                type="warning"
                show-icon
                message="部分映射属性不被当前 LDAP 接受，测试时已自动降级到安全属性集。"
                :description="renderValue(testResult.attributeFallbackReason)"
              />
              <div
                v-if="!testError && !testResult"
                class="text-sm text-muted-foreground"
              >
                点击“测试连接”后，这里会展示绑定结果、搜索条件和返回的用户摘要。
              </div>

              <Descriptions v-if="testResult" size="small" bordered :column="1">
                <Descriptions.Item label="服务器">
                  {{ renderValue(testResult.server) }}
                </Descriptions.Item>
                <Descriptions.Item label="端口 / SSL">
                  {{ testResult.port }} / {{ testResult.useSsl ? '是' : '否' }}
                </Descriptions.Item>
                <Descriptions.Item label="绑定 DN">
                  {{ renderValue(testResult.bindDn) }}
                </Descriptions.Item>
                <Descriptions.Item label="搜索基础">
                  {{ renderValue(testResult.userSearchBase) }}
                </Descriptions.Item>
                <Descriptions.Item label="搜索过滤器">
                  {{
                    renderValue(
                      testResult.searchFilter ||
                        testResult.userSearchFilterTemplate,
                    )
                  }}
                </Descriptions.Item>
                <Descriptions.Item label="匹配数量">
                  {{ testResult.matchedCount }}
                </Descriptions.Item>
                <Descriptions.Item label="兼容模式">
                  {{ testResult.legacyTlsFallbackUsed ? '已启用' : '未启用' }}
                </Descriptions.Item>
              </Descriptions>

              <div
                v-if="
                  testResult &&
                  testResult.searchExecuted &&
                  !testResult.sampleUser &&
                  !!testResult.testUsername
                "
                class="text-sm text-muted-foreground"
              >
                当前测试用户名未在这个搜索范围内返回结果，你可以重点检查 Base
                DN、搜索过滤器和测试用户名是否对应。
              </div>

              <template v-if="testResult?.sampleUser">
                <div class="ldap-panel-title">测试用户</div>
                <Descriptions size="small" bordered :column="1">
                  <Descriptions.Item label="DN">
                    {{ renderValue(testResult.sampleUser.dn) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="用户名">
                    {{ renderValue(testResult.sampleUser.username) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="姓名">
                    {{ renderValue(testResult.sampleUser.fullName) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="邮箱">
                    {{ renderValue(testResult.sampleUser.email) }}
                  </Descriptions.Item>
                  <Descriptions.Item label="手机号">
                    {{ renderValue(testResult.sampleUser.phone) }}
                  </Descriptions.Item>
                </Descriptions>

                <div class="ldap-panel-title">返回属性</div>
                <pre class="ldap-json">{{
                  JSON.stringify(testResult.sampleUser.attributes, null, 2)
                }}</pre>
              </template>
            </Space>
          </Card>

          <Card title="证书信息">
            <template v-if="formState.caCertFilename">
              <Descriptions size="small" bordered :column="1">
                <Descriptions.Item label="文件名">
                  {{ renderValue(formState.caCertFilename) }}
                </Descriptions.Item>
                <Descriptions.Item label="上传时间">
                  {{ renderValue(formState.caCertUploadedAt) }}
                </Descriptions.Item>
                <Descriptions.Item label="主题">
                  {{ renderValue(formState.caCertInfo?.subject) }}
                </Descriptions.Item>
                <Descriptions.Item label="颁发者">
                  {{ renderValue(formState.caCertInfo?.issuer) }}
                </Descriptions.Item>
                <Descriptions.Item label="序列号">
                  {{ renderValue(formState.caCertInfo?.serialNumber) }}
                </Descriptions.Item>
                <Descriptions.Item label="有效期开始">
                  {{ renderValue(formState.caCertInfo?.notBefore) }}
                </Descriptions.Item>
                <Descriptions.Item label="有效期结束">
                  {{ renderValue(formState.caCertInfo?.notAfter) }}
                </Descriptions.Item>
                <Descriptions.Item label="签名算法">
                  {{ renderValue(formState.caCertInfo?.signatureAlgorithm) }}
                </Descriptions.Item>
                <Descriptions.Item label="SHA-256 指纹">
                  <span class="ldap-break">{{
                    renderValue(formState.caCertInfo?.sha256Fingerprint)
                  }}</span>
                </Descriptions.Item>
              </Descriptions>
            </template>
            <div v-else class="text-sm text-muted-foreground">
              上传 CA 证书后，这里会显示证书主题、颁发者、有效期和指纹。
            </div>
          </Card>

          <Card title="同步结果">
            <Space direction="vertical" style="width: 100%" :size="16">
              <Alert
                v-if="syncError"
                type="error"
                show-icon
                :message="syncError"
              />
              <Alert
                v-else-if="syncResult"
                :type="syncResult.counts.skippedUsers ? 'warning' : 'success'"
                show-icon
                message="LDAP 手动同步已完成"
                :description="
                  syncResult.legacyTlsFallbackUsed
                    ? '同步过程中已自动启用旧证书兼容模式。'
                    : '同步过程使用标准 TLS 校验。'
                "
              />
              <div v-else class="text-sm text-muted-foreground">
                点击“立即同步”后，这里会展示本次导入的部门、用户数量和告警信息。
              </div>

              <Descriptions v-if="syncResult" size="small" bordered :column="1">
                <Descriptions.Item label="根部门">
                  {{ renderValue(syncResult.rootDepartmentName) }}
                </Descriptions.Item>
                <Descriptions.Item label="用户搜索范围">
                  {{ renderValue(syncResult.userSearchBase) }}
                </Descriptions.Item>
                <Descriptions.Item label="用户过滤器">
                  {{ renderValue(syncResult.userSearchFilter) }}
                </Descriptions.Item>
                <Descriptions.Item label="默认角色">
                  {{
                    syncResult.defaultRoleNames?.length
                      ? syncResult.defaultRoleNames.join(' / ')
                      : '未配置'
                  }}
                </Descriptions.Item>
                <Descriptions.Item label="部门新增 / 更新">
                  {{ syncResult.counts.createdDepartments }} /
                  {{ syncResult.counts.updatedDepartments }}
                </Descriptions.Item>
                <Descriptions.Item label="用户新增 / 更新 / 未变更">
                  {{ syncResult.counts.createdUsers }} /
                  {{ syncResult.counts.updatedUsers }} /
                  {{ syncResult.counts.unchangedUsers }}
                </Descriptions.Item>
                <Descriptions.Item label="默认角色分配次数">
                  {{ syncResult.counts.assignedDefaultRoles }}
                </Descriptions.Item>
                <Descriptions.Item label="本次锁定用户">
                  {{ syncResult.counts.lockedUsers }}
                </Descriptions.Item>
                <Descriptions.Item label="过滤停用用户">
                  {{ syncResult.counts.filteredDisabledUsers }}
                </Descriptions.Item>
                <Descriptions.Item label="过滤部门 / 人员">
                  {{ syncResult.counts.filteredDepartments }} /
                  {{ syncResult.counts.filteredDepartmentUsers }}
                </Descriptions.Item>
                <Descriptions.Item label="跳过用户">
                  {{ syncResult.counts.skippedUsers }}
                </Descriptions.Item>
                <Descriptions.Item label="LDAP OU / 用户条目">
                  {{ syncResult.counts.ldapOuEntries }} /
                  {{ syncResult.counts.ldapUserEntries }}
                </Descriptions.Item>
                <Descriptions.Item label="同步时间">
                  {{ renderValue(syncResult.syncedAt) }}
                </Descriptions.Item>
              </Descriptions>

              <template v-if="syncResult?.warnings?.length">
                <div class="ldap-panel-title">同步告警</div>
                <pre class="ldap-json">{{
                  JSON.stringify(syncResult.warnings, null, 2)
                }}</pre>
              </template>
            </Space>
          </Card>
        </Space>
      </Col>
    </Row>
  </div>
</template>

<style scoped>
.ldap-settings {
  width: 100%;
}

.ldap-panel-title {
  font-size: 14px;
  font-weight: 600;
}

.ldap-json {
  max-height: 240px;
  padding: 12px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  color: #e2e8f0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  background: #0f172a;
  border-radius: 10px;
}

.ldap-break {
  word-break: break-all;
}

.secret-field-help {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--ant-color-text-secondary);
}

.ldap-tabs {
  margin-bottom: 20px;
}

.ldap-tab-panel {
  min-height: 360px;
}

.ldap-sync-interval-number {
  width: 120px;
}

.ldap-sync-interval-unit {
  width: 100px;
}

.ldap-default-role-select {
  width: 100%;
  max-width: 420px;
}

.ldap-excluded-dept-input {
  display: block;
  width: 100%;
  max-width: 420px;
}

@media (max-width: 768px) {
  .ldap-default-role-select,
  .ldap-excluded-dept-input {
    max-width: 100%;
  }
}
</style>
