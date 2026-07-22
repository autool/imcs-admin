<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  KeyOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue';
import { Button as AButton, Input as AInput, message } from 'ant-design-vue';

import { getMyProfile, updateMyProfile } from '#/api/system/user';

const profileBaseSettingRef = ref();
const userStore = useUserStore();

const profile = ref<any>({});
const loading = ref(false);
const editMode = ref('');
const isLdapUser = computed(() => profile.value.auth_type === 'ldap');

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'full_name',
      component: 'Input',
      label: '姓名',
      componentProps: {
        placeholder: isLdapUser.value
          ? 'LDAP 用户姓名由目录统一维护'
          : '请输入姓名',
        disabled: isLdapUser.value,
      },
      rules: 'required',
    },
    {
      fieldName: 'username',
      component: 'Input',
      label: '用户名',
      componentProps: { disabled: true },
    },
  ];
});

onMounted(async () => {
  await loadProfile();
});

async function loadProfile() {
  loading.value = true;
  try {
    const data = await getMyProfile();
    profile.value = {
      ...data,
      department: data.department || '未分配',
      role_names: data.role_names || [],
      region_name: data.region_name || '全部区域',
      auth_type: data.auth_type || 'local',
      mfa_enabled: data.mfa_enabled || false,
    };
    userStore.setUserInfo({
      ...userStore.userInfo,
      auth_type: profile.value.auth_type,
    } as any);
    profileBaseSettingRef.value?.getFormApi().setValues(data);
  } catch {
    message.error('加载用户信息失败');
  } finally {
    loading.value = false;
  }
}

async function handleFieldEdit(field: string, value: any) {
  if (isLdapUser.value && ['email', 'mobile_phone'].includes(field)) {
    message.warning('LDAP 用户基础信息由目录统一管理，当前不可修改');
    editMode.value = '';
    await loadProfile();
    return;
  }
  try {
    await updateMyProfile({ [field]: value });
    profile.value[field] = value;
    message.success('修改成功');
    userStore.setUserInfo({
      ...userStore.userInfo,
      realName: value,
    } as any);
  } catch {
    message.error('修改失败');
  }
}

async function handleSubmit(values: Record<string, any>) {
  if (isLdapUser.value) {
    message.warning('LDAP 用户基础信息由目录统一管理，当前不可修改');
    await loadProfile();
    return;
  }
  try {
    await updateMyProfile({
      full_name: values.full_name,
      email: values.email,
      mobile_phone: values.mobile_phone,
    });
    message.success('个人信息更新成功');
    userStore.setUserInfo({
      ...userStore.userInfo,
      realName: values.full_name,
    } as any);
    await loadProfile();
  } catch {
    message.error('更新失败');
  }
}

const securityScore = computed(() => {
  let score = 0;
  if (profile.value.email) score += 33;
  if (profile.value.mobile_phone) score += 33;
  if (profile.value.mfa_enabled) score += 34;
  return score;
});

const scoreColor = computed(() => {
  if (securityScore.value >= 80) return '#34d399';
  if (securityScore.value >= 50) return '#fbbf24';
  return '#f87171';
});

const scoreText = computed(() => {
  if (securityScore.value >= 80) return '优秀';
  if (securityScore.value >= 50) return '一般';
  return '较弱';
});

const authTypeLabel = computed(() => {
  const map: Record<string, string> = {
    local: '本地认证',
    oauth2: 'OAuth2',
    ldap: 'LDAP',
  };
  return map[profile.value.auth_type] || '本地认证';
});

