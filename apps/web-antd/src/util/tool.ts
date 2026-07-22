import type { VbenFormProps, VbenFormSchema } from '#/adapter/form';

import { isFunction } from '@vben/utils';

interface DescItem {
  children?: DescItem[];
  component?: any;
  componentProps?: any;
  field: string;
  label?: any;
  span?: number;
}

type DetailFormSchema = VbenFormSchema & {
  detailSpan?: number;
};

export const omit = (obj: any, keysToOmit: string[]) => {
  // 如果 obj 不是对象或者 keysToOmit 不是数组，则直接返回 obj
  if (typeof obj !== 'object' || !Array.isArray(keysToOmit)) {
    return obj;
  }

  // 创建一个新的对象，避免修改原始对象
  const result = {} as any;

  // 遍历 obj 的所有键值对
  for (const key in obj) {
    // 如果当前键不在要忽略的键列表中，则复制到新对象
    if (!keysToOmit.includes(key)) {
      result[key] = obj[key];
    }
  }

  return result;
};
export const get = (object: any, path: string) => {
  // 如果 object 不是对象或者 path 不是字符串，则直接返回 defaultValue
  if (
    typeof object !== 'object' ||
    object === null ||
    typeof path !== 'string'
  ) {
    return undefined;
  }

  // 将路径字符串转换为数组
  const pathArray = path.split('.').filter(Boolean); // 过滤掉空字符串
  let current = object;

  // 遍历路径数组
  for (const element of pathArray) {
    // 如果当前层级不是对象或没有对应的键，则返回 defaultValue
    if (
      typeof current !== 'object' ||
      current === null ||
      !(element in current)
    ) {
      return undefined;
    }
    // 更新 current 到下一层级
    current = current[element];
  }

  // 返回最终找到的值
  return current;
};
export const ifDetail = (renderCallbackParams: any): boolean => {
  const schema = renderCallbackParams.schema;
  if (isFunction(schema.ifDetail)) {
    return schema.ifDetail(renderCallbackParams);
  }
  return schema.ifDetail !== false;
};

/**
 * 将表单元数据转换为详情表单
 * @param formOptions
 * @param values
 */
export const schemaToDetailForm = (
  formOptions: VbenFormProps,
  values: any,
): DescItem[] => {
  const group: Array<DescItem> = [];
  const formSchemas = formOptions.schema?.filter((item) => {
    if (item.component === 'Divider') {
      return ifDetail({
        schema: item,
        values,
        model: values,
        field: item.fieldName,
      });
    }
    return true;
  });
  if (!Array.isArray(formSchemas)) return group;
  for (let i = 0; i < formSchemas.length; i++) {
    const item = formSchemas[i] as DetailFormSchema | undefined;
    // 找到分割线
    if (item?.component === 'Divider') {
      group.push({
        field: item.fieldName,
        label: item.label,
        children: [],
      } as unknown as DescItem);
      // 将分割线后面的数据添加到group中
      for (let j = i + 1; j < formSchemas.length; j++) {
        const nextItem = formSchemas[j] as DetailFormSchema | undefined;
        // 找到下面的分割线
        if (nextItem?.component === 'Divider') {
          // 中断
          i = j - 1;
          break;
        } else {
          if (
            ifDetail({
              schema: nextItem,
              values,
              model: values,
              field: item.fieldName,
            })
          ) {
            group[group.length - 1]?.children?.push({
              field: nextItem?.fieldName,
              label: nextItem?.label,
              span: nextItem?.detailSpan || 12,
              component: nextItem?.component,
              componentProps:
                typeof nextItem?.componentProps === 'function'
                  ? nextItem.componentProps(values, {} as any)
                  : nextItem?.componentProps,
            } as DescItem);
          }
        }
      }
    }
  }
  if (group.length > 0) {
    return group;
  }
  return [
    {
      field: 'baseinfo',
      label: '基本信息',
      children: formSchemas
        .filter((item) => {
          return ifDetail({
            schema: item,
            values,
            model: values,
            field: item.fieldName,
          });
        })
        .map((item) => {
          const detailItem = item as DetailFormSchema;
          return {
            field: detailItem.fieldName,
            label: detailItem.label,
            span: detailItem.detailSpan || 12,
            component: detailItem.component,
            componentProps:
              typeof detailItem.componentProps === 'function'
                ? detailItem.componentProps(values, {} as any)
                : detailItem.componentProps,
          } as DescItem;
        }),
    } as DescItem,
  ];
};

