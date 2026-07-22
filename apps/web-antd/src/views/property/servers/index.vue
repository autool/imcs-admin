<script lang="ts" setup>
import type { RowType } from '@vben/types';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeGridProps } from '#/adapter/vxe-table';
import type {
  ServerBrandCatalogItem,
  ServerDiscoveredDevice,
  ServerPageFetchParams,
} from '#/api';

import { h, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import {
  Badge,
  Button,
  Drawer,
  Input,
  message,
  Modal,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchImportServersApi,
  deleteServerApi,
  getBrandCatalogApi,
  getDiscoveredServersApi,
  getServersListApi,
  ignoreDiscoveredServerApi,
} from '#/api';
import { useServerStore } from '#/store';

import ImportHistory from './import-history.vue';
import serverAdd from './server-add.vue';
import serverEdit from './server-edit.vue';
import FormDrawerDemo from './view.vue';

const serverStore = useServerStore();
const router = useRouter();

type ServerRow = RowType & {
  brand_icon?: string;
  color?: string;
  ip_address?: string;
  status?: string;
};

// 状态筛选
const filterStatus = ref<string | undefined>(undefined);
const discoveredDrawerOpen = ref(false);
const discoveredSearch = ref('');
const discoveredTotal = ref(0);
const importServerModalOpen = ref(false);

// 定义响应式变量存储选项数据
const brandOptions = ref<Array<{ label: string; value: any }>>([]);
const brandCatalog = ref<ServerBrandCatalogItem[]>([]);
const modelOptions = ref<{ label: string; value: any }[]>([]);
const selectedModelBrandId = ref<string>();
const modelOptionsCache = new Map<string, { label: string; value: any }[]>();
const modelOptionsRequests = new Map<
  string,
  Promise<{ label: string; value: any }[]>
>();

// 获取品牌选项
async function fetchBrandOptions() {
  try {
    const response = await serverStore.getBrandOptions();
    brandOptions.value = response;
    const catalogResponse = await getBrandCatalogApi();
    brandCatalog.value = catalogResponse?.items || [];
  } catch (error) {
    console.error('Error fetching brand options:', error);
  }
}

// 获取型号选项
async function fetchModelOptions(brandId: string) {
  if (!brandId) {
    modelOptions.value = [];
    return;
  }
  if (modelOptionsCache.has(brandId)) {
    modelOptions.value = modelOptionsCache.get(brandId) || [];
    return;
  }
  try {
    let request = modelOptionsRequests.get(brandId);
    if (!request) {
      request = serverStore.getModelOptions({ brand_id: brandId });
      modelOptionsRequests.set(brandId, request);
    }
    const response = await request;
    modelOptionsCache.set(brandId, response || []);
    modelOptions.value = response;
  } catch (error) {
    console.error('Error fetching model options:', error);
    modelOptions.value = [];
  } finally {
    modelOptionsRequests.delete(brandId);
  }
}

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: FormDrawerDemo,
});

const [ServerAddDrawer, serverAddDrawerApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: serverAdd,
});

const [ServerEditDrawer, serverEditDrawerApi] = useVbenModal({
  fullscreenButton: false,
  connectedComponent: serverEdit,
});

// 在组件挂载时获取品牌选项
onMounted(() => {
  fetchBrandOptions();
  fetchDiscoveredCount();
});

async function fetchDiscoveredCount() {
  try {
    const response = await getDiscoveredServersApi({
      page: 1,
      pageSize: 1,
      status: 'pending',
    });
    discoveredTotal.value = response?.total || 0;
  } catch (error) {
    console.error('Fetch discovered server count error:', error);
  }
}

async function openDiscoveredDrawer() {
  discoveredDrawerOpen.value = true;
  await nextTick();
  discoveredGridApi.query();
}

function handleDiscoveredSearch() {
  discoveredGridApi.query();
}

function openImportServerModal() {
  importServerModalOpen.value = true;
}

