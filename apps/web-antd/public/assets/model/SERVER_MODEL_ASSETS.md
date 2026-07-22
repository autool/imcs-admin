# 服务器型号静态资源清单

本目录下服务器型号图统一为透明背景 PNG：

- 型号图：`1920x1080`
- U 位图：`1842x346`，必须是纯正脸机柜视图，只表现前面板，不允许看到顶部、后部、侧后方或透视深度
- 型号图视角：可接近正面并允许轻微俯视，保持与 `huawei-2288h-v5.png` 的展示风格一致
- U 位图基准：以 `huawei-2288h-v5_u.png` 为正确样板，要求正脸、透明背景、机箱比例稳定

## 已落地资源

| 品牌 | 型号 | 型号图 | U 位图 | 来源类型 | 参考说明 |
| --- | --- | --- | --- | --- | --- |
| Huawei | 2288H V5 | `huawei-2288h-v5.png` | `huawei-2288h-v5_u.png` | existing_real_asset | 仓库原有基准图；U 位图是正脸透明图，可作为 U 位图验收样板 |
| Huawei | 1288H V3 | `huawei-1288h-v3.png` | `huawei-1288h-v3_u.png` | generated_from_reference | 参考 Huawei RH1288 V3 / FusionServer RH1288 V3 前面板资料生成，按 1U 8x2.5 单排前面板落地 |
| Huawei | 1288H V5 | `huawei-1288h-v5.png` | `huawei-1288h-v5_u.png` | generated_from_reference | 按 FusionServer 1288H V5 1U、单排盘位、V5 前面板风格生成 |
| Huawei | 2488H V5 | `huawei-2488h-v5.png` | `huawei-2488h-v5_u.png` | generated_from_reference | 参考 Huawei FusionServer 2488H V5 公开产品图和华为支持资料生成，按 2U 高密 2.5 小盘位前面板落地 |
| Huawei | TaiShan 2280 V2 | `huawei-taishan-2280-v2.png` | `huawei-taishan-2280-v2_u.png` | generated_from_reference | 参考 Huawei TaiShan 2280 V2 / TaiShan 200 Model 2280 公开配置资料生成，按 2U 25x2.5 高密前面板样例落地 |
| Huawei | 2288H V7 | `huawei-2288h-v7.png` | `huawei-2288h-v7_u.png` | generated_from_reference | 库中存在华为品牌的历史目录项；按 xFusion FusionServer 2288H V7 2025 用户手册 24x2.5 正脸结构和产品图生成，Huawei 型号图使用无 xFusion 标识的中性版本 |
| Dell | PowerEdge R740 XD | `dell-r740xd.png` | `dell-r740xd_u.png` | existing_real_asset | 仓库原有真实图 |
| Dell | PowerEdge R640 | `dell-poweredge-r640.png` | `dell-poweredge-r640_u.png` | generated_from_reference | 参考 Dell 官方 PowerEdge R640 前视资料生成，按 1U 8x2.5 前面板/U 位图规范落地 |
| Dell | PowerEdge R740 | `dell-poweredge-r740.png` | `dell-poweredge-r740_u.png` | generated_from_reference | 参考 PowerEdge R740 8SFF 前面板资料生成 |
| Dell | PowerEdge R750 | `dell-poweredge-r750.png` | `dell-poweredge-r750_u.png` | generated_from_reference | 参考 PowerEdge R750 8SFF 前面板资料生成 |
| Dell | PowerEdge R940xa | `dell-poweredge-r940xa.png` | `dell-poweredge-r940xa_u.png` | generated_from_reference | 参考 Dell PowerEdge R940xa 官方手册 32x2.5 前视资料与真实商品图生成；U 位图为 4U 正脸前面板 |
| Dell | PowerEdge R650 XS | `dell-poweredge-r650-xs.png` | `dell-poweredge-r650-xs_u.png` | generated_from_reference | 参考 PowerEdge R650xs 1U、8SFF、双通风格栅结构生成 |
| Dell | PowerEdge R730 XD | `dell-poweredge-r730-xd.png` | `dell-poweredge-r730-xd_u.png` | generated_from_reference | 参考 PowerEdge R730xd 24SFF 前面板资料生成 |
| Dell | PowerEdge R720 XD | `dell-poweredge-r720-xd.png` | `dell-poweredge-r720-xd_u.png` | generated_from_reference | 参考 Dell PowerEdge R720xd 官方 24 x 2.5 英寸前面板资料与 IT Creations R720xd 实拍前脸生成，U 位图为 12x2 总 24 盘位正脸透明图 |
| Dell | PowerEdge R730 | `dell-poweredge-r730.png` | `dell-poweredge-r730_u.png` | generated_from_reference | 参考 PowerEdge R730 8SFF 前面板资料生成 |
| Dell | PowerEdge R510 | `dell-poweredge-r510.png` | `dell-poweredge-r510_u.png` | generated_from_reference | 参考 PowerEdge R510 12LFF 老款前面板资料生成 |
| xFusion | 2288H V7 | `xfusion-2288h-v7.png` | `xfusion-2288h-v7_u.png` | generated_from_reference | 参考 xFusion FusionServer 2288H V7 2025 用户手册 Figure 1-6 和官方产品图生成，按 2U 24x2.5 前面板落地 |
| Inspur | NF5180M5 | `inspur-nf5180m5.png` | `inspur-nf5180m5_u.png` | generated_from_reference | 参考浪潮 NF5180M5 官方白皮书和用户手册前视资料生成，按 1U 10x2.5 单排前面板落地 |
| Inspur | NF5280M4 | `inspur-nf5280m4.png` | `inspur-nf5280m4_u.png` | generated_from_reference | 参考浪潮 NF5280M4 公开产品资料生成，按 2U 25x2.5 高密前面板样例落地 |
| Inspur | NF5280M5 | `inspur-nf5280m5.png` | `inspur-nf5280m5_u.png` | generated_from_reference | 参考浪潮 NF5280M5 官方资料与前面板公开图生成，按 2U 24SFF 正脸/U 位图规范落地 |
| Inspur | NF5466M5 | `inspur-nf5466m5.png` | `inspur-nf5466m5_u.png` | generated_from_reference | 参考浪潮 NF5466M5 公开产品资料和前视图生成，按 4U 前置可见 24x3.5 LFF 前面板样例落地 |
| Inspur | NF8260M5 | `inspur-nf8260m5.png` | `inspur-nf8260m5_u.png` | generated_from_reference | 型号图基于 ServeTheHome NF8260M5 真实前视图处理，U 位图按同一 2U 24x2.5 竖向盘位结构生成正脸透明图 |
| Supermicro | SYS-7049GP-TRT | `supermicro-sys-7049gp-trt.png` | `supermicro-sys-7049gp-trt_u.png` | generated_from_reference | 参考 Supermicro 官方 SYS-7049GP-TRT 产品页、front/angle 图和 QRG 机架安装说明生成；U 位图按 4U rackmount 方向、8x3.5 热插拔盘位正脸透明图落地 |
| THTF | Chaoqiang K620 series | `thtf-chaoqiang-k620-series.png` | `thtf-chaoqiang-k620-series_u.png` | generated_from_reference | 参考鲲鹏社区 THTF 超强 K620 2U 双路服务器资料生成，U 位图为 2U 正脸前面板 |

