<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

import type { SystemRoleApi } from '#/api/system/role';

import { computed, nextTick, onBeforeUnmount, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Tree, useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { message, Spin } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createRole, updateRole } from '#/api/system/role';
import { $t } from '#/locales';

import { useFormSchema } from '../data';
import { loadRolePermissionTree } from './permission-tree';

defineOptions({ name: 'SystemRoleForm' });

const emits = defineEmits(['success']);
const { hasAccessByCodes } = useAccess();
const canAddRole = hasAccessByCodes(['system_role:add']);
const canEditRole = hasAccessByCodes(['system_role:edit']);

const formData = ref<SystemRoleApi.SystemRole>({
  id: '',
  menus: [],
  name: '',
  permissions: [],
  status: 1,
});

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const permissions = ref<DataNode[]>([]);
const loadingPermissions = ref(false);
const permissionTreeReady = ref(false);
let permissionTreeTimer: ReturnType<typeof setTimeout> | undefined;

const id = ref();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    if (id.value && !canEditRole) {
      message.warning('无权限编辑角色');
      return;
    }
    if (!id.value && !canAddRole) {
      message.warning('无权限创建角色');
      return;
    }
    const { valid } = await formApi.validate();
    if (!valid) return;
    const rawValues = await formApi.getValues();
    const rolePermissions = Array.isArray(formData.value.permissions)
      ? formData.value.permissions
      : [];
    const values = {
      ...rawValues,
      permissions: rolePermissions,
      menus: rawValues.menus || rolePermissions,
    } as Omit<SystemRoleApi.SystemRole, 'id'>;
    drawerApi.lock();
    (id.value ? updateRole(id.value, values) : createRole(values))
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch((error) => {
        drawerApi.unlock();
        console.error('保存角色失败:', error);
        message.error('保存失败，请稍后重试');
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<SystemRoleApi.SystemRole>();
      await formApi.resetForm();

      if (data) {
        const rolePermissions = data.permissions || data.menus || [];
        formData.value = {
          ...data,
          permissions: Array.isArray(rolePermissions)
            ? [...rolePermissions]
            : [],
        };
        id.value = data.id;
      } else {
        id.value = undefined;
        // 新建角色时，初始化permissions为空数组
        formData.value = {
          id: '',
          menus: [],
          name: '',
          permissions: [],
          status: 1,
        };
      }

      // 先回填基础字段，权限树的网络请求和渲染不再阻塞抽屉打开。
      await nextTick();
      if (data) {
        const { menus: _menus, permissions: _permissions, ...basicData } = data;
        formApi.setValues(basicData);
      }
      if (!permissionTreeReady.value && !permissionTreeTimer) {
        permissionTreeTimer = setTimeout(() => {
          permissionTreeReady.value = true;
          permissionTreeTimer = undefined;
          if (permissions.value.length === 0) {
            void loadPermissions();
          }
        }, 200);
      }
    } else if (permissionTreeTimer) {
      clearTimeout(permissionTreeTimer);
      permissionTreeTimer = undefined;
      permissionTreeReady.value = false;
    } else {
      permissionTreeReady.value = false;
    }
  },
});

onBeforeUnmount(() => {
  if (permissionTreeTimer) {
    clearTimeout(permissionTreeTimer);
  }
});

async function loadPermissions() {
  loadingPermissions.value = true;
  try {
    permissions.value = await loadRolePermissionTree();
  } catch (error) {
    console.error('加载角色权限树失败:', error);
    message.error('权限数据加载失败，请稍后重试');
  } finally {
    loadingPermissions.value = false;
  }
}

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', $t('system.role.name'))
    : $t('common.create', $t('system.role.name'));
});

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
    <Form />
    <section class="permission-section">
      <div class="permission-section__label">
        {{ $t('system.role.setPermissions') }}
      </div>
      <div v-if="!permissionTreeReady" class="permission-tree-placeholder">
        <Spin size="small" />
        <span>正在加载权限数据...</span>
      </div>
      <Spin v-else :spinning="loadingPermissions" wrapper-class-name="w-full">
        <Tree
          :tree-data="permissions"
          multiple
          bordered
          :default-expanded-level="1"
          :get-node-class="getNodeClass"
          v-model="formData.permissions"
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
    </section>
  </Drawer>
</template>
<style lang="css" scoped>
.permission-section {
  display: grid;
  grid-template-columns: 7em minmax(0, 1fr);
  gap: 8px 16px;
  align-items: start;
  margin-top: 16px;
}

.permission-section__label {
  padding-top: 8px;
  font-size: 14px;
  color: hsl(var(--foreground));
  text-align: right;
}

.permission-tree-placeholder {
  display: flex;
  gap: 8px;
  align-items: center;
  min-height: 120px;
  padding: 16px;
  color: hsl(var(--muted-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}

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
