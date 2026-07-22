<script lang="ts" setup>
import type { AIModel } from '../data';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, Input, Spin } from 'ant-design-vue';

import { testAIModelStreamApi } from '#/api/system/ai';

const testMessage = ref('你好，请介绍一下你自己');
const testing = ref(false);
const testResult = ref<{
  aiResponse?: string;
  error?: string;
  status: 'error' | 'idle' | 'streaming' | 'success' | 'testing';
  usage?: any;
  userMessage?: string;
}>({ status: 'idle' });

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  async onConfirm() {
    if (!testMessage.value.trim()) {
      return;
    }

    testing.value = true;
    testResult.value = {
      status: 'testing',
      userMessage: testMessage.value,
      aiResponse: '', // 初始化为空字符串，用于流式累积
    };

    try {
      const model = modalApi.getData<AIModel>();
      if (!model?.id) {
        throw new Error('缺少 AI 模型标识');
      }

      // 使用流式传输
      await testAIModelStreamApi(model.id, testMessage.value, (content) => {
        // 累积AI响应内容
        if (testResult.value.aiResponse === undefined) {
          testResult.value.aiResponse = '';
        }
        testResult.value.aiResponse += content;
        testResult.value.status = 'streaming'; // 添加流式状态
      });

      // 流式传输完成
      testResult.value.status = 'success';
    } catch (error: any) {
      testResult.value = {
        status: 'error',
        userMessage: testMessage.value,
        error: error.message || '未知错误',
      };
    } finally {
      testing.value = false;
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      testResult.value = { status: 'idle' };
      testMessage.value = '你好，请介绍一下你自己';
    }
  },
});
</script>

<template>
  <Modal title="AI模型测试" class="!w-[900px]">
    <div class="mx-4 space-y-4">
      <!-- 模型信息 -->
      <Alert type="info" show-icon>
        <template #message>
          <div class="text-sm">
            <div>模型：{{ modalApi.getData()?.model_name }}</div>
            <div>提供商：{{ modalApi.getData()?.provider }}</div>
          </div>
        </template>
      </Alert>

      <!-- 输入区域 -->
      <div>
        <div class="mb-2 text-sm font-medium">测试消息：</div>
        <Input.TextArea
          v-model:value="testMessage"
          :rows="4"
          placeholder="请输入测试消息"
          :disabled="testing"
        />
      </div>

      <!-- 测试结果 -->
      <div v-if="testResult.status !== 'idle'" class="space-y-3">
        <!-- 测试中或流式传输中 -->
        <div v-if="testResult.status === 'testing'" class="py-4 text-center">
          <Spin size="large" />
          <div class="mt-2 text-sm text-gray-600">正在测试连接...</div>
        </div>

        <!-- 成功或流式传输中 -->
        <Alert
          v-else-if="
            testResult.status === 'success' || testResult.status === 'streaming'
          "
          :message="
            testResult.status === 'streaming' ? '正在接收响应...' : '测试成功'
          "
          :type="testResult.status === 'streaming' ? 'info' : 'success'"
          show-icon
        >
          <template #description>
            <div class="space-y-2">
              <div class="text-sm">
                <div class="mb-1 font-medium">AI响应：</div>
                <div class="whitespace-pre-wrap">
                  {{ testResult.aiResponse || '等待响应...' }}
                  <span
                    v-if="testResult.status === 'streaming'"
                    class="animate-pulse"
                  >
                    ▊
                  </span>
                </div>
              </div>
              <div
                v-if="testResult.usage && testResult.status === 'success'"
                class="text-xs opacity-70"
              >
                Token使用：{{ testResult.usage.total_tokens || 'N/A' }}
              </div>
            </div>
          </template>
        </Alert>

        <!-- 失败 -->
        <Alert
          v-else-if="testResult.status === 'error'"
          message="测试失败"
          type="error"
          show-icon
        >
          <template #description>
            <div class="text-sm">
              <div class="mb-1 font-medium">错误信息：</div>
              <div class="mb-2 whitespace-pre-wrap">{{ testResult.error }}</div>
              <div class="text-xs opacity-70">
                <div>可能的原因：</div>
                <ul class="mt-1 list-inside list-disc">
                  <li>API地址不正确</li>
                  <li>API Key无效或已过期</li>
                  <li>网络连接问题</li>
                  <li>模型名称错误</li>
                </ul>
              </div>
            </div>
          </template>
        </Alert>
      </div>
    </div>
  </Modal>
</template>
