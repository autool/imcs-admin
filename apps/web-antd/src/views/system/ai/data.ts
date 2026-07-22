import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';

export interface AIModel {
  id?: string;
  name: string;
  provider: string;
  api_key: string;
  api_url: string;
  model_name: string;
  max_tokens?: number;
  temperature?: number;
  enabled: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '模型名称',
      rules: z
        .string()
        .min(2, '模型名称至少2个字符')
        .max(50, '模型名称最多50个字符')
        .nonempty('请输入模型名称'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        class: 'w-60',
        options: [
          { label: 'OpenAI', value: 'openai' },
          { label: 'Azure OpenAI', value: 'azure' },
          { label: '智谱AI', value: 'zhipu' },
          { label: '通义千问', value: 'qwen' },
          { label: '文心一言', value: 'wenxin' },
          { label: 'DeepSeek', value: 'deepseek' },
          { label: '其他', value: 'custom' },
        ],
      },
      fieldName: 'provider',
      label: '提供商',
      rules: z.string().nonempty('请选择提供商'),
    },
    {
      component: 'Input',
      fieldName: 'model_name',
      label: '模型标识',
      componentProps: {
        placeholder: '如：gpt-4, gpt-3.5-turbo',
      },
      rules: z.string().nonempty('请输入模型标识'),
    },
    {
      component: 'Input',
      fieldName: 'api_url',
      label: 'API地址',
      componentProps: {
        placeholder: '如：https://api.openai.com/v1',
      },
      rules: z.string().url('请输入有效的URL').nonempty('请输入API地址'),
    },
    {
      component: 'VbenInputPassword',
      fieldName: 'api_key',
      label: 'API Key',
      componentProps: {
        placeholder: '请输入API Key',
      },
      rules: z.string().nonempty('请输入API Key'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 100,
        max: 128_000,
        placeholder: '默认2000',
      },
      defaultValue: 2000,
      fieldName: 'max_tokens',
      label: '最大Token数',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 2,
        step: 0.1,
        placeholder: '默认0.7',
      },
      defaultValue: 0.7,
      fieldName: 'temperature',
      label: '温度参数',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '启用', value: true },
          { label: '禁用', value: false },
        ],
        optionType: 'button',
      },
      defaultValue: true,
      fieldName: 'enabled',
      label: '状态',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '是', value: true },
          { label: '否', value: false },
        ],
        optionType: 'button',
      },
      defaultValue: false,
      fieldName: 'is_default',
      label: '设为默认',
    },
  ];
}

// 列表查询表单
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '模型名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: 'OpenAI', value: 'openai' },
          { label: 'Azure OpenAI', value: 'azure' },
          { label: '智谱AI', value: 'zhipu' },
          { label: '通义千问', value: 'qwen' },
          { label: '文心一言', value: 'wenxin' },
          { label: 'DeepSeek', value: 'deepseek' },
          { label: '其他', value: 'custom' },
        ],
      },
      fieldName: 'provider',
      label: '提供商',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: '启用', value: true },
          { label: '禁用', value: false },
        ],
      },
      fieldName: 'enabled',
      label: '状态',
    },
  ];
}

// 列配置
export function useColumns<T = AIModel>(
  onActionClick: OnActionClickFn<T>,
  onStatusChange?: (newStatus: any, row: T) => PromiseLike<boolean | undefined>,
  _onTestClick?: (row: T) => void,
  permissions: { canConfig?: boolean; canTest?: boolean } = {},
): VxeTableGridOptions['columns'] {
  const operationOptions = [];
  if (permissions.canTest) {
    operationOptions.push({
      code: 'test',
      text: '测试',
    });
  }
  if (permissions.canConfig) {
    operationOptions.push('edit', 'delete');
  }

  return [
    {
      align: 'center',
      field: 'seq',
      title: '序号',
      type: 'seq',
      width: 70,
    },
    {
      field: 'name',
      title: '模型名称',
      width: 150,
    },
    {
      field: 'provider',
      title: '提供商',
      width: 120,
      cellRender: {
        name: 'CellTag',
        attrs: {
          options: [
            { label: 'OpenAI', value: 'openai', color: 'success' },
            { label: 'Azure', value: 'azure', color: 'processing' },
            { label: '智谱AI', value: 'zhipu', color: 'warning' },
            { label: '通义千问', value: 'qwen', color: 'cyan' },
            { label: '文心一言', value: 'wenxin', color: 'purple' },
            { label: 'DeepSeek', value: 'deepseek', color: 'blue' },
            { label: '其他', value: 'custom', color: 'default' },
          ],
        },
      },
    },
    {
      field: 'model_name',
      title: '模型标识',
      width: 150,
    },
    {
      field: 'api_url',
      title: 'API地址',
      minWidth: 200,
      showOverflow: 'tooltip',
    },
    {
      cellRender: {
        attrs: {
          beforeChange: permissions.canConfig ? onStatusChange : undefined,
        },
        name:
          permissions.canConfig && onStatusChange ? 'CellSwitch' : 'CellTag',
        props: {
          checkedValue: true,
          unCheckedValue: false,
        },
      },
      field: 'enabled',
      title: '状态',
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        attrs: {
          options: [
            { color: 'success', label: '是', value: true },
            { color: 'default', label: '否', value: false },
          ],
        },
      },
      field: 'is_default',
      title: '默认模型',
      width: 100,
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 180,
    },
    {
      align: 'center',
      fixed: 'right',
      title: '操作',
      width: 200,
      cellRender: {
        name: 'CellOperation',
        attrs: {
          nameField: 'name',
          nameTitle: '模型名称',
          onClick: onActionClick,
        },
        options: operationOptions,
      },
    },
  ];
}
