好的，这是关于当前本地通知系统的文档：

## 本地通知系统文档

### 1. 概述

本通知系统设计为在应用运行时提供本地通知，无需依赖外部推送服务（如 Firebase Cloud Messaging）。它主要用于提醒用户应用内的新任务、任务状态变更以及待处理的审批请求。新增的通知点击跳转功能使用户可以通过点击通知直接跳转到相关内容页面。通过最新的优化，系统还可以根据用户的登录状态管理轮询，并提供友好的网络错误处理。

### 2. 代码实现

通知系统的核心代码位于以下几个文件中：

- **`services/notification-service.ts`**: 包含通知的主要逻辑，如：
  - 请求通知权限 (`requestNotificationPermission`)
  - 设置通知处理器 (`setNotificationHandler`)
  - 创建 Android 通知渠道 (`createNotificationChannels`)
  - 发送具体类型的通知 (如 `sendTaskNotification`, `sendApprovalNotification`)
  - 轮询数据以检测新通知 (`pollUserTasksAndNotify`, `pollAdminActionsAndNotify`)
  - 核心的通知检查逻辑 (`performBackgroundFetch`)
  - **新增的网络错误检测** (`isNetworkError`)
- **`services/notification-tasks.ts`**: 负责启动和管理通知系统，提供以下功能：
  - 初始化通知系统 (`startNotificationSystem`)，主要在应用启动时调用
  - 提供手动检查新通知的功能 (`checkForNotifications`)，可供应用其他部分按需调用
  - 提供发送测试通知的功能 (`sendTestNotification`)
  - **新增的通知点击处理功能** (`handleNotificationResponse`, `setupNotificationResponseListener`)
  - **新增的通知系统资源清理功能** (`cleanupNotificationSystem`)
  - **新增的网络错误提示功能** (`showNetworkErrorMessage`)
- **`stores/notification.ts`**: Zustand store，用于管理通知相关的状态，例如：
  - 通知权限状态 (`permissionStatus`)
  - 通知系统是否初始化 (`isInitialized`)
  - 未读通知数量 (`unreadCount`)
  - 初始化和请求权限的方法
  - **新增的通知响应监听器管理**
  - **新增的轮询状态管理** (`isPolling`, `startPolling`, `stopPolling`)
  - **新增的网络错误状态** (`networkError`, `setNetworkError`)
- **`stores/auth.ts`**: 负责认证相关功能，与通知系统的集成点：
  - 登录成功后启动通知轮询
  - 登出时停止通知轮询
- **`app/_layout.tsx`**: 在应用根布局中初始化通知系统。
- **`app.json`**: 包含通知相关的配置和权限。

### 3. 机制实现

#### 3.1. 初始化流程

1.  **应用启动**: 当应用启动时，在根组件 `app/_layout.tsx` 中，`useEffect` Hook 会调用 `useNotificationStore` 中的 `initialize` 方法。
2.  **权限检查与请求**:
    - `stores/notification.ts` 中的 `initialize` 方法首先会尝试从 `AsyncStorage` 加载之前保存的权限状态。
    - 系统检查用户的登录状态（从 `useAuth` 获取）。
    - 如果权限状态为 `'granted'` 且用户已登录，则启动通知轮询。
    - 如果用户未登录或权限未授予，通知轮询不会启动，直到条件满足。
    - 如果权限状态为 `'undetermined'` 或 `'denied'`，用户可以通过 UI 交互（如设置页面的按钮）触发 `requestPermission` 方法来请求权限。
3.  **通知处理器设置**: 无论用户是否登录，始终设置通知处理器以处理潜在的通知响应。
4.  **Android 渠道创建**: 同样，无论用户是否登录，始终为 Android 设备创建特定的通知渠道。
5.  **通知响应监听器设置**:
    - `setupNotificationResponseListener` 被调用，用于处理用户点击通知的事件。
    - 即使用户未登录，也设置此监听器，以便处理可能存在的历史通知。

#### 3.2. 登录状态与轮询管理