## 参考登记

| 品牌 | 型号 | 参考来源 | 参考结论 |
| --- | --- | --- | --- |
| Huawei | 2288H V5 | Huawei Support `2288H V5` 产品资料；`Huawei FusionServer 2288H V5 Technical White Paper` | 2U 机架服务器，前面板存在 8x2.5、12x3.5、24x2.5、25x2.5 等形态；当前 `huawei-2288h-v5_u.png` 按 12x3.5 正脸前面板作为 U 位图样板 |
| Huawei | 1288H V3 | Huawei RH1288 V3 / FusionServer RH1288 V3 产品资料与前面板公开资料 | 1U 双路机架服务器，公开资料包含 8 x 2.5 英寸和 4 x 3.5 英寸前置硬盘形态；当前资源按 8SFF 正脸前面板样例生成，避免与 1288H V5 资源混用 |
| Huawei | 1288H V5 | Huawei FusionServer 1288H V5 产品资料与前面板公开资料 | 1U 机架服务器，当前资源按 1U 单排小盘位前面板生成；后续如替换必须保持 1U 正脸比例 |
| Huawei | 2488H V5 | Huawei Support `FusionServer 2488H V5` 产品资料；公开产品图显示 `2488 V5` 前面板；StorageServer `Original Huawei 2488H V5 Intel Xeon 2U Rack Server` 商品图 | 2U 四路机架服务器，资料和公开图显示高密 2.5 英寸前置盘位形态；当前资源按 24 x 2.5 英寸 SFF 正脸前面板样例生成，保留左右 I/O/状态竖条和 `2488 V5` 标识 |
| Huawei | TaiShan 2280 V2 | Huawei Support `TaiShan 200 Server Model 2280` / `Panels` 文档；ITPrice `TaiShan 2280 V2` 配置项公开资料 | 2U 鲲鹏机架服务器，公开资料包含 12 x 3.5、24 x 2.5、25 x 2.5、8SAS/SATA + 12NVMe 等前面板；当前资源按 25 x 2.5 英寸 SFF 正脸前面板样例生成 |
| Huawei | 2288H V7 | xFusion `FusionServer 2288H V7 Server User Guide` Issue 10 (2025-03-31)；xFusion 官方产品页 `FusionServer 2288H V7` 产品图 | 库中存在华为品牌的 2288H V7 历史目录项；当前资源按同型号 24 x 2.5 英寸 SFF 正脸前面板生成，U 位图来自手册 Figure 1-6 去除标注线后透明化，型号图按同结构生成无 xFusion 标识的中性版本 |
| Dell | PowerEdge R740 XD | Dell EMC PowerEdge R740xd Installation and Service Manual `Front view of the system`；Dell 官方手册列出的 24x2.5 与 12x3.5 前面板 | 当前 `dell-r740xd_u.png` 按 12x3.5 LFF 正脸前面板落地，`dell-r740xd.png` 为同配置型号图 |
| Dell | PowerEdge R640 | Dell EMC PowerEdge R640 Installation and Service Manual `Front view of the system` | 1U 机架服务器，官方手册包含 8x2.5、4x3.5、10x2.5 前面板；当前资源按 8x2.5 正脸/U 位图规范生成 |
| Dell | PowerEdge R740 | Dell EMC PowerEdge R740 Installation and Service Manual `Front view of the system` | 2U 机架服务器，当前资源按 8x2.5 前置硬盘 + 双通风格栅前面板生成 |
| Dell | PowerEdge R750 | Dell EMC PowerEdge R750 Installation and Service Manual `Front view of the system` | 2U 机架服务器，当前资源按 8x2.5 前置硬盘 + 双通风格栅前面板生成 |
| Dell | PowerEdge R940xa | Dell EMC PowerEdge R940xa Installation and Service Manual `Front view of 32 x 2.5-inch drive system`；Express Computer Systems R940xa 正面商品图 | 4U GPU 加速机架服务器，官方资料明确 32 x 2.5 英寸前置盘位；当前型号图为轻微俯视产品图，U 位图为正交正脸 32SFF 前面板 |
| Dell | PowerEdge R650 XS | Dell EMC PowerEdge R650xs Installation and Service Manual `Front view of the system` | 1U 机架服务器，官方手册包含 4x3.5、8x2.5、10x2.5 前面板；当前资源按 8x2.5 正脸形态落地 |
| Dell | PowerEdge R730 XD | Dell PowerEdge R730xd Owner's Manual / Installation and Service Manual 前面板资料 | 2U 机架服务器，当前资源按 24x2.5 SFF 正脸前面板生成 |
| Dell | PowerEdge R720 XD | Dell PowerEdge R720xd Owner's Manual / Installation and Service Manual 前面板资料；IT Creations R720xd 2.5 英寸机型实拍前脸与产品图 | 2U 机架服务器，官方资料确认 2.5 英寸 R720xd 前面板为 24 个热插拔盘位；当前 U 位图按 12 列 x 2 行、总 24 个 2.5 英寸盘位正脸透明图落地，型号图基于同一 exact SKU 实拍角度处理 |
| Dell | PowerEdge R730 | Dell PowerEdge R730 Owner's Manual / Installation and Service Manual 前面板资料 | 2U 机架服务器，当前资源按 8x2.5 SFF + 双通风格栅前面板生成 |
| Dell | PowerEdge R510 | Dell PowerEdge R510 Hardware Owner's Manual 前面板资料 | 2U 老款机架服务器，当前资源按 12x3.5 LFF 正脸前面板生成 |
| xFusion | 2288H V7 | xFusion `FusionServer 2288H V7 Server User Guide` Issue 10 (2025-03-31) Figure 1-6；xFusion 官方产品页 `2288H-V7-1.png` | 2U 机架服务器，手册列出 8/12/16/24/25 等多种前面板；当前资源按 24 x 2.5 英寸 SFF 前面板落地，U 位图是纯正脸透明图，不使用带顶部透视的型号图缩放 |
| Inspur | NF5180M5 | Inspur NF5180M5 Technical White Paper；Inspur NF5180M5 User Manual `Front view` / `10 x 2.5-inch drive system` | 1U 双路机架服务器，资料显示 10 x 2.5 英寸前置热插拔硬盘形态；当前资源按单排 10SFF 正脸前面板样例生成 |
| Inspur | NF5280M4 | Inspur NF5280M4 产品资料；NF5280M4 product brief / white paper 公开资料 | 2U 双路机架服务器，公开资料列出前置最高 25 x 2.5 英寸热插拔硬盘，也支持 12 x 3.5 英寸配置；当前资源按 25SFF 正脸前面板样例生成 |
| Inspur | NF5280M5 | Inspur NF5280M5 产品资料与前面板公开资料 | 2U 机架服务器，当前资源按 24x2.5 SFF 正脸前面板生成 |
| Inspur | NF5466M5 | Inspur NF5466M5 产品资料、技术白皮书和公开前视图 | 4U 存储优化服务器，资料显示整机可支持 36/44 个 3.5 英寸盘位组合；当前 U 位图按前面板可见的 24 x 3.5 英寸 LFF 热插拔盘位样例生成，不表示后置/内部盘位总数 |
| Inspur | NF8260M5 | Inspur NF8260M5 产品资料；ServeTheHome `Inspur Systems NF8260M5 4P OCP Server Review` 前视图 | 2U 四路机架服务器，STH 真实前视图显示 24 个前置 2.5 英寸热插拔盘位，采用单排竖向载架；当前型号图由真实前视图去背景处理，U 位图基于该前脸结构生成无顶盖正脸图 |
| Supermicro | SYS-7049GP-TRT | Supermicro 官方产品页 `SuperWorkstation SYS-7049GP-TRT`；官方图片 `7049GP-TRT_front.jpg`、`7049GP-TRT_angle.jpg`；Quick Reference Guide `QRG-2045_SYS-7049GP-TRT` | 官方页面定义为 `4U Rackmountable / Tower`，QRG 说明机架安装时需旋转存储模块；当前型号图按官方 angle 图结构生成，U 位图按 rackmount 方向生成 4U 正脸透明图，保留 8 x 3.5 英寸热插拔盘位和前置 I/O/通风面板 |
| THTF | Chaoqiang K620 series | 鲲鹏社区 `Powered by Kunpeng 硬件专区 - THTF 超强 K620` 产品资料 | 2U 双路鲲鹏 920 服务器，资料列出 16 x 3.5 英寸或 27 x 2.5 英寸扩展形态；当前资源按公开产品图中的 2U 12 个大盘位/蜂窝前面板参考生成，U 位图必须保持正脸透明 |

