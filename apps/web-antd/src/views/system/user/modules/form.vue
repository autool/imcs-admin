<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

import type { SystemUserApi } from '#/api/system/user';

import { computed, nextTick, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Tree, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Alert, message, Spin } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { getMenuList } from '#/api/system/menu';
import { createUser, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

defineOptions({ name: 'SystemUserForm' });

const emits = defineEmits(['success']);
const { hasAccessByCodes } = useAccess();
const canAddUser = hasAccessByCodes(['system_user:add']);
const canEditUser = hasAccessByCodes(['system_user:edit']);

const formData = ref<SystemUserApi.SystemUser>();
const isLdapUser = computed(() => formData.value?.auth_type === 'ldap');

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const permissions = ref<DataNode[]>([]);
const loadingPermissions = ref(false);

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    if (id.value && !canEditUser) {
      message.warning('无权限编辑用户');
      return;
    }
    if (!id.value && !canAddUser) {
      message.warning('无权限创建用户');
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();

    // 转换表单数据，确保与后端API期望的字段匹配
    const submitData: any = {
      username: values.username,
      email: values.email,
      full_name: values.full_name,
      department_id: values.department_id,
      region_id: values.region_id,
      mobile_phone: values.tel, // 表单 tel -> 后端 mobile_phone
      is_locked: values.is_locked, // 直接使用is_locked字段
      roles: values.roles || [],
    };

    // 如果有密码字段，添加到提交数据中
    if (values.password) {
      submitData.password = values.password;
    }

    (id.value ? updateUser(id.value, submitData) : createUser(submitData))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch((error) => {
        drawerApi.unlock();
        console.error('保存用户失败:', error);
        message.error(resolveErrorMessage(error, '保存失败，请稍后重试'));
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<SystemUserApi.SystemUser>();

      // 先设置formData，用于判断是否是编辑模式
      if (data?.id) {
        formData.value = data;
        id.value = data.id;
      } else {
        formData.value = undefined;
        id.value = undefined;
      }

      if (permissions.value.length === 0) {
        await loadPermissions();
      }

      // 先重置表单
      formApi.resetForm();

      // Wait for Vue to flush DOM updates (form fields mounted)
      await nextTick();

      // 根据是否是编辑模式，动态设置密码字段的验证规则
      if (data?.id) {
        // 编辑模式：密码可选
        await formApi.updateSchema([
          {
            fieldName: 'password',
            componentProps: {
              disabled: data.auth_type === 'ldap',
              placeholder:
                data.auth_type === 'ldap'
                  ? 'LDAP用户密码由目录服务管理'
                  : '留空则不修改密码',
            },
            rules: z.string().optional(),
          },
        ]);

        // 等待schema更新完成
        await nextTick();

        // 加载数据
        await formApi.setValues({
          ...data,
          auth_type: data.auth_type || 'local',
          tel: data.mobile_phone, // 后端 mobile_phone -> 表单 tel
          password: '', // 编辑时密码默认为空
        });
      } else {
        // 创建模式：密码必填
        await formApi.updateSchema([
          {
            fieldName: 'password',
            componentProps: {
              disabled: false,
              placeholder: $t('authentication.password'),
            },
            rules: z
              .string()
              .min(1, { message: $t('authentication.passwordTip') }),
          },
        ]);

        await nextTick();
        await formApi.setValues({
          auth_type: 'local',
          is_locked: false,
          password: '',
          roles: [],
        });
      }
    }
  },
});

async function loadPermissions() {
  loadingPermissions.value = true;
  try {
    const res = await getMenuList();
    permissions.value = res as unknown as DataNode[];
  } finally {
    loadingPermissions.value = false;
  }
}

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('system.user.name'))
    : $t('common.create', $t('system.user.name'));
});

function resolveErrorMessage(error: any, fallback: string) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}

function getNodeClass(node: Recordable<any>) {
  const classes: string[] = [];
  if (node.value?.type === 'button') {
    classes.push('inline-flex');
    if (node.index % 3 >= 1) {
      classes.push('!pl-0');
    }
  }

  return classes.join(' ');
}
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Alert
      v-if="isLdapUser"
      class="mb-4"
      type="info"
      show-icon
      message="当前用户来自 LDAP"
      description="用户名、姓名、邮箱、手机号、所属部门和密码由 LDAP 同步管理；本地仅建议维护角色、所属区域和锁定状态。"
    />
    <Form>
      <template #permissions="slotProps">
        <Spin :spinning="loadingPermissions" wrapper-class-name="w-full">
          <Tree
            :tree-data="permissions"
            multiple
            bordered
            :default-expanded-level="2"
            :get-node-class="getNodeClass"
            v-bind="slotProps"
            value-field="id"
            label-field="meta.title"
            icon-field="meta.icon"
          >
            <template #node="{ value }">
              <IconifyIcon v-if="value.meta.icon" :icon="value.meta.icon" />
              {{ $t(value.meta.title) }}
            </template>
          </Tree>
        </Spin>
      </template>
    </Form>
  </Drawer>
</template>
<style lang="css" scoped>
:deep(.ant-tree-title) {
  .tree-actions {
    display: none;
    margin-left: 20px;
  }
}

:deep(.ant-tree-title:hover) {
  .tree-actions {
    display: flex;
    flex: auto;
    justify-content: flex-end;
    margin-left: 20px;
  }
}
</style>