- **登录成功后**:
  - 在 `useAuth.login` 成功后，调用 `useNotificationStore.startPolling`。
  - `startPolling` 方法检查权限状态和登录状态，如果条件满足，则启动通知系统和轮询。
- **登出时**:
  - 在 `useAuth.logout` 中，调用 `useNotificationStore.stopPolling`。
  - `stopPolling` 方法停止轮询定时器，释放相关资源。
- **条件检查**:
  - 轮询只在用户已登录且拥有通知权限时启动。
  - 如果用户未登录，即使有通知权限，也不会启动轮询，避免不必要的资源消耗。

#### 3.3. 网络错误处理

- **错误检测**:
  - `notification-service.ts` 中的 `isNetworkError` 函数用于识别网络错误。
  - 它能识别多种常见的网络错误模式，如 "Network Error"、连接超时等。
- **错误处理流程**:
  - 当 API 调用失败时，系统会检查是否为网络错误。
  - 如果确认是网络错误，会设置 `networkError` 状态为 `true`。
  - 在轮询函数 `poll` 中，检查 `networkError` 状态，如果为 `true`，则显示网络错误提示。
- **用户提示**:
  - 根据平台不同，使用不同的提示方式：
    - Android: 使用 `ToastAndroid` 显示短暂的提示。
    - iOS: 使用 `Alert` 显示对话框提示。
  - 提示频率受限，同一错误信息在短时间内（默认 60 秒）只会显示一次，避免过多打扰用户。
- **登录/注册时的处理**:
  - 在 `useAuth` 的 `login` 和 `register` 方法中，也添加了网络错误检测。
  - 如果检测到网络错误，会显示友好的错误信息，而不是技术性的错误详情。

#### 3.4. 发送通知

- 当 `pollUserTasksAndNotify` 或 `pollAdminActionsAndNotify` 检测到新的任务、任务状态变更或新的审批请求时，它们会调用 `sendTaskNotification` 或 `sendApprovalNotification`。
- 这些发送函数使用 `expo-notifications` 的 `scheduleNotificationAsync` 方法来立即（`trigger: null`）发送一个本地通知。
- 通知内容包括标题、正文和一些附加数据（如任务 ID、通知类型），以便在用户点击通知时进行相应的导航。
- 通过为通知设置 `identifier`，可以避免因重复检测到相同事件而发送重复的通知。

#### 3.5. 任务开始时间的精准通知

- 系统会为即将开始的任务预先调度通知，确保用户在任务开始时能够准确收到提醒。
- 当检测到新任务或任务状态/时间变更时，会通过`scheduleTaskStartNotification`函数调度一个在任务开始时触发的通知。
- 通知触发器使用精确的触发时间，并设置通知类型为`TASK_UPCOMING_START`。
- 当任务状态变更为"进行中"或任务被取消时，会自动取消先前调度的通知，避免重复提醒。
- 所有已调度的通知信息会被存储在`AsyncStorage`中，便于在应用重启后恢复或管理这些通知。
- 这种机制确保了即使在轮询间隔期间，任务开始通知也能准确地在任务开始时触发，提高了通知的时效性。

#### 3.6. 通知点击跳转

- 当用户点击通知时，`handleNotificationResponse`函数会被触发，根据通知的类型和内容决定应该跳转到哪个页面。
- 系统根据通知中的`type`字段来区分不同类型的通知：
  - 对于任务相关通知（`NEW_TASK`、`TASK_STATUS_CHANGE`、`TASK_UPCOMING_START`），用户会被引导到任务详情页。
  - 对于入组申请通知（`JOIN_REQUEST`），用户会被引导到入组申请管理页面。
  - 对于审核申请通知（`AUDIT_REQUEST`），用户会被引导到相应的审核页面或组详情页。
- 通知中的数据（如`taskId`、`groupId`）会被用作路由参数，确保用户能够直接查看相关的具体内容。
- 这种机制极大地提高了用户体验，使用户可以一键直达相关内容，无需手动导航。

### 4. 生命周期

#### 4.1. 应用启动时

