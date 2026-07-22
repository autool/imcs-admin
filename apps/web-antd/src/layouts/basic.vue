<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BookOpenText, CircleHelp } from '@vben/icons';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { Modal as AModal, Tooltip as ATooltip } from 'ant-design-vue';

import {
  getNotificationListApi,
  markAllReadApi,
  markNotificationReadApi,
} from '#/api/system/notifications';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([]);
const unreadCount = ref(0);
let pollingTimer: null | number = null;

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();

const timezoneOptions = ref<string[]>([]);
const notificationAccessCodes = [
  'notifications',
  'notifications_list',
  'notifications_list:view',
];
const canAccessNotifications = computed(() =>
  notificationAccessCodes.some((code) =>
    accessStore.accessCodes.includes(code),
  ),
);

// 获取通知列表
async function fetchNotifications() {
  if (!canAccessNotifications.value) {
    notifications.value = [];
    unreadCount.value = 0;
    return;
  }
  try {
    const response = await getNotificationListApi({
      limit: 20,
      skip: 0,
      unread_only: true,
    });
    const data = response.data || response;
    if (data && data.list) {
      unreadCount.value = data.unread_count ?? 0;
      notifications.value = data.list.map((item: any) => ({
        id: item.id,
        avatar: getNotificationAvatar(item.level),
        date: formatDate(item.created_at),
        isRead: item.is_read || false,
        message: item.content,
        title: item.title,
        data: { ...item.data, level: item.level },
        link:
          item.data?.link || item.data?.node_id ? '/system/nodes' : undefined,
        query: item.data?.node_id
          ? { highlight: item.data.node_id }
          : undefined,
      }));
    }
  } catch {
    // 静默失败，不影响主流程
  }
}

// 根据级别获取头像（使用 SVG data URI）
function getNotificationAvatar(level: string) {
  const avatars: Record<string, string> = {
    info: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzE4OTBmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPmk8L3RleHQ+PC9zdmc+',
    warning:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI2ZhYWQxNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPiE8L3RleHQ+PC9zdmc+',
    error:
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI2ZmNGQ0ZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPsOXPC90ZXh0Pjwvc3ZnPg==',
  };
  return avatars[level] || avatars.info;
}

// 格式化日期
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString();
}

// 启动轮询
function startPolling() {
  if (!canAccessNotifications.value) {
    return;
  }
  stopPolling();
  fetchNotifications();
  pollingTimer = window.setInterval(() => {
    fetchNotifications();
  }, 60_000); // 每60秒轮询一次
}

// 停止轮询
function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

onMounted(async () => {
  // 使用默认时区选项
  timezoneOptions.value = [
    'Asia/Shanghai',
    'America/New_York',
    'Europe/London',
  ];
});

onUnmounted(() => {
  stopPolling();
});

