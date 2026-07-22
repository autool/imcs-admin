<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import {
  Activity,
  Archive,
  BarChart3,
  BellRing,
  Blocks,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Clock3,
  Database,
  FileChartColumn,
  FileText,
  History,
  Inbox,
  LayoutDashboard,
  Library,
  ListChecks,
  ListTodo,
  LoaderCircle,
  Network,
  Package,
  PencilRuler,
  PieChart,
  Play,
  Send,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-vue-next';

type ChartType = 'bar' | 'donut' | 'line';
type Size = 'compact' | 'large';
type Tone = 'danger' | 'info' | 'success' | 'warning';

const props = withDefaults(
  defineProps<{
    chartData?: Array<{ label: string; value: number }>;
    chartType?: ChartType;
    description?: string;
    icon?: string;
    label: string;
    size?: Size;
    suffix?: string;
    tone?: Tone;
    value: number | string;
  }>(),
  {
    chartData: () => [],
    chartType: 'line',
    description: '',
    icon: 'lucide:activity',
    size: 'compact',
    suffix: '',
    tone: 'info',
  },
);

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
type ChartOption = Parameters<typeof renderEcharts>[0];

const toneColorMap: Record<Tone, string> = {
  danger: '#ef4444',
  info: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
};

const mainColor = computed(() => toneColorMap[props.tone]);
const chartSize = computed(() =>
  props.size === 'large'
    ? { height: '44px', width: '110px' }
    : { height: '24px', width: '58px' },
);
const iconMap = {
  'lucide:activity': Activity,
  'lucide:archive': Archive,
  'lucide:bar-chart-3': BarChart3,
  'lucide:bell-ring': BellRing,
  'lucide:blocks': Blocks,
  'lucide:calendar-clock': CalendarClock,
  'lucide:check-circle-2': CheckCircle2,
  'lucide:circle-alert': CircleAlert,
  'lucide:circle-check': CircleCheck,
  'lucide:clock-3': Clock3,
  'lucide:database': Database,
  'lucide:file-chart-column': FileChartColumn,
  'lucide:file-text': FileText,
  'lucide:history': History,
  'lucide:inbox': Inbox,
  'lucide:layout-dashboard': LayoutDashboard,
  'lucide:library': Library,
  'lucide:list-checks': ListChecks,
  'lucide:list-todo': ListTodo,
  'lucide:loader-circle': LoaderCircle,
  'lucide:network': Network,
  'lucide:package': Package,
  'lucide:pencil-ruler': PencilRuler,
  'lucide:pie-chart': PieChart,
  'lucide:play': Play,
  'lucide:send': Send,
  'lucide:server': Server,
  'lucide:shield': Shield,
  'lucide:shield-alert': ShieldAlert,
  'lucide:shield-check': ShieldCheck,
  'lucide:triangle-alert': TriangleAlert,
  'lucide:user-plus': UserPlus,
  'lucide:users': Users,
  'lucide:workflow': Workflow,
};
const iconComponent = computed(
  () => iconMap[props.icon as keyof typeof iconMap] || Activity,
);
const normalizedData = computed(() => {
  const rows = props.chartData.filter((item) =>
    Number.isFinite(Number(item.value)),
  );
  return rows.length > 0
    ? rows
    : [{ label: props.label, value: Number(props.value) || 0 }];
});

const tooltipOption = {
  appendToBody: true,
  confine: false,
  extraCssText: 'z-index: 9999;',
};
const donutFallbackColors = ['#94a3b8', '#38bdf8', '#a78bfa', '#f97316'];

function buildLineOption(): ChartOption {
  return {
    grid: { bottom: 2, left: 0, right: 0, top: 4 },
    series: [
      {
        areaStyle: { color: mainColor.value, opacity: 0.08 },
        data: normalizedData.value.map((item) => item.value),
        lineStyle: { color: mainColor.value, width: 1.6 },
        showSymbol: false,
        smooth: true,
        type: 'line' as const,
      },
    ],
    tooltip: { ...tooltipOption, trigger: 'axis' as const },
    xAxis: {
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      data: normalizedData.value.map((item) => item.label),
      type: 'category' as const,
    },
    yAxis: {
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      type: 'value' as const,
    },
  };
}

function buildBarOption(): ChartOption {
  return {
    grid: { bottom: 2, left: 0, right: 0, top: 4 },
    series: [
      {
        barMaxWidth: 8,
        data: normalizedData.value.map((item) => item.value),
        itemStyle: { borderRadius: [4, 4, 0, 0], color: mainColor.value },
        type: 'bar' as const,
      },
    ],
    tooltip: { ...tooltipOption, trigger: 'axis' as const },
    xAxis: {
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      data: normalizedData.value.map((item) => item.label),
      type: 'category' as const,
    },
    yAxis: {
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { show: false },
      type: 'value' as const,
    },
  };
}

function buildDonutOption(): ChartOption {
  return {
    series: [
      {
        avoidLabelOverlap: true,
        data: normalizedData.value.map((item, index) => ({
          itemStyle: {
            color:
              index === 0
                ? mainColor.value
                : (donutFallbackColors[index % donutFallbackColors.length] ??
                  '#94a3b8'),
          },
          name: item.label,
          value: item.value,
        })),
        label: { show: false },
        radius: ['56%', '76%'],
        type: 'pie' as const,
      },
    ],
    tooltip: { ...tooltipOption, trigger: 'item' as const },
  };
}

async function renderChart() {
  if (!chartRef.value) return;
  await nextTick();
  let option: ChartOption = buildLineOption();
  if (props.chartType === 'bar') {
    option = buildBarOption();
  }
  if (props.chartType === 'donut') {
    option = buildDonutOption();
  }
  requestAnimationFrame(() => renderEcharts(option));
}

onMounted(renderChart);

watch(
  () => [props.chartData, props.chartType, props.tone, props.value],
  renderChart,
  { deep: true, immediate: true },
);
</script>

<template>
  <div
    class="metric-card"
    :class="[`metric-card--${tone}`, `metric-card--${size}`]"
  >
    <div class="metric-card__icon">
      <component :is="iconComponent" />
    </div>
    <div class="metric-card__content">
      <div class="metric-card__label">{{ label }}</div>
      <div class="metric-card__value">
        {{ value }}<span v-if="suffix">{{ suffix }}</span>
      </div>
    </div>
    <EchartsUI
      ref="chartRef"
      class="metric-card__chart"
      :height="chartSize.height"
      :width="chartSize.width"
    />
  </div>
</template>

<style scoped>
.metric-card {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 58px;
  gap: 8px;
  align-items: center;
  min-height: 54px;
  padding: 6px 8px;
  overflow: visible;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 6px;
}

.metric-card__label {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  line-height: 1.2;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.metric-card__value {
  margin-top: 3px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  color: hsl(var(--foreground));
}

.metric-card__value span {
  margin-left: 2px;
  font-size: 12px;
  font-weight: 500;
}

.metric-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 16px;
  color: var(--metric-color);
  background: var(--metric-soft);
  border-radius: 6px;
}

.metric-card__icon :deep(svg) {
  display: block;
  width: 14px;
  height: 14px;
}

.metric-card__chart {
  width: 58px;
  height: 24px;
}

.metric-card--info {
  --metric-color: #2563eb;
  --metric-soft: rgb(37 99 235 / 10%);
}

.metric-card--success {
  --metric-color: #16a34a;
  --metric-soft: rgb(22 163 74 / 10%);
}

.metric-card--warning {
  --metric-color: #f59e0b;
  --metric-soft: rgb(245 158 11 / 12%);
}

.metric-card--danger {
  --metric-color: #ef4444;
  --metric-soft: rgb(239 68 68 / 10%);
}

.metric-card--large {
  grid-template-columns: 32px minmax(0, 1fr) 110px;
  gap: 12px;
  min-height: 86px;
  padding: 12px;
}

.metric-card--large .metric-card__icon {
  width: 32px;
  height: 32px;
}

.metric-card--large .metric-card__icon :deep(svg) {
  width: 17px;
  height: 17px;
}

.metric-card--large .metric-card__label {
  font-size: 13px;
}

.metric-card--large .metric-card__value {
  margin-top: 6px;
  font-size: 24px;
}

.metric-card--large .metric-card__chart {
  width: 110px;
  height: 44px;
}

@media (max-width: 640px) {
  .metric-card {
    grid-template-columns: 26px minmax(0, 1fr) 54px;
  }

  .metric-card--large {
    grid-template-columns: 32px minmax(0, 1fr) 90px;
  }
}
</style>
