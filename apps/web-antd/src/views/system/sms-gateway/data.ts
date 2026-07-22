import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SmsGatewayApi } from '#/api/system/sms-gateway';

import { useAccess } from '@vben/access';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

const PROVIDER_MAP: Record<string, string> = {
  aliyun: '阿里云',
  tencent: '腾讯云',
  qiniu: '七牛云',
  upyun: '又拍云',
  custom: '自定义',
};

const PROVIDER_TIPS: Record<string, string> = {
  aliyun: '前往阿里云控制台 → 云通信 → 短信服务 → API-KEY 管理获取',
  tencent: '前往腾讯云控制台 → 短信 → 国内短信 → 应用列表获取',
  qiniu: '前往七牛云控制台 → 密钥管理获取',
  upyun: '前往又拍云控制台 → 短信管理获取操作员账号',
  custom: '自定义短信网关，需自行配置 API 端点和认证方式',
};

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '配置名称',
      rules: z.string().min(1, { message: '请输入配置名称' }),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: false,
        dropdownMatchSelectWidth: false,
        style: { width: '200px' },
        dropdownStyle: { width: '200px' },
        options: Object.entries(PROVIDER_MAP).map(([value, label]) => ({
          value,
          label,
        })),
      },
      fieldName: 'provider',
      label: '网关提供商',
      rules: z.string().min(1, { message: '请选择网关提供商' }),
    },
    // ===== 通用：认证凭据 =====

    // 阿里云
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'aliyun',
        triggerFields: ['provider'],
      },
      fieldName: 'access_key',
      label: 'AccessKey ID',
      componentProps: {
        placeholder: '请输入阿里云 AccessKey ID',
      },
      help: PROVIDER_TIPS.aliyun,
      rules: z.string().min(1, { message: '请输入 AccessKey ID' }),
    },
    {
      component: 'VbenInputPassword',
      dependencies: {
        show: (values) => values.provider === 'aliyun',
        triggerFields: ['provider'],
      },
      fieldName: 'secret_key',
      label: 'AccessKey Secret',
      componentProps: {
        placeholder: '请输入阿里云 AccessKey Secret',
      },
      rules: z.string().min(1, { message: '请输入 AccessKey Secret' }),
    },
    // 腾讯云
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'tencent',
        triggerFields: ['provider'],
      },
      fieldName: 'secret_id',
      label: 'SecretId',
      componentProps: {
        placeholder: '请输入腾讯云 SecretId',
      },
      help: PROVIDER_TIPS.tencent,
      rules: z.string().min(1, { message: '请输入 SecretId' }),
    },
    {
      component: 'VbenInputPassword',
      dependencies: {
        show: (values) => values.provider === 'tencent',
        triggerFields: ['provider'],
      },
      fieldName: 'secret_key',
      label: 'SecretKey',
      componentProps: {
        placeholder: '请输入腾讯云 SecretKey',
      },
      rules: z.string().min(1, { message: '请输入 SecretKey' }),
    },
    // 七牛云
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'qiniu',
        triggerFields: ['provider'],
      },
      fieldName: 'access_key',
      label: 'AccessKey',
      componentProps: {
        placeholder: '请输入七牛云 AccessKey',
      },
      help: PROVIDER_TIPS.qiniu,
      rules: z.string().min(1, { message: '请输入 AccessKey' }),
    },
    {
      component: 'VbenInputPassword',
      dependencies: {
        show: (values) => values.provider === 'qiniu',
        triggerFields: ['provider'],
      },
      fieldName: 'secret_key',
      label: 'SecretKey',
      componentProps: {
        placeholder: '请输入七牛云 SecretKey',
      },
      rules: z.string().min(1, { message: '请输入 SecretKey' }),
    },
    // 又拍云
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'upyun',
        triggerFields: ['provider'],
      },
      fieldName: 'operator_name',
      label: '操作员名称',
      componentProps: {
        placeholder: '请输入又拍云操作员名称',
      },
      help: PROVIDER_TIPS.upyun,
      rules: z.string().min(1, { message: '请输入操作员名称' }),
    },
    {
      component: 'VbenInputPassword',
      dependencies: {
        show: (values) => values.provider === 'upyun',
        triggerFields: ['provider'],
      },
      fieldName: 'operator_password',
      label: '操作员密码',
      componentProps: {
        placeholder: '请输入又拍云操作员密码',
      },
      rules: z.string().min(1, { message: '请输入操作员密码' }),
    },
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'upyun',
        triggerFields: ['provider'],
      },
      fieldName: 'bucket_name',
      label: 'Bucket 名称',
      componentProps: {
        placeholder: '请输入短信 Bucket 名称',
      },
      rules: z.string().min(1, { message: '请输入 Bucket 名称' }),
    },
    // 自定义
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'custom',
        triggerFields: ['provider'],
      },
      fieldName: 'access_key',
      label: 'AppKey',
      componentProps: {
        placeholder: '请输入应用 Key',
      },
      help: PROVIDER_TIPS.custom,
    },
    {
      component: 'VbenInputPassword',
      dependencies: {
        show: (values) => values.provider === 'custom',
        triggerFields: ['provider'],
      },
      fieldName: 'secret_key',
      label: 'AppSecret',
      componentProps: {
        placeholder: '请输入应用 Secret',
      },
    },

    // ===== 短信模板 =====

    // 阿里云 / 腾讯云 / 七牛云
    {
      component: 'Input',
      dependencies: {
        show: (values) =>
          ['aliyun', 'qiniu', 'tencent'].includes(values.provider),
        triggerFields: ['provider'],
      },
      fieldName: 'sign_name',
      label: '短信签名',
      componentProps: {
        placeholder: '请输入短信签名',
      },
    },
    {
      component: 'Input',
      dependencies: {
        show: (values) =>
          ['aliyun', 'qiniu', 'tencent'].includes(values.provider),
        triggerFields: ['provider'],
      },
      fieldName: 'template_code',
      label: '模板 Code',
      componentProps: {
        placeholder: '请输入短信模板 Code',
      },
    },
    // 又拍云
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'upyun',
        triggerFields: ['provider'],
      },
      fieldName: 'template_code',
      label: '模板 ID',
      componentProps: {
        placeholder: '请输入短信模板 ID',
      },
    },
    // 自定义
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'custom',
        triggerFields: ['provider'],
      },
      fieldName: 'endpoint',
      label: 'API 端点',
      componentProps: {
        placeholder: '请输入短信 API 地址',
      },
    },

    // ===== 区域 =====

    // 阿里云
    {
      component: 'Select',
      dependencies: {
        show: (values) => values.provider === 'aliyun',
        triggerFields: ['provider'],
      },
      componentProps: {
        allowClear: false,
        style: { width: '200px' },
        dropdownStyle: { width: '200px' },
        options: [
          { label: '华东1（杭州）', value: 'cn-hangzhou' },
          { label: '华东2（上海）', value: 'cn-shanghai' },
          { label: '华北2（北京）', value: 'cn-beijing' },
          { label: '华南1（深圳）', value: 'cn-shenzhen' },
          { label: '华北3（张家口）', value: 'cn-zhangjiakou' },
          { label: '亚太东南1（新加坡）', value: 'ap-southeast-1' },
        ],
      },
      defaultValue: 'cn-hangzhou',
      fieldName: 'region',
      label: '区域',
    },
    // 腾讯云
    {
      component: 'Select',
      dependencies: {
        show: (values) => values.provider === 'tencent',
        triggerFields: ['provider'],
      },
      componentProps: {
        allowClear: false,
        style: { width: '200px' },
        dropdownStyle: { width: '200px' },
        options: [
          { label: '华南地区（广州）', value: 'ap-guangzhou' },
          { label: '华东地区（上海）', value: 'ap-shanghai' },
          { label: '华北地区（北京）', value: 'ap-beijing' },
          { label: '西南地区（重庆）', value: 'ap-chongqing' },
          { label: '东南亚地区（新加坡）', value: 'ap-singapore' },
        ],
      },
      defaultValue: 'ap-guangzhou',
      fieldName: 'region',
      label: '区域',
    },
    // 华为云
    {
      component: 'Select',
      dependencies: {
        show: (values) => values.provider === 'huawei',
        triggerFields: ['provider'],
      },
      componentProps: {
        allowClear: false,
        style: { width: '200px' },
        dropdownStyle: { width: '200px' },
        options: [
          { label: '华北-北京四', value: 'cn-north-4' },
          { label: '华东-上海一', value: 'cn-east-3' },
          { label: '华南-广州', value: 'cn-south-1' },
          { label: '亚太-曼谷', value: 'ap-southeast-2' },
        ],
      },
      defaultValue: 'cn-north-4',
      fieldName: 'region',
      label: '区域',
    },
    // 七牛云
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'qiniu',
        triggerFields: ['provider'],
      },
      defaultValue: 'cn',
      fieldName: 'region',
      label: '区域',
      help: '七牛云短信默认使用国内服务',
    },
    // 又拍云
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'upyun',
        triggerFields: ['provider'],
      },
      defaultValue: 'cn',
      fieldName: 'region',
      label: '区域',
      help: '又拍云短信默认使用国内服务',
    },
    // 自定义
    {
      component: 'Input',
      dependencies: {
        show: (values) => values.provider === 'custom',
        triggerFields: ['provider'],
      },
      fieldName: 'region',
      label: '区域',
      componentProps: {
        placeholder: '可选，用于自定义端点',
      },
    },

    // ===== 限速配置（通用） =====
    {
      component: 'InputNumber',
      defaultValue: 5,
      fieldName: 'rate_limit',
      label: '限速（条/分钟）',
      componentProps: {
        min: 1,
        max: 1000,
      },
    },
    {
      component: 'InputNumber',
      defaultValue: 50,
      fieldName: 'daily_limit',
      label: '每日上限（条）',
      componentProps: {
        min: 1,
        max: 100_000,
      },
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      label: '描述',
      componentProps: {
        rows: 2,
      },
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'is_enabled',
      label: '是否启用',
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'is_default',
      label: '设为默认网关',
    },
  ];
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: '配置名称',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        dropdownMatchSelectWidth: false,
        options: Object.entries(PROVIDER_MAP).map(([value, label]) => ({
          value,
          label,
        })),
      },
      fieldName: 'provider',
      label: '网关提供商',
    },
  ];
}