1.  `RootLayout` (在 `app/_layout.tsx`) 加载。
2.  `useNotificationStore.initialize()` 被调用。
    - 设置通知处理器。
    - 创建通知渠道 (Android)。
    - 加载本地存储的权限状态。
    - 设置通知响应监听器。
    - 检查用户登录状态，如果已登录且有权限，则调用 `startPolling()`。
3.  如果条件满足，`startPolling()` 会执行：
    - 调用 `startNotificationSystem()` (在 `notification-tasks.ts`)，它会进一步调用 `performBackgroundFetch()`。
    - `performBackgroundFetch()` 拉取最新数据，与本地存储的数据比较，并针对新项目发送本地通知。
    - 对于即将开始的任务，会调度精确的开始时间通知。
    - 更新本地存储的数据。

#### 4.2. 用户登录时

1.  用户提交登录表单，`useAuth.login()` 被调用。
2.  如果登录成功：
    - 更新认证状态和用户信息。
    - 调用 `useNotificationStore.startPolling()`，开始通知轮询。
    - 如果用户没有通知权限，轮询不会启动，但用户可以在设置中授予权限。

#### 4.3. 用户登出时

1.  用户点击登出按钮，`useAuth.logout()` 被调用。
2.  在清除用户认证状态前，调用 `useNotificationStore.stopPolling()`。
3.  `stopPolling()` 停止轮询定时器，防止在用户未登录时继续不必要的 API 调用。

#### 4.4. 应用运行时

- 用户可以与通知相关的 UI 元素交互（例如，在设置页面请求通知权限）。
- 应用可以通过调用 `checkForNotifications()` 来按需检查新通知。
- 如果在轮询过程中检测到网络错误，会向用户显示友好的提示，建议检查网络连接。
- `expo-notifications` 库负责在操作系统层面处理已调度的本地通知的显示。
- 当用户点击通知时，应用会根据通知类型将用户导航到相应的页面。
- 当任务状态或开始时间发生变化时，系统会自动更新相应的调度通知。

#### 4.5. 通知权限变更

- 如果用户通过系统设置更改了应用的通知权限，`expo-notifications` 库通常能够感知到这些变化。然而，当前系统主要依赖于启动时和用户手动请求时的权限检查。

#### 4.6. 应用退出或组件卸载时

- 调用 `useNotificationStore.cleanup()` 可以清理通知系统资源。
- `cleanup()` 首先调用 `stopPolling()`，然后执行 `cleanupNotificationSystem()` 移除通知响应监听器。
- 这样可以防止内存泄漏和不必要的后台操作。

### 5. 配置

相关的配置主要在 `app.json` 文件中：

- **`plugins`**: 包含了 `expo-notifications` 插件及其基本配置（如图标和颜色）。
  ```json
  [
    "expo-notifications",
    {
      "icon": "./assets/images/notification-icon.png",
      "color": "#3B82F6"
    }
  ]
  ```
- **`android.permissions`**: 列出了应用所需的 Android 权限，包括：
  - `android.permission.VIBRATE`
  - `android.permission.POST_NOTIFICATIONS` (Android 13+)
- **`notification`**: 全局通知行为配置，如默认图标、颜色、Android 上的折叠标题以及 iOS 前台显示行为。

### 6. 总结

当前的通知系统是一个纯粹的本地通知解决方案，它在应用运行时通过轮询后端数据来检测和发送通知。它不依赖任何外部推送服务或后台任务，因此其行为完全局限于应用在前台或（在某些操作系统上）最近在后台运行的场景。这种设计简化了部署和维护，特别适合不需要复杂后台推送和离线通知能力的场景。

最新的优化确保了系统在资源利用和用户体验方面的改进：

1. **登录状态感知**：只在用户登录时启动通知轮询，避免了在未登录状态下不必要的资源消耗。

2. **网络错误处理**：当检测到网络连接问题时，系统会显示友好的错误提示，而不是静默失败或显示技术性错误信息，提升了用户体验。

这些优化使通知系统更加健壮、高效，同时提供了更好的用户体验。