// 账号活动时间线
const activityTimeline = computed(() => {
  const items: any[] = [];
  if (profile.value.create_time) {
    items.push({
      time: profile.value.create_time,
      title: '账号创建',
      icon: CheckCircleOutlined,
      color: '#34d399',
      desc: `用户 ${profile.value.username} 注册成功`,
    });
  }
  if (profile.value.last_login) {
    items.push({
      time: profile.value.last_login,
      title: '最近登录',
      icon: ClockCircleOutlined,
      color: '#60a5fa',
      desc: '最近一次登录系统',
    });
  }
  if (profile.value.mobile_phone) {
    items.push({
      time: '已绑定',
      title: '手机绑定',
      icon: PhoneOutlined,
      color: '#a78bfa',
      desc: `手机 ${maskPhone(profile.value.mobile_phone)}`,
    });
  }
  if (profile.value.email) {
    items.push({
      time: '已绑定',
      title: '邮箱绑定',
      icon: MailOutlined,
      color: '#f97435',
      desc: profile.value.email,
    });
  }
  if (profile.value.mfa_enabled) {
    items.push({
      time: '已启用',
      title: 'MFA 设备',
      icon: SafetyCertificateOutlined,
      color: '#fbbf24',
      desc: '二次验证已开启',
    });
  }
  return items;
});

