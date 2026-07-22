<script lang="ts" setup>
import type { ChangeEvent } from 'ant-design-vue/es/_util/EventInterface';

import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, h, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenDrawer } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $te } from '@vben/locales';
import { getPopupContainer } from '@vben/utils';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';
import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import {
  createMenu,
  getMenuList,
  isMenuNameExists,
  isMenuPathExists,
  SystemMenuApi,
  updateMenu,
} from '#/api/system/menu';
import { $t } from '#/locales';
import { componentKeys } from '#/router/routes';

import { getMenuTypeOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();
const { hasAccessByCodes } = useAccess();
const canAddMenu = hasAccessByCodes(['system_menu:add']);
const canEditMenu = hasAccessByCodes(['system_menu:edit']);
const formData = ref<SystemMenuApi.SystemMenu>();
const titleSuffix = ref<string>();

function normalizeMenuFormData(
  data?: Partial<SystemMenuApi.SystemMenu>,
): Partial<SystemMenuApi.SystemMenu> {
  if (!data) {
    return {};
  }
  const meta = data.meta ?? {};
  const normalized: Partial<SystemMenuApi.SystemMenu> = {
    ...data,
    activePath: data.activePath ?? meta.activePath,
    icon: data.icon ?? meta.icon,
    order: data.order ?? meta.order ?? 0,
    meta: {
      ...meta,
      activeIcon: meta.activeIcon ?? data.activeIcon,
      activePath: meta.activePath ?? data.activePath,
      affixTab: meta.affixTab ?? data.affixTab ?? false,
      affixTabOrder: meta.affixTabOrder ?? data.affixTabOrder,
      hideChildrenInMenu:
        meta.hideChildrenInMenu ?? data.hideChildrenInMenu ?? false,
      hideInBreadcrumb: meta.hideInBreadcrumb ?? data.hideInBreadcrumb ?? false,
      hideInMenu: meta.hideInMenu ?? data.hideInMenu ?? false,
      hideInTab: meta.hideInTab ?? data.hideInTab ?? false,
      icon: meta.icon ?? data.icon,
      keepAlive: meta.keepAlive ?? data.keepAlive ?? false,
      openInNewWindow: meta.openInNewWindow ?? data.openInNewWindow ?? false,
      order: meta.order ?? 0,
      title: meta.title ?? data.name,
    },
    openInNewWindow: data.openInNewWindow ?? meta.openInNewWindow ?? false,
    status: data.status ?? 1,
  };

  if (normalized.type === 'link') {
    normalized.linkSrc = data.linkSrc ?? data.link ?? meta.link;
  } else if (normalized.type === 'embedded') {
    normalized.linkSrc = data.linkSrc ?? data.iframeSrc ?? meta.iframeSrc;
  }

  return normalized;
}

function buildMenuPayload(
  data: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>,
): Omit<SystemMenuApi.SystemMenu, 'children' | 'id'> {
  const currentMeta = formData.value?.meta ?? {};
  const meta = { ...currentMeta, ...data.meta };
  const supportsRedirect = ['catalog', 'embedded', 'menu'].includes(data.type);
  const supportsAffixTab = ['embedded', 'menu'].includes(data.type);

  const payload: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'> = {
    ...data,
    activeIcon: meta.activeIcon,
    activePath: data.activePath ?? meta.activePath,
    affixTab: supportsAffixTab ? (meta.affixTab ?? false) : false,
    affixTabOrder:
      supportsAffixTab && meta.affixTab ? meta.affixTabOrder : undefined,
    badge: meta.badge,
    badgeType: meta.badgeType,
    badgeVariants: meta.badgeVariants,
    hideChildrenInMenu: meta.hideChildrenInMenu ?? false,
    hideInBreadcrumb: meta.hideInBreadcrumb ?? false,
    hideInMenu: meta.hideInMenu ?? false,
    hideInTab: meta.hideInTab ?? false,
    icon: meta.icon,
    keepAlive: meta.keepAlive ?? false,
    openInNewWindow: meta.openInNewWindow ?? data.openInNewWindow ?? false,
    order: data.order ?? meta.order ?? 0,
    redirect: supportsRedirect ? (data.redirect ?? meta.redirect) : undefined,
    title: meta.title ?? data.name,
  };

  if (data.type === 'link') {
    payload.link = data.linkSrc;
    payload.iframeSrc = undefined;
  } else if (data.type === 'embedded') {
    payload.iframeSrc = data.linkSrc;
    payload.link = undefined;
  } else {
    payload.link = undefined;
    payload.iframeSrc = undefined;
  }

  delete payload.linkSrc;
  delete payload.meta;

  return payload;
}

