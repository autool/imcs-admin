<script lang="ts" setup>
import { computed, onMounted } from 'vue';

import { Page } from '@vben/common-ui';

import { Card, Col, Row, Statistic } from 'ant-design-vue';

import { useDashboardStore } from '#/store';

const dashboardStore = useDashboardStore();

const records = computed<Record<string, number>[]>(() =>
  Array.isArray(dashboardStore.dashboardData.data)
    ? (dashboardStore.dashboardData.data as Record<string, number>[])
    : [],
);

const cards = computed(() => [
  {
    title: '服务器总数',
    value: Number(records.value[0]?.servers_count || 0),
  },
  {
    title: '资产总数',
    value: Number(records.value[1]?.assets_count || 0),
  },
  {
    title: '基础设施告警',
    value: Number(records.value[2]?.alarms_count || 0),
  },
  {
    title: '今日备份',
    value: Number(records.value[3]?.day_backup || 0),
  },
]);

onMounted(() => dashboardStore.fetchDashboardData());
</script>

<template>
  <Page title="运营概览" description="资产、服务器、基础设施告警与备份概览">
    <Row :gutter="[16, 16]">
      <Col v-for="card in cards" :key="card.title" :xs="24" :sm="12" :xl="6">
        <Card :loading="dashboardStore.loading" :bordered="false">
          <Statistic :title="card.title" :value="card.value" />
        </Card>
      </Col>
    </Row>
  </Page>
</template>
