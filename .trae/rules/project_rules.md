## Project Architecture

Vue Vben Admin 是一个基于 Vue 3 的后台管理系统模板，采用 Turborepo 管理 monorepo 架构：

- **Core packages** (`packages/@core/`): 基础 UI 组件和功能
  - `design`, `icons`, `shared`, `typings`: 基础设计系统和类型定义
  - `ui-kit`: UI 组件库 (form-ui, layout-ui, menu-ui, popup-ui, shadcn-ui, tabs-ui)
  - `composables`, `preferences`: Vue 组合式函数和配置管理

- **Effect packages** (`packages/effects/`): 业务功能模块
  - `access`: 权限控制
  - `common-ui`: 通用 UI 组件
  - `hooks`: 业务钩子函数
  - `layouts`: 布局组件
  - `plugins`: 插件系统
  - `request`: HTTP 请求封装

- **Applications** (`apps/web-antd`): Ant Design Vue 版本，包含完整的后台管理系统功能
  - `src`: 应用源代码
    - `api`: API 接口定义和实现
    - `assets`: 静态资源 (图片、字体等)
    - `components`: 业务组件
    - `config`: 应用配置
    - `layouts`: 布局组件
    - `locales`: 多语言配置
    - `plugins`: 插件系统
    - `router`: 路由配置
    - `store`: 状态管理
    - `styles`: 全局样式
    - `utils`: 工具函数
    - `views`: 页面组件
  - `public`: 静态资源

- **Internal tools** (`internal/`): 开发工具和配置
  - 代码规范配置 (eslint, prettier, stylelint, commitlint)
  - 构建工具 (vite-config, tailwind-config, tsconfig)
  - 实用工具 (node-utils)

## 常用开发命令

### 包管理器

- 使用 `pnpm` 作为包管理器 (版本 >=9.12.0)
- Node.js 版本要求 >=20.10.0

### 开发服务

```bash

# 运行应用
pnpm dev:antd    # Ant Design 版本
```

### 构建命令

```bash

# 构建应用
pnpm build:antd

# 构建分析
pnpm build:analyze
```

### 代码质量检查

```bash
# 完整检查 (包含循环依赖、依赖检查、类型检查、拼写检查)
pnpm check

# 分别运行检查
pnpm check:circular  # 循环依赖检查
pnpm check:dep       # 依赖检查
pnpm check:type      # TypeScript 类型检查
pnpm check:cspell    # 拼写检查

# 代码规范
pnpm lint           # ESLint 检查
pnpm format         # 代码格式化

# 单独类型检查
pnpm typecheck      # 所有包的类型检查
```

### 测试命令

```bash
# 单元测试
pnpm test:unit

# E2E 测试
pnpm test:e2e
```

### 其他工具命令

```bash
# 清理
pnpm clean           # 清理构建产物和 node_modules
pnpm reinstall       # 重新安装依赖

# 提交规范
pnpm commit          # 使用 czg 进行规范化提交

# 依赖更新
pnpm update:deps     # 更新依赖包
```

## 技术栈和工具

- **核心框架**: Vue 3 + TypeScript + Vite
- **状态管理**: Pinia + pinia-plugin-persistedstate
- **路由**: Vue Router 4 with 动态路由权限
- **UI 框架**: 支持 Ant Design Vue, Element Plus, Naive UI
- **样式**: TailwindCSS + PostCSS
- **表单**: VeeValidate + Zod 验证
- **HTTP**: Axios + 请求/响应拦截器
- **图标**: Iconify + Lucide Vue Next
- **国际化**: Vue I18n
- **构建工具**: Vite + Turbo (monorepo 构建)
- **代码规范**: ESLint + Prettier + Stylelint + Commitlint
- **测试**: Vitest + Playwright
- **开发工具**: Vue DevTools + TypeScript

## 重要约定

1. **路径别名**: 在应用中使用 `#/*` 映射到 `./src/*`
2. **工作空间依赖**: 内部包使用 `workspace:*` 依赖声明
3. **提交规范**: 遵循 Angular 提交规范 (feat/fix/docs/style/refactor/test/chore)
4. **分支命名**: 功能分支使用 `feat/xxxx` 格式
5. **目录结构**:
   - 页面组件放在 `src/views/` 下
   - 布局组件在 `src/layouts/`
   - API 封装在 `src/api/`
   - 路由配置在 `src/router/`
   - 状态管理在 `src/store/`
6. **组件命名**: 使用 PascalCase，文件名使用 kebab-case
7. **多 UI 框架支持**: 通过适配器模式支持不同 UI 组件库

## 调试和开发

- 本地开发推荐使用 Chrome 80+ 浏览器
- 支持现代浏览器，不支持 IE
- 使用 Vue DevTools 进行组件调试
- 支持 TypeScript 严格模式
- 集成 ESLint + Prettier 实时代码检查