export function useColumns(
  onActionClick: OnActionClickFn<SmsGatewayApi.SmsGateway>,
  _onTest: (row: SmsGatewayApi.SmsGateway) => void,
): VxeTableGridOptions['columns'] {
  const { hasAccessByCodes } = useAccess();
  const canDeleteGateway = hasAccessByCodes(['sms_gateway:delete']);
  const canEditGateway = hasAccessByCodes(['sms_gateway:edit']);
  const canTestGateway = hasAccessByCodes(['sms_gateway:test']);
  const operationOptions: any[] = [];
  if (canEditGateway) {
    operationOptions.push('edit');
  }
  if (canTestGateway) {
    operationOptions.push({
      code: 'test',
      text: '测试',
    });
  }
  if (canDeleteGateway) {
    operationOptions.push('delete');
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
      minWidth: 140,
      title: '配置名称',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: Object.entries(PROVIDER_MAP).map(([value, label]) => ({
          color: 'blue',
          label,
          value,
        })),
      },
      field: 'provider',
      minWidth: 100,
      title: '网关提供商',
    },
    {
      field: 'sign_name',
      minWidth: 100,
      title: '短信签名',
    },
    {
      field: 'region',
      minWidth: 100,
      title: '区域',
    },
    {
      field: 'rate_limit',
      title: '限速/分钟',
      width: 100,
    },
    {
      field: 'daily_limit',
      title: '每日上限',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '默认', value: 'default' },
          { color: 'success', label: '启用', value: 'enabled' },
          { color: 'default', label: '禁用', value: 'disabled' },
        ],
      },
      field: 'status_key',
      title: '状态',
      width: 90,
    },
    {
      field: 'description',
      minWidth: 160,
      showOverflow: true,
      title: '描述',
    },
    {
      field: 'created_at',
      title: '创建时间',
      width: 170,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '配置名称',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: operationOptions,
      },
      field: 'operation',
      fixed: 'right',
      title: $t('system.user.operation'),
      width: 180,
    },
  ];
}