const formOptions: VbenFormProps = {
  collapsed: true,
  wrapperClass: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'ip_address',
      label: 'IP地址',
    },
    {
      component: 'Select',
      componentProps: (_, formApi) => ({
        allowClear: true,
        filterOption: true,
        options: brandOptions.value,
        placeholder: '请选择品牌',
        showSearch: true,
        onChange: async (value?: string) => {
          const brandId = value || undefined;
          if (selectedModelBrandId.value === brandId) {
            return;
          }
          selectedModelBrandId.value = brandId;
          formApi.setFieldValue('models_id', undefined);
          modelOptions.value = [];
          if (brandId) {
            await fetchModelOptions(brandId);
          }
        },
      }),
      fieldName: 'brand_id',
      label: '品牌',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        filterOption: true,
        options: modelOptions,
        placeholder: '请选择型号',
        showSearch: true,
      },
      dependencies: {
        triggerFields: ['brand_id'],
        disabled: (values) => !values.brand_id,
      },
      fieldName: 'models_id',
      label: '型号',
    },
    {
      component: 'Input',
      fieldName: 'serial_number',
      label: '序列号',
    },
    {
      component: 'Input',
      fieldName: 'tag_number',
      label: '资产号',
    },
  ],
  showCollapseButton: false,
  submitOnChange: true,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<ServerRow> = {
  stripe: true,
  checkboxConfig: {
    highlight: true,
    labelField: 'name',
  },
  columns: [
    { title: '序号', type: 'seq', width: 50, fixed: 'left' },
    { field: 'ip_address', title: 'IP地址', width: 120 },
    {
      field: 'brand_name',
      slots: { default: 'brand_name' },
      title: '品牌',
      align: 'center',
      width: 60,
    },
    { field: 'model_name', title: '型号', width: 150 },
    { field: 'serial_number', title: '序列号', width: 150 },
    { field: 'tag_number', title: '资产号', width: 150 },
    { field: 'asset_location', title: '资产位置', width: 230 },
    {
      field: 'open',
      slots: { default: 'open' },
      title: '电源',
      width: 100,
    },
    {
      field: 'status',
      slots: { default: 'status' },
      title: '状态',
      width: 120,
      align: 'center',
      filters: [
        { label: '全部', value: 'all' },
        { label: '在线', value: 'online' },
        { label: '认证失败', value: 'auth_failed' },
        { label: '不受支持', value: 'not_supported' },
        { label: '离线', value: 'offline' },
      ],
      filterMultiple: false,
      filterMethod: () => true,
    },
    { field: 'bios_version', title: 'Bios版本', width: 150 },
    { field: 'ibmc_version', title: 'IBMC版本', width: 150 },
    { field: 'cpld_version', title: 'CPLD版本', width: 150 },

    {
      field: 'addDate',
      formatter: 'formatDateTime',
      sortable: true,
      title: '添加日期',
      width: 200,
    },
    { field: 'info', title: '备注', width: 150 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 200,
    },
  ],
  editConfig: {
    mode: 'row',
    trigger: 'click',
  },
  exportConfig: {},
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    pageSize: 20, // 默认每页显示数量
    pageSizes: [10, 20, 50, 100], // 可选择的每页数量
  },
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }, formValues) => {
        const params: ServerPageFetchParams = {
          page: page.currentPage,
          pageSize: page.pageSize,
          _t: Date.now(),
          ...formValues,
        };
        if (sort?.field === 'addDate' && sort?.order) {
          params.sort_field = sort.field;
          params.sort_order = sort.order;
        }
        if (filterStatus.value && filterStatus.value !== 'all') {
          params.status_filter = filterStatus.value;
        }
        return await getServersListApi(params);
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
  sortConfig: {
    defaultSort: { field: 'addDate', order: 'desc' },
    multiple: false,
    remote: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions,
  formOptions,
  gridEvents: {
    filterChange: (data: any) => {
      const { values } = data;
      const activeValue = values?.[0];
      filterStatus.value =
        !activeValue || activeValue === 'all' ? undefined : activeValue;
      gridApi.query();
    },
  },
});

