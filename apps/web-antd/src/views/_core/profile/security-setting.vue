<script setup lang="ts">
import { computed, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { useClipboard } from '@vueuse/core';
import {
  Button as AButton,
  Input as AInput,
  Modal as AModal,
  Spin as ASpin,
  message,
} from 'ant-design-vue';
import QRCode from 'qrcode';

import {
  disableMfa,
  enableMfa,
  getMfaSetup,
  getMfaStatus,
  getMyProfile,
  getSecurityStatus,
  sendEmailCode,
  sendPhoneCode,
  unbindEmail,
  unbindPhone,
  verifyEmail,
  verifyPhone,
} from '#/api/system/user';

defineEmits<{
  goToPassword: [];
}>();

const userStore = useUserStore();
const { copy: copyToClipboard } = useClipboard({ legacy: true });
const phoneBound = ref(false);
const phoneDisplay = ref('');
const emailBound = ref(false);
const emailDisplay = ref('');
const mfaEnabled = ref(false);
const mfaBackupRemaining = ref(0);
const loading = ref(false);

// 密保手机
const phoneModal = ref(false);
const phoneInput = ref('');
const phoneCode = ref('');
const phoneCountdown = ref(0);
let phoneTimer: null | number = null;

// 备用邮箱
const emailModal = ref(false);
const emailInput = ref('');
const emailCode = ref('');
const emailCountdown = ref(0);
let emailTimer: null | number = null;

// MFA
const mfaModal = ref(false);
const mfaStep = ref<'disable' | 'done' | 'setup' | 'verify'>('setup');
const mfaSecret = ref('');
const mfaQrCode = ref('');
const mfaCode = ref('');
const mfaBackupCodes = ref<string[]>([]);
const mfaLoading = ref(false);
const isLdapUser = computed(() => userStore.userInfo?.auth_type === 'ldap');

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function maskEmail(email: string) {
  const at = email.indexOf('@');
  return `${email.slice(0, 2)}***${email.slice(at)}`;
}

// 获取安全状态
async function loadStatus() {
  try {
    const status = await getSecurityStatus();
    phoneBound.value = status.phone_bound;
    emailBound.value = status.email_bound;
    mfaEnabled.value = status.mfa_enabled;

    // 获取最新个人信息用于显示
    const profile = await getMyProfile();
    if (profile?.mobile_phone) {
      phoneDisplay.value = maskPhone(profile.mobile_phone);
    }
    if (profile?.email) {
      emailDisplay.value = maskEmail(profile.email);
    }

    // MFA 状态
    const mfaStatus = await getMfaStatus();
    mfaEnabled.value = mfaStatus.enabled;
    mfaBackupRemaining.value = mfaStatus.backup_remaining;
  } catch {
    message.error('加载安全状态失败');
  }
}

// ==================== 密保手机 ====================

function startPhoneCountdown() {
  phoneCountdown.value = 60;
  phoneTimer = window.setInterval(() => {
    phoneCountdown.value--;
    if (phoneCountdown.value <= 0 && phoneTimer) {
      clearInterval(phoneTimer);
      phoneTimer = null;
    }
  }, 1000);
}

async function handleSendPhoneCode() {
  if (!phoneInput.value) {
    message.error('请输入手机号');
    return;
  }
  loading.value = true;
  try {
    await sendPhoneCode(phoneInput.value);
    message.success('验证码已发送');
    startPhoneCountdown();
  } catch (error: any) {
    message.error(error?.message || '发送失败');
  } finally {
    loading.value = false;
  }
}

async function handleBindPhone() {
  if (!phoneCode.value) {
    message.error('请输入验证码');
    return;
  }
  loading.value = true;
  try {
    await verifyPhone(phoneInput.value, phoneCode.value);
    message.success('手机绑定成功');
    phoneModal.value = false;
    phoneInput.value = '';
    phoneCode.value = '';
    if (phoneTimer) clearInterval(phoneTimer);
    phoneCountdown.value = 0;
    loadStatus();
  } catch (error: any) {
    message.error(error?.message || '绑定失败');
  } finally {
    loading.value = false;
  }
}

function handleUnbindPhone() {
  AModal.confirm({
    title: '确认解绑',
    content: '解绑后将无法通过手机找回账户，是否继续？',
    okText: '确认解绑',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await unbindPhone();
        message.success('手机已解绑');
        loadStatus();
      } catch (error: any) {
        message.error(error?.message || '解绑失败');
      }
    },
  });
}

// ==================== 备用邮箱 ====================

function startEmailCountdown() {
  emailCountdown.value = 60;
  emailTimer = window.setInterval(() => {
    emailCountdown.value--;
    if (emailCountdown.value <= 0 && emailTimer) {
      clearInterval(emailTimer);
      emailTimer = null;
    }
  }, 1000);
}

