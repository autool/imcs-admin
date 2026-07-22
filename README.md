<p align="center">
  <img src="./docs/assets/imcs-logo.svg" width="128" height="128" alt="IMCS Logo">
</p>

<h1 align="center">IMCS Admin</h1>

<p align="center">
  面向基础设施与信息化运维场景的现代化管理前端
</p>

<p align="center">
  <a href="https://github.com/autool/imcs-admin"><img src="https://img.shields.io/badge/GitHub-autool%2Fimcs--admin-181717?logo=github" alt="GitHub"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vben_Admin-5.7-0969da" alt="Vben Admin 5.7">
</p>

IMCS Admin 基于 Vue 3、TypeScript、Ant Design Vue 和 Vue Vben Admin 5 开发，为资产、告警、网络、工单、任务和系统管理提供统一的 Web 操作界面。

## 功能特性

- 基础设施资产：服务器、机柜、区域、设备状态和硬件信息管理。
- 告警运营：告警策略、告警处置、优先级分组和通知联动。
- 网络资源：业务 IP、VLAN、VLAN 分组及变更记录管理。
- 工作协同：工单、工作流、任务执行和计划任务管理。
- 权限与安全：用户、角色、菜单、部门、会话、密码策略和 MFA。
- 统一体验：国际化、主题配置、动态路由、权限控制和响应式布局。

## 技术栈

| 类型       | 技术                                           |
| ---------- | ---------------------------------------------- |
| 前端框架   | Vue 3、TypeScript、Vite                        |
| 管理框架   | Vue Vben Admin 5.7                             |
| 组件体系   | Ant Design Vue                                 |
| 状态与路由 | Pinia、Vue Router                              |
| 工程管理   | pnpm Workspace、Turbo、Lefthook                |
| 质量检查   | ESLint、Oxlint、Stylelint、Vue TSC、Commitlint |

## 快速开始

### 环境要求

- Node.js `22.22.0`，或满足项目 `engines` 声明的版本。
- pnpm `10.0.0` 及以上版本。

### 安装与启动

```bash
corepack enable
pnpm install
pnpm dev:antd
```

开发服务默认运行在 `http://localhost:5666`，后端接口默认为 `http://127.0.0.1:8000/api/v1`。接口地址可在 `apps/web-antd/.env.development` 中调整。

### 质量检查与构建

```bash
pnpm lint
pnpm check:type
pnpm build:antd
```

## 关联仓库

| 项目 | 仓库 | 授权方式 |
| --- | --- | --- |
| 管理前端 | [autool/imcs-admin](https://github.com/autool/imcs-admin) | Vben MIT License |
| Flutter 客户端 | [autool/imcs-app](https://github.com/autool/imcs-app) | 商业授权 |
| 后端服务 | [autool/imcs-backend](https://github.com/autool/imcs-backend) | 商业授权 |

## 使用用户

<p>
  <a href="https://www.antiy.cn/" title="安天科技集团">
    <img src="https://www.antiy.cn/images/logo.png" height="44" alt="安天科技集团">
  </a>
</p>

- 安天科技集团

如果你的组织正在使用 IMCS，欢迎通过 Issue 或 Pull Request 补充使用案例。

## 安全政策

请不要通过公开 Issue 披露安全漏洞或敏感信息。漏洞报告方式及支持范围见 [SECURITY.md](./SECURITY.md)。

## 许可证

本工程基于 Vben5 开发，继续遵循 [Vben MIT License](./LICENSE)，原授权内容保持不变。该许可证仅适用于管理前端，不覆盖 IMCS App 和后端项目。

第三方依赖、字体、图片和其他材料继续遵循各自许可证与权利声明。

## 致谢

感谢 [Vue Vben Admin](https://github.com/vbenjs/vue-vben-admin) 社区提供优秀的前端工程基础。

感谢安天科技集团对 IMCS 项目研发、实践验证与应用落地所提供的支持。
