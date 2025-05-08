# 请求封装库使用说明

这个请求封装库提供了与实训打卡系统后端 API 交互的功能，包括了 token 持久化、自动刷新和统一的错误处理。

## 特性

- 基于 Axios 的封装，提供简洁的 API 调用方式
- 计划使用存储方式保存 token（目前需要实现）
- 处理认证错误（401 状态码）
- 统一的异常处理和错误提示
- 支持各类打卡系统 API 的调用

## 安装依赖

确保已安装以下依赖：

```bash
npm install axios expo-constants
# 同时根据选择的存储方式安装对应依赖：
# - AsyncStorage: npm install @react-native-async-storage/async-storage
# - SecureStore: npm install expo-secure-store
# - EncryptedStorage: npm install react-native-encrypted-storage
```

## 待实现功能

以下功能在代码中被标记为 TODO，需要根据项目需求进行实现：

1. Token 存储逻辑 - 在 client.ts 中的 getToken、saveToken、clearToken 函数
2. 登录失败后的重定向逻辑
3. 全局错误提示 UI 组件
4. 错误页面导航逻辑

## 基本使用

### 导入 API 实例

```typescript
import {
  authApi,
  usersApi,
  checkinRecordsApi,
  checkinTasksApi,
  groupsApi,
  statisticsApi,
  auditRequestsApi,
  exportApi,
  faceApi,
} from '../request';
```

### 用户登录

```typescript
import { login, logout } from '../request';

// 登录
try {
  const userData = await login('username', 'password');
  console.log('登录成功:', userData);
} catch (error) {
  // 错误会被统一处理
  console.error('登录失败');
}

// 注销
await logout();
```

### API 调用示例

```typescript
import { checkinRecordsApi, usersApi } from '../request';
import { handleApiError } from '../request/errorHandler';

// 获取打卡记录
try {
  const records = await checkinRecordsApi.checkinRecordsGet();
  console.log('打卡记录:', records.data);
} catch (error) {
  // 错误会被拦截器自动处理，这里可以添加额外的业务逻辑
}

// 获取用户信息
try {
  const userInfo = await usersApi.usersIdGet({ id: 123 });
  console.log('用户信息:', userInfo.data);
} catch (error) {
  // 错误会被拦截器自动处理
}
```

## 异常处理

请求封装提供了统一的异常处理机制。当 API 请求发生错误时，会自动处理常见的错误情况：

1. 401 认证错误 - 清除 token，并提示用户重新登录
2. 网络连接错误 - 显示网络错误提示
3. 服务器错误 - 根据状态码显示相应的错误信息

你也可以手动处理特定的错误：

```typescript
import {
  handleApiError,
  isNetworkError,
  isAuthError,
} from '../request/errorHandler';

try {
  const response = await someApi.someEndpoint();
  // 处理成功响应
} catch (error) {
  // 检查特定类型的错误
  if (isNetworkError(error)) {
    console.log('网络错误，请检查您的连接');
  } else if (isAuthError(error)) {
    console.log('认证错误，需要重新登录');
  } else {
    // 使用全局错误处理
    const errorMessage = handleApiError(error);
    console.log('错误信息:', errorMessage);
  }
}
```

## TODO: 错误页面开发

未来需要开发以下错误页面组件：

1. `NetworkErrorScreen` - 网络错误页面，提供重试选项
2. `AuthErrorScreen` - 认证错误页面，引导用户重新登录
3. `ServerErrorScreen` - 服务器错误页面，提供联系管理员选项
4. `GenericErrorScreen` - 通用错误页面，提供返回和重试选项

同时需要开发错误提示组件：

1. Toast 或 Snackbar 组件，用于显示短暂的错误提示
2. Modal 错误弹窗，用于显示需要用户确认的错误信息