function maskPhone(phone: string) {
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
</script>
<template>
  <div class="space-y-6">
    <!-- 顶部：用户名片 + 安全度 -->
    <div class="grid gap-4 lg:grid-cols-3">
      <!-- 用户名片 -->
      <div
        class="rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-6 text-white shadow-lg lg:col-span-2"
      >
        <div class="flex items-center gap-5">
          <div
            class="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur-sm"
          >
            {{
              profile.full_name?.charAt(0) ||
              userStore.userInfo?.realName?.charAt(0) ||
              'U'
            }}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-bold">
                {{ profile.full_name || userStore.userInfo?.realName }}
              </h2>
              <span class="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">{{
                authTypeLabel
              }}</span>
            </div>
            <p class="mt-1 text-sm text-white/70">
              @{{ profile.username || userStore.userInfo?.username }}
            </p>
            <div class="mt-2 flex flex-wrap gap-1.5">
              <span
                v-for="role in profile.role_names"
                :key="role"
                class="rounded bg-white/15 px-2 py-0.5 text-xs"
              >
                {{ role }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 安全度 -->
      <div class="flex items-center gap-5 rounded-xl border bg-white/5 p-5">
        <div class="relative h-16 w-16">
          <svg class="h-full w-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              stroke-width="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              :stroke="scoreColor"
              stroke-width="3"
              :stroke-dasharray="`${securityScore}, 100`"
              stroke-linecap="round"
            />
          </svg>
          <div
            class="absolute inset-0 flex flex-col items-center justify-center"
          >
            <span class="text-lg font-bold" :style="{ color: scoreColor }">{{
              securityScore
            }}</span>
          </div>
        </div>
        <div>
          <div class="text-sm text-white/60">账号安全度</div>
          <div class="text-lg font-bold" :style="{ color: scoreColor }">
            {{ scoreText }}
          </div>
          <div class="mt-1 flex gap-1">
            <span
              class="h-1.5 w-5 rounded-full"
              :class="[profile.email ? 'bg-green-400' : 'bg-white/10']"
              title="邮箱"
            ></span>
            <span
              class="h-1.5 w-5 rounded-full"
              :class="[profile.mobile_phone ? 'bg-green-400' : 'bg-white/10']"
              title="手机"
            ></span>
            <span
              class="h-1.5 w-5 rounded-full"
              :class="[profile.mfa_enabled ? 'bg-green-400' : 'bg-white/10']"
              title="MFA"
            ></span>
          </div>
        </div>
      </div>
    </div>

    <!-- 信息卡片网格 -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- 部门 -->
      <div
        class="group rounded-lg border bg-white/5 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/5"
      >
        <div class="mb-3 flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400"
          >
            <TeamOutlined />
          </div>
          <span class="text-sm text-white/50">部门</span>
        </div>
        <div class="truncate text-base font-medium">
          {{ profile.department }}
        </div>
      </div>

      <!-- 区域 -->
      <div
        class="group rounded-lg border bg-white/5 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/5"
      >
        <div class="mb-3 flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10 text-green-400"
          >
            <GlobalOutlined />
          </div>
          <span class="text-sm text-white/50">所属区域</span>
        </div>
        <div class="truncate text-base font-medium">
          {{ profile.region_name }}
        </div>
      </div>

      <!-- 邮箱 -->
      <div
        class="group rounded-lg border bg-white/5 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/5"
      >
        <div class="mb-3 flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400"
          >
            <MailOutlined />
          </div>
          <span class="text-sm text-white/50">邮箱</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="flex-1 truncate text-base font-medium">
            {{ profile.email || '未设置' }}
          </span>
          <AButton
            v-if="!isLdapUser && editMode !== 'email'"
            type="text"
            size="small"
            class="!text-white/40 hover:!text-blue-400"
            @click="editMode = 'email'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              />
            </svg>
          </AButton>
          <AInput
            v-else
            v-model:value="profile.email"
            size="small"
            class="flex-1"
            @blur="
              handleFieldEdit('email', profile.email);
              editMode = '';
            "
          />
          <span v-if="isLdapUser" class="text-xs text-white/35">
            目录维护
          </span>
        </div>
      </div>

      <!-- 手机号 -->
      <div
        class="group rounded-lg border bg-white/5 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-500/5"
      >
        <div class="mb-3 flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400"
          >
            <PhoneOutlined />
          </div>
          <span class="text-sm text-white/50">手机号</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="flex-1 truncate text-base font-medium">
            {{ profile.mobile_phone || '未设置' }}
          </span>
          <AButton
            v-if="!isLdapUser && editMode !== 'mobile'"
            type="text"
            size="small"
            class="!text-white/40 hover:!text-blue-400"
            @click="editMode = 'mobile'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              />
              <path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
              />
            </svg>
          </AButton>
          <AInput
            v-else
            v-model:value="profile.mobile_phone"
            size="small"
            class="flex-1"
            @blur="
              handleFieldEdit('mobile_phone', profile.mobile_phone);
              editMode = '';
            "
          />
          <span v-if="isLdapUser" class="text-xs text-white/35">
            目录维护
          </span>
        </div>
      </div>
    </div>

    <!-- 底部：时间线 + 编辑表单 -->
    <div class="grid gap-4 lg:grid-cols-2">
      <!-- 活动时间线 -->
      <div class="rounded-xl border bg-white/5 p-6">
        <h3 class="mb-5 flex items-center gap-2 text-base font-medium">
          <ClockCircleOutlined class="text-blue-400" />
          账号动态
        </h3>
        <div v-if="activityTimeline.length > 0" class="space-y-0">
          <div
            v-for="(item, idx) in activityTimeline"
            :key="idx"
            class="flex gap-3"
          >
            <!-- 时间线左侧 -->
            <div class="flex flex-col items-center">
              <div
                class="flex h-8 w-8 items-center justify-center rounded-full"
                :style="{ backgroundColor: `${item.color}15` }"
              >
                <component
                  :is="item.icon"
                  class="text-sm"
                  :style="{ color: item.color }"
                />
              </div>
              <div
                v-if="idx < activityTimeline.length - 1"
                class="my-1 h-8 w-px bg-white/10"
              ></div>
            </div>
            <!-- 内容 -->
            <div class="flex-1 pb-6">
              <div class="flex items-center justify-between">
                <span class="font-medium">{{ item.title }}</span>
                <span class="text-xs text-white/40">{{ item.time }}</span>
              </div>
              <p class="mt-1 text-sm text-white/50">{{ item.desc }}</p>
            </div>
          </div>
        </div>
        <div v-else class="py-8 text-center text-white/40">
          <InfoCircleOutlined class="mr-2" />
          暂无动态记录
        </div>
      </div>

      <!-- 基本信息编辑 -->
      <div class="rounded-xl border bg-white/5 p-6">
        <h3 class="mb-5 flex items-center gap-2 text-base font-medium">
          <KeyOutlined class="text-blue-400" />
          基本信息编辑
        </h3>
        <ProfileBaseSetting
          ref="profileBaseSettingRef"
          :form-schema="formSchema"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>
