# 移动应用端架构描述

移动应用使用基于 Expo 52.0 的 React Native 技术栈搭建，采用分层设计，由表示层、状态管理层和 API 服务层组成。表示层通过 expo-router 4.0 实现基于文件系统的路由方案，形成(tabs)和(auth)两大导航区域，通过 Stack 和 Tab 导航管理页面流转；页面主要基于 React Native 原生组件构建，任务列表、任务详情、用户组管理、个人中心等功能通过组件树结构组织；lucide-react-native 提供统一图标系统。

状态管理上使用 Zustand 库以 Store 方式维护应用状态，按功能域划分为 tasksStore、groupsStore、authStore 和 adminTasksStore，每个 Store 负责各自领域数据的获取、存储和更新；Store 与页面组件紧密耦合，在组件挂载时触发数据加载流程。API 服务层封装了任务、用户组、认证等独立 API 模块，使用统一的 success-data-error 请求响应模式，目前多为模拟实现。主要流程包括任务签到（GPS 定位、人脸验证、WiFi 连接）、用户组管理和异常申请。虽然组件结构清晰，但存在离线支持不足、状态同步机制简单、大量数据处理性能有待提升等问题。
