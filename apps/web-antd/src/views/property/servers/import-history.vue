<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Badge,
  Button,
  Descriptions,
  Drawer,
  List,
  Progress,
  Space,
  Tag,
  Typography,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getImportTaskDetailApi, getImportTasksApi } from '#/api';

const props = defineProps<{
  embedded?: boolean;
}>();

const { Title, Text } = Typography;

const detailDrawerVisible = ref(false);
const currentTask = ref<any>(null);
const pollingTimer = ref<any>(null);

// 状态映射
const statusMap: Record<string, { color: string; status: any; text: string }> =
  {
    pending: { text: '等待中', color: 'default', status: 'default' },
    processing: { text: '导入中', color: 'processing', status: 'processing' },
    completed: { text: '已完成', color: 'success', status: 'success' },
    failed: { text: '失败', color: 'error', status: 'error' },
  };

const gridOptions: VxeGridProps = {
  stripe: true,
  columns: [
    { title: '序号', type: 'seq', width: 60, fixed: 'left' },
    { field: 'file_name', title: '文件名', width: 200 },
    { field: 'user_name', title: '导入用户', width: 120 },
    {
      field: 'status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'progress',
      title: '进度',
      width: 150,
      slots: { default: 'progress' },
    },
    { field: 'total_count', title: '总数', width: 80 },
    { field: 'success_count', title: '成功', width: 80 },
    { field: 'failed_count', title: '失败', width: 80 },
    {
      field: 'created_at',
      formatter: 'formatDateTime',
      title: '创建时间',
      width: 180,
    },
    {
      field: 'completed_at',
      formatter: 'formatDateTime',
      title: '完成时间',
      width: 180,
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 120,
    },
  ],
  height: props.embedded ? 520 : 'auto',
  pagerConfig: {
    pageSize: 10,
    pageSizes: [10, 20, 50, 100],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) => {
        return await getImportTasksApi({
          page: page.currentPage,
          pageSize: page.pageSize,
        });
      },
    },
    response: {
      result: 'items',
      total: 'total',
      list: 'items',
    },
  },
};

const [Grid, gridApi] = useVbenVxeGrid({ gridOptions });

async function viewDetail(row: any) {
  try {
    const result = await getImportTaskDetailApi(row.id);
    currentTask.value = result;
    detailDrawerVisible.value = true;
  } catch (error) {
    console.error('获取任务详情失败:', error);
  }
}

function closeDetail() {
  detailDrawerVisible.value = false;
  currentTask.value = null;
}

function startPolling() {
  // 每3秒刷新一次列表
  pollingTimer.value = setInterval(() => {
    gridApi.query();
  }, 3000);
}

function stopPolling() {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
}

onMounted(() => {
  startPolling();
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <component
    :is="embedded ? 'div' : Page"
    v-bind="embedded ? {} : { autoContentHeight: true }"
  >
    <Grid>
      <template #status="{ row }">
        <Badge
          :status="statusMap[row.status]?.status"
          :text="statusMap[row.status]?.text"
        />
      </template>

      <template #progress="{ row }">
        <Progress
          :percent="row.progress"
          :status="
            row.status === 'failed'
              ? 'exception'
              : row.status === 'completed'
                ? 'success'
                : 'active'
          "
          :stroke-width="8"
        />
      </template>

      <template #action="{ row }">
        <Button type="link" @click="viewDetail(row)">查看详情</Button>
      </template>
    </Grid>

    <!-- 详情抽屉 -->
    <Drawer
      v-model:open="detailDrawerVisible"
      title="导入任务详情"
      width="600"
      @close="closeDetail"
    >
      <div v-if="currentTask">
        <Descriptions bordered :column="1">
          <Descriptions.Item label="任务ID">
            {{ currentTask.id }}
          </Descriptions.Item>
          <Descriptions.Item label="文件名">
            {{ currentTask.file_name }}
          </Descriptions.Item>
          <Descriptions.Item label="导入用户">
            {{ currentTask.user_name }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Badge
              :status="statusMap[currentTask.status]?.status"
              :text="statusMap[currentTask.status]?.text"
            />
          </Descriptions.Item>
          <Descriptions.Item label="进度">
            <Progress
              :percent="currentTask.progress"
              :status="
                currentTask.status === 'failed'
                  ? 'exception'
                  : currentTask.status === 'completed'
                    ? 'success'
                    : 'active'
              "
            />
          </Descriptions.Item>
          <Descriptions.Item label="总数">
            {{ currentTask.total_count }}
          </Descriptions.Item>
          <Descriptions.Item label="成功数">
            <Tag color="success">{{ currentTask.success_count }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="失败数">
            <Tag color="error">{{ currentTask.failed_count }}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="开始时间">
            {{ currentTask.started_at }}
          </Descriptions.Item>
          <Descriptions.Item label="完成时间">
            {{ currentTask.completed_at || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <!-- 失败详情 -->
        <div
          v-if="currentTask.failed_items && currentTask.failed_items.length > 0"
          class="mt-6"
        >
          <Title :level="4">失败详情</Title>
          <Alert
            message="以下服务器导入失败，请检查数据后重新导入"
            type="error"
            show-icon
            class="mb-4"
          />
          <List
            :data-source="currentTask.failed_items"
            :pagination="{ pageSize: 10 }"
            bordered
          >
            <template #renderItem="{ item }">
              <List.Item>
                <Space direction="vertical" style="width: 100%">
                  <Space>
                    <Tag color="error">行 {{ item.row }}</Tag>
                    <Text strong>{{ item.ip }}</Text>
                  </Space>
                  <Text type="danger">{{ item.reason }}</Text>
                </Space>
              </List.Item>
            </template>
          </List>
        </div>
      </div>
    </Drawer>
  </component>
</template>