const discoveredGridOptions: VxeGridProps<ServerDiscoveredDevice> = {
  stripe: true,
  columns: [
    { title: '序号', type: 'seq', width: 60, fixed: 'left' },
    { field: 'ip_address', title: 'IP地址', width: 140 },
    { field: 'vendor', title: '厂商', width: 120 },
    { field: 'model', title: '型号', width: 180, showOverflow: 'tooltip' },
    { field: 'serial_number', title: '序列号', width: 180 },
    { field: 'guuid', title: 'GUUID', width: 260, showOverflow: 'tooltip' },
    { field: 'detected_by', title: '发现方式', width: 100 },
    { field: 'discovered_count', title: '发现次数', width: 90 },
    {
      field: 'last_seen_at',
      formatter: 'formatDateTime',
      title: '最后发现',
      width: 170,
    },
    {
      field: 'status',
      slots: { default: 'discoveredStatus' },
      title: '状态',
      width: 90,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'discoveredAction' },
      title: '操作',
      width: 150,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    pageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        const response = await getDiscoveredServersApi({
          page: page.currentPage,
          pageSize: page.pageSize,
          search: discoveredSearch.value || undefined,
          status: 'pending',
        });
        discoveredTotal.value = response?.total || 0;
        return response;
      },
    },
    response: {
      result: 'items',
      total: 'total',
      list: 'items',
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [DiscoveredGrid, discoveredGridApi] = useVbenVxeGrid({
  gridOptions: discoveredGridOptions,
});

function openFormDrawer(id: string) {
  formDrawerApi.setData({
    values: { server_id: id },
  });
  formDrawerApi.open();
}
function openServerAddDrawer(values?: Record<string, any>) {
  if (values) {
    serverAddDrawerApi.setData({ values });
  } else {
    serverAddDrawerApi.setData({ values: {} });
  }
  serverAddDrawerApi.open();
}

function normalizeOptionText(value?: null | string) {
  return [...String(value || '').toLowerCase()]
    .filter((char) => /[a-z0-9\u4E00-\u9FA5]/.test(char))
    .join('');
}

function matchOptionByText<
  T extends { aliases?: string[]; label: string; value: any },
>(options: T[], text?: null | string) {
  const normalizedText = normalizeOptionText(text);
  if (!normalizedText) {
    return undefined;
  }
  return options.find((option) => {
    const candidates = [option.label, ...(option.aliases || [])];
    return candidates.some((candidate) => {
      const normalizedLabel = normalizeOptionText(candidate);
      return (
        normalizedLabel === normalizedText ||
        normalizedLabel.includes(normalizedText) ||
        normalizedText.includes(normalizedLabel)
      );
    });
  });
}

async function buildDiscoveredServerValues(row: ServerDiscoveredDevice) {
  const values: Record<string, any> = {
    credential_id: row.credential_id || undefined,
    ip: row.ip_address,
    isAddRun: true,
    tag: '',
  };

  if (brandCatalog.value.length === 0) {
    const catalogResponse = await getBrandCatalogApi();
    brandCatalog.value = catalogResponse?.items || [];
  }

  if (row.brand_id) {
    values.brand = row.brand_id;
    if (row.models_id) {
      values.model = row.models_id;
    }
    return values;
  }

  const brandOption = matchOptionByText(brandCatalog.value, row.vendor);
  if (!brandOption) {
    return values;
  }

  values.brand = brandOption.value;

  if (row.model) {
    const modelOption = matchOptionByText(brandOption.models || [], row.model);
    if (modelOption) {
      values.model = modelOption.value;
    }
  }

  return values;
}

async function handleManageDiscovered(row: ServerDiscoveredDevice) {
  try {
    const values = await buildDiscoveredServerValues(row);
    discoveredDrawerOpen.value = false;
    await nextTick();
    openServerAddDrawer(values);
  } catch (error) {
    console.error('Build discovered server values error:', error);
    message.error('打开纳管表单失败');
  }
}

async function handleIgnoreDiscovered(row: ServerDiscoveredDevice) {
  Modal.confirm({
    title: '忽略发现设备',
    content: `确定忽略 ${row.ip_address} 吗？忽略后不会继续出现在待纳管列表。`,
    okText: '忽略',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        await ignoreDiscoveredServerApi(row.id, '前端手动忽略');
        message.success('已忽略');
        discoveredGridApi.query();
      } catch (error) {
        console.error('Ignore discovered server error:', error);
        message.error('忽略失败');
      }
    },
  });
}

