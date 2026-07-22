<script setup lang="ts">
import type { NotificationPreferences } from '#/api/system/user';

import { onMounted, ref } from 'vue';

import {
  Spin as ASpin,
  Switch as ASwitch,
  TimePicker as ATimePicker,
  message,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from '#/api/system/user';

const prefs = ref<NotificationPreferences | null>(null);
const saving = ref(false);

async function loadPreferences() {
  try {
    const data = await getNotificationPreferences();
    prefs.value = data;
  } catch {
    message.error('加载通知偏好设置失败');
  }
}

async function toggleBool(field: string, checked: unknown) {
  if (!prefs.value || saving.value) return;
  const value =
    checked === true ||
    checked === 1 ||
    checked === '1' ||
    checked === 'checked';
  saving.value = true;
  try {
    (prefs.value as any)[field] = value;
    await updateNotificationPreferences({ [field]: value });
  } catch {
    message.error('更新失败');
    loadPreferences();
  } finally {
    saving.value = false;
  }
}

async function updateTime(
  field: 'quiet_end' | 'quiet_start',
  value: dayjs.Dayjs | null | string,
) {
  if (!prefs.value || saving.value) return;
  const timeStr = dayjs.isDayjs(value) ? value.format('HH:mm') : value;
  if (!timeStr) return;
  saving.value = true;
  try {
    (prefs.value as any)[field] = timeStr;
    await updateNotificationPreferences({ [field]: timeStr });
  } catch {
    message.error('更新失败');
    loadPreferences();
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadPreferences();
});
</script>
<template>
  <div v-if="prefs" class="space-y-4">
    <!-- 站内信 -->
    <div class="rounded-lg border p-4">
      <h3 class="mb-3 text-base font-medium">站内信通知</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">系统消息</div>
            <div class="text-xs text-muted-foreground">
              系统消息将以站内信形式通知
            </div>
          </div>
          <ASwitch
            :checked="prefs.system_message"
            @change="toggleBool('system_message', $event)"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">告警通知</div>
            <div class="text-xs text-muted-foreground">
              告警消息将以站内信形式通知
            </div>
          </div>
          <ASwitch
            :checked="prefs.alert_notification"
            @change="toggleBool('alert_notification', $event)"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">任务通知</div>
            <div class="text-xs text-muted-foreground">
              任务状态变更将以站内信形式通知
            </div>
          </div>
          <ASwitch
            :checked="prefs.task_notification"
            @change="toggleBool('task_notification', $event)"
          />
        </div>
      </div>
    </div>

    <!-- 邮件通知 -->
    <div class="rounded-lg border p-4">
      <h3 class="mb-3 text-base font-medium">邮件通知</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">系统消息</div>
            <div class="text-xs text-muted-foreground">
              系统消息将通过邮件发送
            </div>
          </div>
          <ASwitch
            :checked="prefs.email_system"
            @change="toggleBool('email_system', $event)"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">告警通知</div>
            <div class="text-xs text-muted-foreground">
              告警消息将通过邮件发送
            </div>
          </div>
          <ASwitch
            :checked="prefs.email_alert"
            @change="toggleBool('email_alert', $event)"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">任务通知</div>
            <div class="text-xs text-muted-foreground">
              任务通知将通过邮件发送
            </div>
          </div>
          <ASwitch
            :checked="prefs.email_task"
            @change="toggleBool('email_task', $event)"
          />
        </div>
      </div>
    </div>

    <!-- 其他设置 -->
    <div class="rounded-lg border p-4">
      <h3 class="mb-3 text-base font-medium">其他设置</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">提示音</div>
            <div class="text-xs text-muted-foreground">
              收到新消息时播放提示音
            </div>
          </div>
          <ASwitch
            :checked="prefs.sound_enabled"
            @change="toggleBool('sound_enabled', $event)"
          />
        </div>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">桌面通知</div>
            <div class="text-xs text-muted-foreground">
              在浏览器中显示桌面通知
            </div>
          </div>
          <ASwitch
            :checked="prefs.desktop_enabled"
            @change="toggleBool('desktop_enabled', $event)"
          />
        </div>
      </div>
    </div>

    <!-- 免打扰模式 -->
    <div class="rounded-lg border p-4">
      <h3 class="mb-3 text-base font-medium">免打扰模式</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">开启免打扰</div>
            <div class="text-xs text-muted-foreground">
              指定时间段内不接收通知提醒
            </div>
          </div>
          <ASwitch
            :checked="prefs.quiet_mode"
            @change="toggleBool('quiet_mode', $event)"
          />
        </div>
        <div v-if="prefs.quiet_mode" class="flex items-center gap-4">
          <ATimePicker
            :value="dayjs(prefs.quiet_start, 'HH:mm')"
            format="HH:mm"
            placeholder="开始时间"
            @change="(val: any) => updateTime('quiet_start', val)"
          />
          <span class="text-muted-foreground">至</span>
          <ATimePicker
            :value="dayjs(prefs.quiet_end, 'HH:mm')"
            format="HH:mm"
            placeholder="结束时间"
            @change="(val: any) => updateTime('quiet_end', val)"
          />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="flex items-center justify-center py-12">
    <ASpin size="large" />
  </div>
</template>