const schema: VbenFormSchema[] = [
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: getMenuTypeOptions(),
      optionType: 'button',
    },
    defaultValue: 'menu',
    fieldName: 'type',
    formItemClass: 'col-span-2 md:col-span-2',
    label: $t('system.menu.type'),
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('system.menu.menuName'),
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.menu.menuName'), 2]))
      .max(30, $t('ui.formRules.maxLength', [$t('system.menu.menuName'), 30]))
      .refine(
        async (value: string) => {
          return !(await isMenuNameExists(value, formData.value?.id));
        },
        (value) => ({
          message: $t('ui.formRules.alreadyExists', [
            $t('system.menu.menuName'),
            value,
          ]),
        }),
      ),
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      api: getMenuList,
      class: 'w-full',
      filterTreeNode(input: string, node: Recordable<any>) {
        if (!input || input.length === 0) {
          return true;
        }
        const title: string = node.meta?.title ?? '';
        if (!title) return false;
        return title.includes(input) || $t(title).includes(input);
      },
      getPopupContainer,
      labelField: 'meta.title',
      showSearch: true,
      treeDefaultExpandAll: true,
      valueField: 'id',
      childrenField: 'children',
    },
    dependencies: {
      rules: (values) => {
        return values.type === 'button' ? 'required' : null;
      },
      triggerFields: ['type'],
    },
    fieldName: 'pid',
    label: $t('system.menu.parent'),
    renderComponentContent() {
      return {
        title({ label, meta }: { label: string; meta: Recordable<any> }) {
          const coms = [];
          if (!label) return '';
          if (meta?.icon) {
            coms.push(h(IconifyIcon, { class: 'size-4', icon: meta.icon }));
          }
          coms.push(h('span', { class: '' }, $t(label || '')));
          return h('div', { class: 'flex items-center gap-1' }, coms);
        },
      };
    },
  },
  {
    component: 'Input',
    componentProps() {
      // 不需要处理多语言时就无需这么做
      return {
        addonAfter: titleSuffix.value,
        onChange({ target: { value } }: ChangeEvent) {
          titleSuffix.value = value && $te(value) ? $t(value) : undefined;
        },
      };
    },
    fieldName: 'meta.title',
    label: $t('system.menu.menuTitle'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: {
      class: 'w-full',
      min: 0,
      precision: 0,
    },
    defaultValue: 0,
    fieldName: 'order',
    label: $t('system.menu.sort'),
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return ['catalog', 'embedded', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'path',
    label: $t('system.menu.path'),
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.menu.path'), 2]))
      .max(100, $t('ui.formRules.maxLength', [$t('system.menu.path'), 100]))
      .refine(
        (value: string) => {
          return value.startsWith('/');
        },
        $t('ui.formRules.startWith', [$t('system.menu.path'), '/']),
      )
      .refine(
        async (value: string) => {
          return !(await isMenuPathExists(value, formData.value?.id));
        },
        (value) => ({
          message: $t('ui.formRules.alreadyExists', [
            $t('system.menu.path'),
            value,
          ]),
        }),
      ),
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return ['embedded', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'activePath',
    help: $t('system.menu.activePathHelp'),
    label: $t('system.menu.activePath'),
    rules: z
      .string()
      .min(2, $t('ui.formRules.minLength', [$t('system.menu.path'), 2]))
      .max(100, $t('ui.formRules.maxLength', [$t('system.menu.path'), 100]))
      .refine(
        (value: string) => {
          return value.startsWith('/');
        },
        $t('ui.formRules.startWith', [$t('system.menu.path'), '/']),
      )
      .refine(async (value: string) => {
        return await isMenuPathExists(value, formData.value?.id);
      }, $t('system.menu.activePathMustExist'))
      .optional(),
  },
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
    },
    dependencies: {
      show: (values) => {
        return ['catalog', 'embedded', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'redirect',
    help: $t('system.menu.redirectHelp'),
    label: $t('system.menu.redirect'),
    rules: z
      .union([
        z.literal(''),
        z
          .string()
          .min(2, $t('ui.formRules.minLength', [$t('system.menu.path'), 2]))
          .max(100, $t('ui.formRules.maxLength', [$t('system.menu.path'), 100]))
          .refine(
            (value: string) => value.startsWith('/'),
            $t('ui.formRules.startWith', [$t('system.menu.path'), '/']),
          ),
      ])
      .optional(),
  },
  {
    component: 'IconPicker',
    componentProps: {
      prefix: 'carbon',
    },
    dependencies: {
      show: (values) => {
        return ['catalog', 'embedded', 'link', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.icon',
    label: $t('system.menu.icon'),
  },
  {
    component: 'IconPicker',
    componentProps: {
      prefix: 'carbon',
    },
    dependencies: {
      show: (values) => {
        return ['catalog', 'embedded', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.activeIcon',
    label: $t('system.menu.activeIcon'),
  },
  {
    component: 'AutoComplete',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      filterOption(input: string, option: { value: string }) {
        return option.value.toLowerCase().includes(input.toLowerCase());
      },
      options: componentKeys.map((v) => ({ value: v })),
    },
    dependencies: {
      rules: (values) => {
        return values.type === 'menu' ? 'required' : null;
      },
      show: (values) => {
        return values.type === 'menu';
      },
      triggerFields: ['type'],
    },
    fieldName: 'component',
    label: $t('system.menu.component'),
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return ['embedded', 'link'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'linkSrc',
    label: $t('system.menu.linkSrc'),
    rules: z.string().url($t('ui.formRules.invalidURL')),
  },
  {
    component: 'Input',
    dependencies: {
      rules: (values) => {
        return values.type === 'button' ? 'required' : null;
      },
      show: (values) => {
        return ['button', 'catalog', 'embedded', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'authCode',
    label: $t('system.menu.authCode'),
  },
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: [
        { label: $t('common.enabled'), value: 1 },
        { label: $t('common.disabled'), value: 0 },
      ],
      optionType: 'button',
    },
    defaultValue: 1,
    fieldName: 'status',
    label: $t('system.menu.status'),
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      options: [
        { label: $t('system.menu.badgeType.dot'), value: 'dot' },
        { label: $t('system.menu.badgeType.normal'), value: 'normal' },
      ],
    },
    dependencies: {
      show: (values) => {
        return values.type !== 'button';
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.badgeType',
    label: $t('system.menu.badgeType.title'),
  },
  {
    component: 'Input',
    componentProps: (values) => {
      return {
        allowClear: true,
        class: 'w-full',
        disabled: values.meta?.badgeType !== 'normal',
      };
    },
    dependencies: {
      show: (values) => {
        return values.type !== 'button';
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.badge',
    label: $t('system.menu.badge'),
  },
  {
    component: 'Select',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      options: SystemMenuApi.BadgeVariants.map((v) => ({
        label: v,
        value: v,
      })),
    },
    dependencies: {
      show: (values) => {
        return values.type !== 'button';
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.badgeVariants',
    label: $t('system.menu.badgeVariants'),
  },
  {
    component: 'Divider',
    dependencies: {
      show: (values) => {
        return !['button', 'link'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'divider1',
    formItemClass: 'col-span-2 md:col-span-2 pb-0',
    hideLabel: true,
    renderComponentContent() {
      return {
        default: () => $t('system.menu.advancedSettings'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return ['menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.keepAlive',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.keepAlive'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return ['embedded', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.affixTab',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.affixTab'),
      };
    },
  },
  {
    component: 'InputNumber',
    componentProps: {
      class: 'w-full',
      min: 0,
      precision: 0,
    },
    dependencies: {
      show: (values) => {
        return (
          ['embedded', 'menu'].includes(values.type) && !!values.meta?.affixTab
        );
      },
      triggerFields: ['type', 'meta.affixTab'],
    },
    fieldName: 'meta.affixTabOrder',
    label: $t('system.menu.affixTabOrder'),
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return ['embedded', 'link', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'openInNewWindow',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.openInNewWindow'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !['button'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.hideInMenu',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.hideInMenu'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return ['catalog', 'menu'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.hideChildrenInMenu',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.hideChildrenInMenu'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !['button', 'link'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.hideInBreadcrumb',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.hideInBreadcrumb'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return !['button', 'link'].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'meta.hideInTab',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.hideInTab'),
      };
    },
  },
];

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});

const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
      const data = normalizeMenuFormData(
        drawerApi.getData<SystemMenuApi.SystemMenu>(),
      );
      if (Object.keys(data).length > 0) {
        formData.value = data as SystemMenuApi.SystemMenu;
        formApi.setValues(formData.value);
        titleSuffix.value = formData.value.meta?.title
          ? $t(formData.value.meta.title)
          : '';
      } else {
        formData.value = undefined;
        titleSuffix.value = '';
      }
    }
  },
});

async function onSubmit() {
  if (formData.value?.id && !canEditMenu) {
    message.warning('无权限编辑菜单');
    return;
  }
  if (!formData.value?.id && !canAddMenu) {
    message.warning('无权限创建菜单');
    return;
  }
  const { valid } = await formApi.validate();
  if (valid) {
    drawerApi.lock();
    const values =
      await formApi.getValues<
        Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>
      >();
    const data = buildMenuPayload(values);
    try {
      await (formData.value?.id
        ? updateMenu(formData.value.id, data)
        : createMenu(data));
      drawerApi.close();
      emit('success');
    } finally {
      drawerApi.unlock();
    }
  }
}
const getDrawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.menu.name')])
    : $t('ui.actionTitle.create', [$t('system.menu.name')]),
);
</script>
<template>
  <Drawer class="w-full max-w-[800px]" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