function openServerEditDrawer(id: string) {
  serverEditDrawerApi.setData({
    serverId: id,
  });
  serverEditDrawerApi.open();
}

function handleEditSuccess() {
  gridApi.query();
}

function handleAddSuccess(payload?: { collectSubmitted?: boolean }) {
  gridApi.query();
  fetchDiscoveredCount();
  if (payload?.collectSubmitted) {
    window.setTimeout(() => {
      gridApi.query();
      fetchDiscoveredCount();
    }, 3000);
    window.setTimeout(() => {
      gridApi.query();
      fetchDiscoveredCount();
    }, 8000);
  }
}

async function handleDeleteServer(id: string, ip: string) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除服务器 ${ip} 吗？此操作不可恢复。`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    async onOk() {
      try {
        const response = await deleteServerApi(id);
        if (response.code === 0) {
          message.success('删除成功');
          gridApi.query();
        } else {
          message.error(response.message || '删除失败');
        }
      } catch (error) {
        console.error('Delete error:', error);
        message.error('删除失败');
      }
    },
  });
}

function openStatus(row: ServerRow) {
  router.push({
    path: '/property/device-status',
    query: { ip: row.ip_address || undefined },
  });
}

function downloadTemplate() {
  const templateColumns = [
    { field: 'ip', title: 'IPMI 地址' },
    { field: 'username', title: '用户名' },
    { field: 'password', title: '密码' },
    { field: 'brand', title: '品牌' },
    { field: 'model', title: '型号' },
    { field: 'tag', title: '资产号' },
    { field: 'area', title: '区域' },
    { field: 'region', title: '机房' },
    { field: 'cabinet', title: '机柜' },
    { field: 'uPosition', title: 'U位' },
    { field: 'serialNumber', title: '序列号' },
    { field: 'owner', title: '负责人' },
  ];

  const headerRow = templateColumns.map((col) => col.title).join(',');

  // 添加说明行（以#开头的注释）
  const commentRows = [
    '# 服务器导入模板说明：',
    '# 1. IPMI 地址：服务器的 BMC/iDRAC/iBMC 管理地址（必填）',
    '# 2. 用户名：BMC 登录用户名（必填）',
    '# 3. 密码：BMC 登录密码（必填）',
    '# 4. 品牌：服务器品牌，小写（必填，如：huawei/dell/xfusion）',
    '# 5. 型号：服务器型号（选填，如：2288H V5、PowerEdge R740）',
    '# 6. 资产号：服务器资产编号（选填）',
    '# 7. 区域：服务器所在区域（选填，如：北京、上海、深圳）',
    '# 8. 机房：服务器所在机房（选填）',
    '# 9. 机柜：机柜编号（选填，如：C01、D05）',
    '# 10. U位：机柜内U位位置（选填，如：U10、U15）',
    '# 11. 序列号：服务器序列号（选填，导入后会自动采集）',
    '# 12. 负责人：服务器负责人姓名（选填）',
    '# 注意事项：',
    '# - 请删除所有注释行（#开头）后再导入',
    '# - 每行一台服务器，字段之间用英文逗号分隔',
    '# - 必填字段不能为空',
    '# - 品牌名称必须小写且与系统中的品牌匹配',
    '# - 型号需要与系统中的型号匹配，或留空由系统自动识别',
    '',
  ];

  const csvContent = `${commentRows.join('\n')}\n${headerRow}\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '服务器导入模板.csv';
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function handleImportClick() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';
  input.addEventListener('change', (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  });
  input.click();
}

