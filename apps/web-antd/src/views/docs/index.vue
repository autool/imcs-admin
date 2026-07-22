<script lang="ts" setup>
import { ref } from 'vue';

import {
  Card,
  Collapse,
  CollapsePanel,
  Descriptions,
  Tag,
  Typography,
} from 'ant-design-vue';

const { Title, Paragraph } = Typography;

const activeKey = ref<string[]>(['1']);
const moduleActiveKey = ref<string[]>([]);

const systemInfo = {
  name: 'IMCS 基础设施管理系统',
  version: 'v1.0.0',
  framework: 'Vue 3 + Vben Admin + Ant Design Vue',
  backend: 'FastAPI + SQLAlchemy + Celery',
  database: 'MySQL 8.0',
  architecture: '前后端分离 + Agent 分布式采集',
  buildTime: '2024-12-01',
};

const modules = [
  {
    key: '1',
    title: '一、系统概览',
    content: `IMCS（Intelligent Management Control System）是一套智能化的基础设施管理平台，用于统一监控和管理服务器、网络设备等硬件资产。系统采用分布式架构，通过部署在各个区域的 Agent 节点采集设备数据，并提供可视化的 Web 管理界面。`,
  },
  {
    key: '2',
    title: '二、功能模块',
    children: [
      {
        key: '2-1',
        title: '2.1 仪表盘',
        content: `仪表盘提供全局数据概，包括设备统计、告警趋势、任务执行情况等。包含两个子页面：
- **分析页**：展示设备数量统计、告警分布趋势、在线率等关键指标
- **工作台**：提供快捷操作入口和待办事项提醒`,
      },
      {
        key: '2-2',
        title: '2.2 资产管理',
        content: `资产管理模块提供对服务器设备的全面管理功能：
- **设备列表**：查看、搜索、筛选所有已管理的服务器设备，支持导入/导出
- **终端管理**：通过 Web 终端远程连接设备
- **优先级分组**：为设备设置优先级分组，便于分级管理
- **区域管理**：按区域组织设备，支持区域级别的权限控制
- **导入历史**：查看设备批量导入的历史记录`,
      },
      {
        key: '2-3',
        title: '2.3 告警管理',
        content: `告警管理模块用于监控和响应设备告警：
- **告警配置**：设置告警规则、通知方式和接收人
- **告警列表**：查看当前和历史告警，支持处理、分配、关闭等操作`,
      },
      {
        key: '2-4',
        title: '2.4 任务管理',
        content: `任务管理模块支持定时任务和手动任务：
- **定时任务**：创建和管理周期性执行的采集/检查任务
- **工作记录**：查看手动触发的任务执行记录
- **执行历史**：查看每次任务执行的详细结果`,
      },
      {
        key: '2-5',
        title: '2.5 系统管理',
        content: `系统管理模块包含系统配置和用户管理：
- **用户管理**：管理用户账号、角色和权限
- **角色管理**：配置角色及其关联的菜单和按钮权限
- **部门管理**：管理组织架构和部门信息
- **节点管理**：管理 Agent 节点状态和健康信息
- **AI 配置**：配置 AI 大模型接口
- **通知配置**：配置邮件、短信等通知渠道
- **短信网关**：管理短信服务提供商配置`,
      },
      {
        key: '2-6',
        title: '2.6 网络管理',
        content: `网络管理模块用于管理网络资源：
- **业务 IP 管理**：管理业务 IP 地址池，支持导入/导出
- **VLAN 管理**：配置和管理 VLAN 信息
- **VLAN 分组**：按业务需求对 VLAN 进行分组管理`,
      },
      {
        key: '2-7',
        title: '2.7 通知中心',
        content: `通知中心提供系统内消息通知功能：
- **通知列表**：查看系统推送的通知消息
- **通知模板**：管理通知消息模板`,
      },
    ],
  },
  {
    key: '3',
    title: '三、权限说明',
    content: `系统采用基于角色的访问控制（RBAC）：
- **角色**：每个用户关联一个或多个角色
- **菜单权限**：控制用户可访问的菜单项
- **按钮权限**：控制页面内的操作按钮（查看、新增、编辑、删除等）
- **区域权限**：限制用户只能查看特定区域的设备数据`,
  },
  {
    key: '4',
    title: '四、常见问题',
    children: [
      {
        key: '4-1',
        title: 'Q1: 设备数据采集不到怎么办？',
        content: `1. 检查 Agent 节点是否在线（系统管理 → 节点管理）
2. 确认设备的 IPMI/Redfish 接口已启用
3. 查看任务执行历史，确认采集任务是否成功
4. 如仍无法采集，可在终端页面手动连接设备检查`,
      },
      {
        key: '4-2',
        title: 'Q2: 如何新增用户并分配权限？',
        content: `1. 进入系统管理 → 用户管理，点击"新增用户"
2. 填写用户基本信息（用户名、姓名、邮箱等）
3. 为用户分配角色
4. 角色权限在"角色管理"中配置，包括菜单权限和按钮权限
5. 区域权限在用户编辑页面中指定`,
      },
      {
        key: '4-3',
        title: 'Q3: 如何配置告警通知？',
        content: `1. 进入系统管理 → 通知配置，添加通知接收人和渠道
2. 进入资产管理 → 告警配置，创建告警规则
3. 选择告警级别（严重、警告、信息）和通知方式
4. 测试告警规则确保通知正常发送`,
      },
      {
        key: '4-4',
        title: 'Q4: 如何导入设备？',
        content: `1. 进入资产管理 → 设备列表，点击"导入"按钮
2. 下载导入模板，填写设备信息
3. 上传 Excel 文件
4. 在"导入历史"中查看导入进度和结果`,
      },
    ],
  },
] as const;