## 维护要求

新增型号资源时必须满足：

1. 优先使用官方或可信来源真实图。
2. 找不到高质量真实图时，必须先按具体型号查官方手册、产品页、前面板照片或可信资料，再按该型号真实前面板结构生成；不允许用其它型号直接冒充，也不允许把一个生成图复制给多个型号。
3. 生成图必须保持本目录统一透明背景；型号图按型号图视角，U 位图按纯正脸视角分别制作，不能混用。
4. 落库前必须校验图片文件存在、尺寸正确、背景透明。
5. 型号图可以轻微俯视；U 位图只能使用正脸图，不能直接由型号图缩放替代。
6. 每个新增或替换资源必须在本文档记录具体参考型号和参考来源摘要；生成图要写明是基于哪个具体型号的前面板资料生成。
7. 每个已落地型号必须在 `SERVER_MODEL_ASSET_QUALITY_GATES.json` 的 `releasedAssets` 中登记结构约束，至少包含来源类型、U 位图视角和前面板布局。
8. 被 `SERVER_MODEL_ASSET_QUALITY_GATES.json` 标记为 blocked 的型号，必须先满足门禁中的释放条件并移除 blocked 状态，不能直接把图片或前端映射加进目录。
9. 补充或替换资源后必须执行 `pnpm run check:server-assets`，该命令会同时校验图片规格、本文档清单、质量门禁和 `071_server_model_static_assets.sql` 落库迁移引用。