const appVersion = 'v1.0.0';
const versionModalVisible = ref(false);

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
  {
    handler: () => {
      router.push('/docs');
    },
    icon: BookOpenText,
    text: '操作手册',
  },
  {
    handler: () => {
      router.push({ name: 'work_platform_feedback' });
    },
    icon: CircleHelp,
    text: '反馈建议',
  },
  {
    handler: () => {
      versionModalVisible.value = true;
    },
    icon: 'lucide:info',
    text: '版本信息',
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

async function handleMakeAll() {
  // 调用接口标记所有通知为已读
  try {
    await markAllReadApi();
  } catch {
    // 接口失败时本地标记
  }
  const wasUnread = notifications.value.filter((item) => !item.isRead).length;
  notifications.value.forEach((item) => (item.isRead = true));
  unreadCount.value = Math.max(0, unreadCount.value - wasUnread);
}

// 查看所有消息
function handleViewAll() {
  if (!canAccessNotifications.value) {
    return;
  }
  router.push('/notifications/list');
}

// 点击通知项（标记已读）
async function handleNotificationClick(item: NotificationItem) {
  // 标记为已读
  if (item.id && !item.isRead) {
    try {
      await markNotificationReadApi(String(item.id));
      item.isRead = true;
      unreadCount.value = Math.max(0, unreadCount.value - 1);
    } catch {
      // 静默失败
    }
  }

  // 如果是节点超时通知，跳转到节点管理页面
  if (item.data?.node_id) {
    router.push({
      path: '/system/nodes',
      query: { highlight: item.data.node_id },
    });
  }
}
watch(
  canAccessNotifications,
  (enabled) => {
    if (enabled) {
      startPolling();
      return;
    }
    stopPolling();
    notifications.value = [];
    unreadCount.value = 0;
  },
  { immediate: true },
);
watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #header-right-45>
      <ATooltip v-if="userStore.userInfo?.region_id" placement="bottom">
        <div
          class="mr-2 flex cursor-pointer items-center rounded-md bg-primary/10 px-3 py-1.5 text-sm text-primary"
        >
          <span>区域：{{ userStore.userInfo.region_name || '未设置' }}</span>
        </div>
        <template #title>
          <span v-if="userStore.userInfo.region_id === 'all'">
            当前用户可以查看所有区域的数据
          </span>
          <span v-else>
            当前用户只能查看
            {{ userStore.userInfo.region_name || '当前' }} 区域的数据
          </span>
        </template>
      </ATooltip>
    </template>
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.email || ''"
        tag-text="Pro"
        @logout="handleLogout"
      />
    </template>
    <template #notification>
      <Notification
        v-if="canAccessNotifications"
        :badge="unreadCount"
        :notifications="notifications"
        @read="handleNotificationClick"
        @make-all="handleMakeAll"
        @view-all="handleViewAll"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
  <AModal
    v-model:open="versionModalVisible"
    :footer="null"
    :closable="true"
    width="560px"
    :mask-closable="true"
    class="version-modal"
  >
    <template #title>
      <div class="version-modal-title">
        <div class="logo-icon">
          <svg
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="40" height="40" rx="8" fill="url(#grad1)" />
            <path d="M12 20L18 14L24 20L18 26Z" fill="white" opacity="0.9" />
            <path d="M20 20L26 14L32 20L26 26Z" fill="white" opacity="0.6" />
            <defs>
              <linearGradient id="grad1" x1="0" y1="0" x2="40" y2="40">
                <stop offset="0%" stop-color="#6366f1" />
                <stop offset="100%" stop-color="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="title-text">
          <span class="title-main">IMCS</span>
          <span class="title-sub">基础设施管理系统</span>
        </div>
      </div>
    </template>

    <div class="version-content">
      <div class="version-badge">
        <span class="version-tag">{{ appVersion }}</span>
      </div>

      <div class="tech-stack">
        <div class="tech-item">
          <span class="tech-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
          </span>
          <div class="tech-info">
            <span class="tech-label">前端框架</span>
            <span class="tech-value">Vue 3 + Vben Admin</span>
          </div>
        </div>
        <div class="tech-item">
          <span class="tech-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </span>
          <div class="tech-info">
            <span class="tech-label">后端框架</span>
            <span class="tech-value">FastAPI + SQLAlchemy</span>
          </div>
        </div>
        <div class="tech-item">
          <span class="tech-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </span>
          <div class="tech-info">
            <span class="tech-label">数据库</span>
            <span class="tech-value">MySQL 8.0</span>
          </div>
        </div>
        <div class="tech-item">
          <span class="tech-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" />
              <circle cx="6" cy="6" r="1" fill="currentColor" />
              <circle cx="6" cy="18" r="1" fill="currentColor" />
            </svg>
          </span>
          <div class="tech-info">
            <span class="tech-label">任务队列</span>
            <span class="tech-value">Celery + Redis</span>
          </div>
        </div>
        <div class="tech-item">
          <span class="tech-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M9 9h6M9 13h6M9 17h4" />
            </svg>
          </span>
          <div class="tech-info">
            <span class="tech-label">系统架构</span>
            <span class="tech-value">前后端分离 + Agent 分布式</span>
          </div>
        </div>
        <div class="tech-item">
          <span class="tech-icon">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </span>
          <div class="tech-info">
            <span class="tech-label">设备协议</span>
            <span class="tech-value">IPMI / Redfish</span>
          </div>
        </div>
      </div>

      <div class="version-footer">
        <span class="copyright">
          &copy; {{ new Date().getFullYear() }} IMCS Team
        </span>
        <span class="build-date">All rights reserved</span>
      </div>
    </div>
  </AModal>
</template>

<style scoped>
/* 版本弹窗样式 */
.version-modal-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.logo-icon svg {
  width: 40px;
  height: 40px;
}

.title-text {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.title-main {
  font-size: 20px;
  font-weight: 700;
  color: hsl(var(--foreground));
}

.title-sub {
  font-size: 13px;
  color: hsl(var(--muted-foreground));
}

.version-content {
  padding: 4px 0;
}

.version-badge {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.version-tag {
  display: inline-block;
  padding: 4px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 20px;
}

.tech-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.tech-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  transition: all 0.2s ease;
}

.tech-item:hover {
  background: hsl(var(--accent));
  border-color: hsl(var(--primary));
  transform: translateX(2px);
}

.tech-icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
  border-radius: 8px;
}

.tech-icon svg {
  stroke: currentcolor;
}

.tech-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.tech-label {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.tech-value {
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.version-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid hsl(var(--border));
}

.copyright {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.build-date {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}
</style>
<style>
/* 版本弹窗全局样式（覆盖 Ant Design Modal） */
.version-modal .ant-modal-content {
  background: hsl(var(--card));
  border-radius: 12px;
}

.version-modal .ant-modal-header {
  padding: 16px 24px;
  margin-bottom: 0;
  background: transparent;
  border-bottom: 1px solid hsl(var(--border));
}

.version-modal .ant-modal-body {
  padding: 20px 24px;
  background: hsl(var(--card));
}

.version-modal .ant-modal-close {
  color: hsl(var(--muted-foreground));
}

.version-modal .ant-modal-title {
  color: hsl(var(--foreground));
}
</style>