const [overviewModule, featureModule, permissionModule, faqModule] = modules;
</script>

<template>
  <div class="p-6">
    <Title :level="3">IMCS 操作手册</Title>
    <Paragraph class="docs-desc">
      本文档介绍了 IMCS 基础设施管理系统的功能模块、使用方法和常见问题。
    </Paragraph>

    <Card title="系统信息" class="mb-4">
      <Descriptions :column="2" size="small" bordered>
        <Descriptions.Item label="系统名称">
          {{ systemInfo.name }}
        </Descriptions.Item>
        <Descriptions.Item label="当前版本">
          <Tag color="blue">{{ systemInfo.version }}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="前端框架">
          {{ systemInfo.framework }}
        </Descriptions.Item>
        <Descriptions.Item label="后端框架">
          {{ systemInfo.backend }}
        </Descriptions.Item>
        <Descriptions.Item label="数据库">
          {{ systemInfo.database }}
        </Descriptions.Item>
        <Descriptions.Item label="系统架构">
          {{ systemInfo.architecture }}
        </Descriptions.Item>
      </Descriptions>
    </Card>

    <Collapse v-model:active-key="activeKey" class="mb-4">
      <CollapsePanel :key="1" :header="overviewModule.title">
        <Paragraph>{{ overviewModule.content }}</Paragraph>
      </CollapsePanel>

      <CollapsePanel :key="2" :header="featureModule.title">
        <Collapse v-model:active-key="moduleActiveKey">
          <CollapsePanel
            v-for="child in featureModule.children"
            :key="child.key"
            :header="child.title"
          >
            <Paragraph>
              <pre class="docs-pre">{{ child.content }}</pre>
            </Paragraph>
          </CollapsePanel>
        </Collapse>
      </CollapsePanel>

      <CollapsePanel :key="3" :header="permissionModule.title">
        <Paragraph>{{ permissionModule.content }}</Paragraph>
      </CollapsePanel>

      <CollapsePanel :key="4" :header="faqModule.title">
        <Collapse>
          <CollapsePanel
            v-for="child in faqModule.children"
            :key="child.key"
            :header="child.title"
          >
            <Paragraph>
              <pre class="docs-pre">{{ child.content }}</pre>
            </Paragraph>
          </CollapsePanel>
        </Collapse>
      </CollapsePanel>
    </Collapse>
  </div>
</template>

<style scoped>
.docs-desc {
  color: hsl(var(--muted-foreground));
}

.docs-pre {
  line-height: 1.75;
  color: hsl(var(--foreground));
  white-space: pre-wrap;
}
</style>