async function handleFileImport(file: File) {
  try {
    // 先尝试读取文件的原始字节
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // 尝试多种编码
    let text = '';
    let decodedSuccessfully = false;

    // 尝试 UTF-8
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      text = decoder.decode(uint8Array);
      decodedSuccessfully = true;
    } catch {
      // UTF-8 失败，尝试 GBK
    }

    // 如果 UTF-8 失败，尝试 GBK (中文 Windows 默认编码)
    if (!decodedSuccessfully) {
      try {
        const decoder = new TextDecoder('gbk');
        text = decoder.decode(uint8Array);
        decodedSuccessfully = true;
      } catch {
        // GBK 也失败
      }
    }

    // 如果都失败，使用默认编码
    if (!decodedSuccessfully) {
      const decoder = new TextDecoder();
      text = decoder.decode(uint8Array);
    }

    // 使用正确的CSV解析方法（支持引号、逗号和换行符）
    const parseCSV = (text: string): string[][] => {
      const result: string[][] = [];
      let currentRow: string[] = [];
      let currentField = '';
      let inQuotes = false;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // 转义的双引号
            currentField += '"';
            i++;
          } else {
            // 切换引号状态
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          // 字段分隔符（不在引号内）
          currentRow.push(currentField.trim());
          currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
          // 行结束符（不在引号内）
          if (currentField || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some(Boolean)) {
              result.push(currentRow);
            }
            currentRow = [];
            currentField = '';
          }
          // 跳过 \r\n 中的 \n
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          currentField += char;
        }
      }

      // 添加最后一个字段和行
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(Boolean)) {
          result.push(currentRow);
        }
      }

      return result;
    };

    // 解析CSV
    const allRows = parseCSV(text);

    // 过滤掉注释行
    const validRows = allRows.filter((row) => {
      const firstField = row[0] || '';
      return firstField && !firstField.startsWith('#');
    });

    if (validRows.length < 2) {
      message.error('文件内容为空或格式不正确');
      return;
    }

    // 跳过表头，解析数据行
    const dataRows = validRows.slice(1);
    const serversData = dataRows
      .map((values: string[]) => {
        return {
          ip: values[0] || '',
          username: values[1] || '',
          password: values[2] || '',
          brand: values[3] || '',
          model: values[4] || '',
          tag: values[5] || '',
          area: values[6] || '',
          region: values[7] || '',
          cabinet: values[8] || '',
          uPosition: values[9] || '',
          serialNumber: values[10] || '',
          owner: values[11] || '',
        };
      })
      .filter((item: any) => item.ip); // 过滤掉没有IP的行

    if (serversData.length === 0) {
      message.error('没有有效的服务器数据');
      return;
    }

    // 调用批量导入API
    message.loading({
      content: '正在导入服务器...',
      key: 'import',
      duration: 0,
    });

    const result = await batchImportServersApi(serversData);
    message.destroy('import');

    if (result) {
      const { success_count, failed_count, failed_items } = result;

      if (failed_count === 0) {
        message.success(`成功导入 ${success_count} 台服务器`);
      } else {
        // 显示详细的失败信息
        const failedList = failed_items
          .map((item: any) => `• 行${item.row} (${item.ip}): ${item.reason}`)
          .join('\n');

        Modal.error({
          title: '批量导入完成',
          content: h(
            'div',
            {
              style:
                'white-space: pre-wrap; max-height: 400px; overflow-y: auto;',
            },
            [
              h(
                'div',
                { style: 'margin-bottom: 16px; font-weight: bold;' },
                `成功: ${success_count} 台 | 失败: ${failed_count} 台`,
              ),
              h('div', { style: 'color: #ff4d4f;' }, '失败详情：'),
              h(
                'pre',
                {
                  style:
                    'margin-top: 8px; font-size: 12px; padding: 12px; border-radius: 4px;',
                },
                failedList,
              ),
              h('div', { style: 'margin-top: 16px; text-align: center;' }, [
                h(
                  Button,
                  {
                    type: 'primary',
                    onClick: () => {
                      openImportServerModal();
                      Modal.destroyAll();
                    },
                  },
                  '查看导入历史',
                ),
              ]),
            ],
          ),
          width: 700,
          okText: '确定',
        });
      }

      // 刷新列表
      gridApi.query();
    }
  } catch (error: any) {
    message.destroy('import');
    message.error(error?.message || '导入失败，请检查文件编码和数据格式');
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid class="server-assets-grid">
      <template #toolbar-tools>
        <Space wrap>
          <Button
            v-access:code="['property_servers:add']"
            type="primary"
            @click="openServerAddDrawer()"
          >
            添加服务器
          </Button>
          <Button
            v-access:code="['property_servers:add']"
            type="primary"
            @click="openImportServerModal"
          >
            导入服务器
          </Button>
          <Badge
            :count="discoveredTotal"
            :offset="[-2, 2]"
            :overflow-count="99"
            :show-zero="false"
          >
            <Button @click="openDiscoveredDrawer">发现设备</Button>
          </Badge>
        </Space>
      </template>

      <template #brand_name="{ row }">
        <div class="brand-logo-frame">
          <img
            :alt="row.brand_name"
            class="brand-logo-image"
            :src="row.brand_icon || '/assets/brand/default.png'"
          />
        </div>
      </template>
      <template #open="{ row }">
        <Tag :color="row.open ? 'success' : 'default'">
          {{ row.open ? '上电' : '下电' }}
        </Tag>
      </template>
      <template #status="{ row }">
        <Tag :color="row.color" class="cursor-pointer" @click="openStatus(row)">
          {{ row.status }}
        </Tag>
      </template>
      <template #action="{ row }">
        <Button
          v-access:code="['property_servers:edit']"
          type="link"
          @click="openServerEditDrawer(row.id)"
        >
          编辑
        </Button>
        <Button
          v-access:code="['property_servers:view']"
          type="link"
          @click="openFormDrawer(row.id)"
        >
          查看
        </Button>
        <Button
          v-access:code="['property_servers:delete']"
          danger
          type="link"
          @click="handleDeleteServer(row.id, row.ip_address)"
        >
          删除
        </Button>
      </template>
    </Grid>
    <FormDrawer />
    <ServerAddDrawer @success="handleAddSuccess" />
    <ServerEditDrawer @success="handleEditSuccess" />
    <Modal
      v-model:open="importServerModalOpen"
      destroy-on-close
      :footer="null"
      title="导入服务器"
      width="1120px"
    >
      <div class="server-import-modal">
        <div class="server-import-actions">
          <Space wrap>
            <Button @click="downloadTemplate">下载模板</Button>
            <Button
              v-access:code="['property_servers:add']"
              type="primary"
              @click="handleImportClick"
            >
              选择 CSV 导入
            </Button>
          </Space>
        </div>
        <ImportHistory embedded />
      </div>
    </Modal>
    <Drawer
      v-model:open="discoveredDrawerOpen"
      destroy-on-close
      placement="right"
      title="发现设备"
      width="980"
    >
      <div class="mb-4 flex items-center justify-between gap-3">
        <Space>
          <Input
            v-model:value="discoveredSearch"
            allow-clear
            placeholder="搜索 IP / GUUID / 序列号 / 厂商 / 型号"
            style="width: 320px"
            @press-enter="handleDiscoveredSearch"
          />
          <Button type="primary" @click="handleDiscoveredSearch"> 搜索 </Button>
          <Button @click="discoveredGridApi.query()">刷新</Button>
        </Space>
        <Tag color="processing">待纳管 {{ discoveredTotal }}</Tag>
      </div>
      <DiscoveredGrid>
        <template #discoveredStatus>
          <Tag color="warning">待纳管</Tag>
        </template>
        <template #discoveredAction="{ row }">
          <Button size="small" type="link" @click="handleManageDiscovered(row)">
            纳管
          </Button>
          <Button
            danger
            size="small"
            type="link"
            @click="handleIgnoreDiscovered(row)"
          >
            忽略
          </Button>
        </template>
      </DiscoveredGrid>
    </Drawer>
  </Page>
</template>

<style scoped>
.server-import-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.server-import-actions {
  display: flex;
  justify-content: flex-end;
}

.server-assets-grid :deep(.vxe-toolbar) {
  padding-bottom: 12px;
}

.brand-logo-frame {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 24px;
  padding: 2px 4px;
  overflow: hidden;
  line-height: 1;
  vertical-align: middle;
  background: rgb(148 163 184 / 14%);
  border: 1px solid rgb(148 163 184 / 20%);
  border-radius: 4px;
}

.brand-logo-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
