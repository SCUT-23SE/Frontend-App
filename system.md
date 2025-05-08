2.2 技术选型
2.2.1 资源层（Data Access Layer）

    1. 数据库选型：采用 MySQL 8.0 作为核心关系型数据库，支持事务 ACID 特性与高并发读写场景。
    2. 数据访问封装：基于 GORM（Go Object Relational Mapping）框架实现 ORM 层，通过结构体映射、链式查询及事务管理接口，规范化数据操作。
    3. 优化措施：
    (1) 结合复合索引优化高频查询性能（如用户组任务查询）。
    (2) 利用 GORM 的预加载（Preload）机制减少 N+1 查询问题。

2.2.2 业务层（Business Logic Layer）

    1. 服务框架：基于 Gin 框架构建轻量级 RESTful API，支持中间件扩展（JWT 鉴权、请求限流）。
    2. 人脸识别与活体检测：
    (1) 模型优化：对 YOLOv8 模型进行领域适配微调，采用 AdamW 优化器与 Cosine 退火学习率调度策略，结合 CutMix+Mosaic 数据增强技术，在自建数据集上实现 90% mAP@0.5检测精度。
    (2) 活体检测：集成眨眼检测（Eye Blink Detection）与 3D 结构光模拟验证，综合准确率达 90%，有效防御打印照片、视频重放攻击。
    3. 地理围栏校验：
    (1) 调用高德地图 LBS 服务 API，通过 GPS/WiFi 多源定位获取用户坐标，结合 GeoFencing 地理围栏算法实时校验位置合规性（误差半径 ≤10 米）。
    (2) 使用逆地理编码（Reverse Geocoding）解析签到地址详情，并与预设任务区域匹配，生成可视化违规告警日志。

2.2.3 控制层（Controller Layer）

    API 规范与生成：基于 OpenAPI 3.0 标准定义接口契约，通过 oapi-codegen 工具链自动生成请求/响应结构体、路由绑定代码及 Swagger 文档，确保接口一致性。
    请求处理：
    参数校验：集成 go-playground/validator 实现声明式校验规则（如经纬度范围、任务时间有效性）。
    响应标准化：统一封装 HTTP 状态码、业务状态码及错误信息，支持国际化（i18n）错误提示。

2.2.4 表示层（Presentation Layer）

1.  Web 管理端：
    (1) 基础框架：采用 Next.js 结合 TypeScript 开发，使用 Vite 构建。
    (2) 页面组织：实现登录、任务管理、用户组管理、统计分析等功能模块。
    (3) 状态管理：使用 Zustand 简化状态管理。
    (4) UI 实现：基于 ShadcnUI 构建页面，使用 Tailwind CSS 编写样式。
    (5) 数据展示：实现表格数据展示，支持简单的排序和筛选功能。

2.  移动应用端：
    (1) 基础框架：基于 Expo 52.0 (React Native) 构建，支持 iOS/Android 双平台部署。
    (2) 路由架构：采用 expo-router 4.0 实现基于文件系统的路由方案，组织任务、用户组与个人中心三大主要模块。
    (3) 状态管理：
    (a) 使用 Zustand 实现轻量化全局状态管理，按功能领域划分多个独立 Store（任务、用户组）。
    (b) 维护任务列表、签到记录等状态。
    (4) 界面实现：
    (a) 采用原生组件构建界面，使用 React Native 内置组件集。
    (b) 引入 lucide-react-native 图标库，统一视觉风格。
    (c) 支持基本的列表加载状态展示与错误重试机制。