// 获取子节点id
export const getChildIds = (record: any) => {
  const ids = [record.id];
  record.children?.forEach((item: any) => {
    ids.push(...getChildIds(item));
  });
  return ids;
};

/**
 * 获取所有叶子节点
 * @param treeData
 */
export const getLeafNodeIds = (treeData: any) => {
  const leafNodeIds: any = [];

  function traverse(node: any) {
    // 如果当前节点没有 children 或 children 是空数组，则它是叶子节点
    if (!node.children || node.children.length === 0) {
      leafNodeIds.push(node.id);
    } else {
      // 否则，递归遍历每个子节点
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  // 遍历树的根节点
  for (const root of treeData) {
    traverse(root);
  }
  return leafNodeIds;
};

/**
 * 获取所有节点id
 * @param treeData
 */
export const getAllNodeIds = (treeData: any) => {
  const allNodeIds: any = [];

  function traverse(node: any) {
    // 收集当前节点的 id
    allNodeIds.push(node.id);

    // 如果当前节点有 children，则递归遍历每个子节点
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  // 遍历树的根节点
  for (const root of treeData) {
    traverse(root);
  }

  return allNodeIds;
};

/**
 * -转大驼峰
 * @param str
 */
export const toPascalCase = (str: any) => {
  // 将连字符或下划线替换为空格，以便后续处理
  const words = str.replaceAll(/[-_]/g, ' ').split(' ');

  // 将每个单词的首字母大写，并将其余部分保持原样
  const pascalCaseWords = words.map((word: any) => {
    if (word) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word;
  });

  // 将处理后的单词拼接成一个新的字符串
  return pascalCaseWords.join('');
};

/**
 * 转-kebab
 */
export const toKebabCase = (str: string) => {
  // 将每个单词的首字母小写，并在单词之间插入连字符
  return str
    .replaceAll(/([A-Z])/g, (match, _p1, offset) => {
      // 如果是第一个字符，直接转为小写
      if (offset === 0) {
        return match.toLowerCase();
      }
      // 否则，在大写字母前加上连字符，并将大写字母转为小写
      return `-${match.toLowerCase()}`;
    })
    .toLowerCase(); // 确保整个字符串都是小写
};

export function getFileNameWithoutExtension(path: string) {
  // 使用正则表达式匹配最后一个 / 后面的所有字符，但不包括最后一个点（.）之后的内容
  const match = path.match(/[^/]+(?=\.[^./]+$|$)/);
  return match ? match[0].replace(/\.[^/.]+$/, '') : null;
}
/**
 * 获取当前时间与给定时间的相对时间描述
 * @param dateString yyyy-MM-dd HH:mm:ss 格式的时间字符串
 * @returns 相对时间字符串，如"3天前"、"2小时前"、"1分钟前"等
 */
export const getRelativeTime = (dateString: string): string => {
  const targetDate = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();
  const absDiffMs = Math.abs(diffMs);

  // 计算各时间单位差值
  const diffSeconds = Math.floor(absDiffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  const suffix = diffMs < 0 ? '后' : '前';

  if (diffMonths > 0) {
    return `${diffMonths}个月${suffix}`;
  }
  if (diffWeeks > 0) {
    return `${diffWeeks}周${suffix}`;
  }
  if (diffDays > 0) {
    return `${diffDays}天${suffix}`;
  }
  if (diffHours > 0) {
    return `${diffHours}小时${suffix}`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes}分钟${suffix}`;
  }
  return `${diffSeconds}秒${suffix}`;
};