async function handleSendEmailCode() {
  if (!emailInput.value) {
    message.error('请输入邮箱');
    return;
  }
  loading.value = true;
  try {
    await sendEmailCode(emailInput.value);
    message.success('验证码已发送');
    startEmailCountdown();
  } catch (error: any) {
    message.error(error?.message || '发送失败');
  } finally {
    loading.value = false;
  }
}

async function handleBindEmail() {
  if (!emailCode.value) {
    message.error('请输入验证码');
    return;
  }
  loading.value = true;
  try {
    await verifyEmail(emailInput.value, emailCode.value);
    message.success('邮箱绑定成功');
    emailModal.value = false;
    emailInput.value = '';
    emailCode.value = '';
    if (emailTimer) clearInterval(emailTimer);
    emailCountdown.value = 0;
    loadStatus();
  } catch (error: any) {
    message.error(error?.message || '绑定失败');
  } finally {
    loading.value = false;
  }
}

function handleUnbindEmail() {
  AModal.confirm({
    title: '确认解绑',
    content: '解绑后将无法通过邮箱找回账户，是否继续？',
    okText: '确认解绑',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        await unbindEmail();
        message.success('邮箱已解绑');
        loadStatus();
      } catch (error: any) {
        message.error(error?.message || '解绑失败');
      }
    },
  });
}

// ==================== MFA 设备 ====================

async function openMfaSetup() {
  mfaStep.value = 'setup';
  mfaCode.value = '';
  mfaModal.value = true;
  mfaLoading.value = true;
  try {
    const data = await getMfaSetup();
    if (data.enabled) {
      mfaEnabled.value = true;
      mfaStep.value = 'disable';
    } else {
      mfaSecret.value = data.secret || '';
      // 生成二维码
      const qrUrl = data.qr_code_url || '';
      mfaQrCode.value = await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 1,
      });
    }
  } catch (error: any) {
    message.error(error?.message || '获取 MFA 信息失败');
    mfaModal.value = false;
  } finally {
    mfaLoading.value = false;
  }
}

async function handleEnableMfa() {
  if (!mfaCode.value) {
    message.error('请输入验证码');
    return;
  }
  mfaLoading.value = true;
  try {
    const data = await enableMfa(mfaCode.value);
    mfaBackupCodes.value = data.backup_codes || [];
    mfaEnabled.value = true;
    mfaBackupRemaining.value = mfaBackupCodes.value.length;
    mfaStep.value = 'done';
    message.success('MFA 启用成功');
  } catch (error: any) {
    message.error(error?.message || '启用失败');
  } finally {
    mfaLoading.value = false;
  }
}

async function handleDisableMfa() {
  if (!mfaCode.value) {
    message.error('请输入验证码或备用码');
    return;
  }
  mfaLoading.value = true;
  try {
    await disableMfa(mfaCode.value);
    message.success('MFA 已禁用');
    mfaModal.value = false;
    mfaCode.value = '';
    mfaEnabled.value = false;
  } catch (error: any) {
    message.error(error?.message || '禁用失败');
  } finally {
    mfaLoading.value = false;
  }
}

async function copyBackupCodes() {
  const text = mfaBackupCodes.value.join('\n');
  if (!text) {
    message.warning('当前没有可复制的备用码');
    return;
  }
  try {
    await copyToClipboard(text);
    message.success('备用码已复制到剪贴板');
  } catch {
    message.error('复制失败，请手动保存备用码');
  }
}

async function finishMfaSetup() {
  mfaModal.value = false;
  await loadStatus();
}