## 待核型号

以下型号在库中存在，但公开资料与型号命名不完全一致，补资源前必须先确认真实型号，不能用相近型号冒充：

- Supermicro `SYS-1029UX-TN10RT+`：未找到 Supermicro 官方精确 SKU；候选纠偏项为官方 `SYS-1029U-TN10RT`（1U 10 盘位当前代）或 `SYS-1028U-TN10RT+`（上一代 plus 后缀 1U 10 盘位），必须先用 BMC/铭牌/采购资料确认真实型号，不能按 `SYS-1029UX` LL 系列或其它相近型号配图。
- Supermicro `SYS-6049U-TR4`：未找到 Supermicro 官方精确 SKU；候选纠偏项为官方 `SYS-6029U-TR4`（2U 12 x 3.5 双路）或 `SYS-2049U-TR4`（2U 24 x 2.5 四路），两者产品线和盘位布局不同，必须先确认 CPU 数、盘位和铭牌后再绑定资源。
- Supermicro `SYS-6049U-TR4+`：未找到 Supermicro 官方精确 SKU；暂不使用 `SYS-6029U-TR4` / `SYS-2049U-TR4` 图片替代，除非拿到官方别名或现网纠偏结果。
- Supermicro `SYS-6049U-TR4N+`：未找到 Supermicro 官方精确 SKU；`N+` 后缀可能暗示网络/存储变体，不能从 `SYS-6029U-TR4` 或 `SYS-2049U-TR4` 外推，需确认是否为现网录入型号、私有 SKU 或 Supermicro 官方型号别名。
- Rack `RackServer RS1120`、`RackServer RS1220+`、`RackServer RS2220`、`RackServer RS2220+`、`RackServer RS3410`：未找到与 `Rack` 品牌和 `RackServer` 型号完全匹配的权威公开资料，命名接近 NAS/机架设备；`RS1220+` 的候选纠偏项为 Synology 官方 `RackStation RS1221+`，`RS3410` 的候选纠偏项为 Synology 官方 `FlashStation FS3410`，但品牌和前缀均不一致，只能作为 BMC/铭牌/采购资料核验方向，不能直接配图。
- 超威 `Pro 3050 G-Series`、`Pro 3050 G2`、`Pro 5 1200 G-Series`、`Pro 5 1200 G2`、`Pro 7 1200 G-Series`：未找到与 `超威` 品牌和这些 `Pro` 型号完全匹配的权威服务器资料，需先确认 `超威` 真实厂商、产品线和是否为私有/OEM SKU。

