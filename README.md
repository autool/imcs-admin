# IMCS 管理端

基于 Vue 3、TypeScript、Ant Design Vue 和 Vue Vben Admin 的基础设施运维管理端。

GitHub 仓库：[autool/imcs-admin](https://github.com/autool/imcs-admin)

## 开发

```bash
corepack enable
pnpm install
pnpm dev:antd
```

默认开发接口为 `http://127.0.0.1:8000/api/v1`，可在 `apps/web-antd/.env.development` 中调整。

## 校验

```bash
pnpm check:type
pnpm build:antd
```

本工程基于 Vben5 开发，继续遵循本目录 `LICENSE` 中的 Vben MIT License，授权内容保持不变。该许可证仅适用于 `admin/`，不覆盖仓库中的 `backend/` 和 `app/`。

## 致谢

感谢安天科技集团对 IMCS 项目研发、实践验证与应用落地所提供的支持。