// 初始化
loadStatus();
</script>
<template>
  <div class="space-y-4">
    <!-- 账户密码 -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="text-sm font-medium">账户密码</div>
        <div class="text-xs text-muted-foreground">
          {{
            isLdapUser
              ? 'LDAP用户密码由目录服务管理，请使用目录账号密码登录'
              : '定期修改密码可以提高账户安全性'
          }}
        </div>
      </div>
      <AButton v-if="!isLdapUser" size="small" @click="$emit('goToPassword')">
        修改密码
      </AButton>
    </div>

    <!-- 密保手机 -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="text-sm font-medium">密保手机</div>
        <div class="text-xs text-muted-foreground">
          已绑定手机：{{ phoneBound ? phoneDisplay : '未绑定' }}
        </div>
      </div>
      <div class="flex gap-2">
        <AButton v-if="phoneBound" size="small" @click="handleUnbindPhone">
          解绑
        </AButton>
        <AButton size="small" @click="phoneModal = true">
          {{ phoneBound ? '更换' : '绑定' }}
        </AButton>
      </div>
    </div>

    <!-- 备用邮箱 -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="text-sm font-medium">备用邮箱</div>
        <div class="text-xs text-muted-foreground">
          已绑定邮箱：{{ emailBound ? emailDisplay : '未绑定' }}
        </div>
      </div>
      <div class="flex gap-2">
        <AButton v-if="emailBound" size="small" @click="handleUnbindEmail">
          解绑
        </AButton>
        <AButton size="small" @click="emailModal = true">
          {{ emailBound ? '更换' : '绑定' }}
        </AButton>
      </div>
    </div>

    <!-- MFA 设备 -->
    <div class="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div class="text-sm font-medium">MFA 设备</div>
        <div class="text-xs text-muted-foreground">
          {{
            mfaEnabled
              ? `已启用，剩余 ${mfaBackupRemaining} 个备用码`
              : '未绑定 MFA 设备，绑定后可进行二次确认'
          }}
        </div>
      </div>
      <AButton size="small" @click="openMfaSetup">
        {{ mfaEnabled ? '管理' : '绑定' }}
      </AButton>
    </div>

    <!-- 手机绑定弹窗 -->
    <AModal
      v-model:open="phoneModal"
      :title="phoneBound ? '更换手机' : '绑定手机'"
      :confirm-loading="loading"
      @ok="handleBindPhone"
    >
      <div class="space-y-4">
        <AInput v-model:value="phoneInput" placeholder="请输入手机号" />
        <div class="flex gap-2">
          <AInput
            v-model:value="phoneCode"
            placeholder="请输入验证码"
            class="flex-1"
          />
          <AButton
            :disabled="phoneCountdown > 0"
            :loading="loading"
            @click="handleSendPhoneCode"
          >
            {{
              phoneCountdown > 0 ? `${phoneCountdown}s 后重发` : '获取验证码'
            }}
          </AButton>
        </div>
      </div>
    </AModal>

    <!-- 邮箱绑定弹窗 -->
    <AModal
      v-model:open="emailModal"
      :title="emailBound ? '更换邮箱' : '绑定邮箱'"
      :confirm-loading="loading"
      @ok="handleBindEmail"
    >
      <div class="space-y-4">
        <AInput v-model:value="emailInput" placeholder="请输入邮箱" />
        <div class="flex gap-2">
          <AInput
            v-model:value="emailCode"
            placeholder="请输入验证码"
            class="flex-1"
          />
          <AButton
            :disabled="emailCountdown > 0"
            :loading="loading"
            @click="handleSendEmailCode"
          >
            {{
              emailCountdown > 0 ? `${emailCountdown}s 后重发` : '获取验证码'
            }}
          </AButton>
        </div>
      </div>
    </AModal>

    <!-- MFA 弹窗 -->
    <AModal
      v-model:open="mfaModal"
      :title="
        mfaStep === 'disable'
          ? '禁用 MFA'
          : mfaStep === 'verify'
            ? '验证 MFA'
            : mfaStep === 'done'
              ? '备用码'
              : '绑定 MFA 设备'
      "
      :footer="null"
    >
      <div class="space-y-4">
        <ASpin v-if="mfaLoading" class="flex justify-center py-8" />

        <!-- 步骤1: 扫码 -->
        <template v-if="mfaStep === 'setup'">
          <div class="text-sm text-muted-foreground">
            请使用 Google Authenticator 或其他 TOTP 应用扫描下方二维码
          </div>
          <div class="flex justify-center">
            <img
              :src="mfaQrCode"
              alt="MFA QR Code"
              class="rounded-lg border bg-white p-2"
            />
          </div>
          <div class="break-all text-xs text-muted-foreground">
            手动密钥: {{ mfaSecret }}
          </div>
          <AInput
            v-model:value="mfaCode"
            :maxlength="6"
            placeholder="请输入应用中的6位验证码"
          />
          <AButton
            :block="true"
            type="primary"
            :loading="mfaLoading"
            @click="handleEnableMfa"
          >
            验证并启用
          </AButton>
        </template>

        <!-- 步骤2: 备用码 -->
        <template v-if="mfaStep === 'done'">
          <div class="text-sm font-medium text-destructive">
            请保存以下备用码，每个备用码只能使用一次
          </div>
          <div
            class="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/50 p-4 text-center font-mono"
          >
            <div
              v-for="code in mfaBackupCodes"
              :key="code"
              class="rounded-md border bg-background px-2 py-1.5 text-sm text-foreground"
            >
              {{ code }}
            </div>
          </div>
          <div class="flex gap-2">
            <AButton :block="true" @click="copyBackupCodes">复制备用码</AButton>
            <AButton :block="true" type="primary" @click="finishMfaSetup">
              完成
            </AButton>
          </div>
        </template>

        <!-- 禁用 MFA -->
        <template v-if="mfaStep === 'disable'">
          <div class="text-sm text-muted-foreground">
            请输入 MFA 验证码或备用码以禁用
          </div>
          <AInput v-model:value="mfaCode" placeholder="请输入验证码或备用码" />
          <AButton
            :block="true"
            type="primary"
            danger
            :loading="mfaLoading"
            @click="handleDisableMfa"
          >
            禁用 MFA
          </AButton>
        </template>
      </div>
    </AModal>
  </div>
</template>