## 目录覆盖核查

2026-06-23 只读核查 `server_brand_models`：型号目录共 38 个，已配置型号图与 U 位图 12 个，缺少静态资源路径 26 个。
2026-06-24 已补充 THTF `Chaoqiang K620 series`、Dell `PowerEdge R940xa`、Dell `PowerEdge R720 XD`、Huawei `1288H V3`、Huawei `2488H V5`、Huawei `TaiShan 2280 V2`、Huawei `2288H V7`、Inspur `NF5180M5`、Inspur `NF5280M4`、Inspur `NF5466M5`、Inspur `NF8260M5`、Supermicro `SYS-7049GP-TRT` 前端静态资源与迁移引用；在执行迁移前不直接更新现网数据。资源清单当前覆盖 24 个型号，若迁移全部执行后目录缺口预计剩余 14 个。

后续补资源优先级：

1. Supermicro 现网型号需先完成官方 SKU 核验或数据纠偏，不能用相近机型冒充：`SYS-1029UX-TN10RT+`、`SYS-6049U-TR4`、`SYS-6049U-TR4+`、`SYS-6049U-TR4N+`。
2. Rack 和超威目录项需要先确认厂商/产品线真实归属，并按 `SERVER_MODEL_ASSET_QUALITY_GATES.json` 的 blocked 条件放行：`RackServer RS1120`、`RackServer RS1220+`、`RackServer RS2220`、`RackServer RS2220+`、`RackServer RS3410`、`Pro 3050 G-Series`、`Pro 3050 G2`、`Pro 5 1200 G-Series`、`Pro 5 1200 G2`、`Pro 7 1200 G-Series`。

补图前必须按具体型号查官方或可信参考资料；如果使用生成图，也必须基于该型号真实前面板结构生成，不能复用其它型号外观。
