# 实训打卡系统 API 请求库

此请求库是通过 OpenAPI Generator 自动生成的，用于简化与实训打卡后端 API 的交互。

## 安装

此库已经集成在项目中，不需要额外安装。

## 基本使用方法

### 1. 配置

首先需要创建一个配置实例，用于设置 API 的基本参数：

```typescript
import { Configuration } from './gen/configuration';

// 创建配置实例
const configuration = new Configuration({
  basePath: 'http://your-api-base-url', // 替换为实际的 API 地址
  // 如果需要认证，可以设置相关参数
  apiKey: 'your-api-key', // 可选
  accessToken: 'your-access-token', // 可选
});
```

### 2. 创建 API 实例

```typescript
import {
  AuthApi,
  UsersApi,
  CheckinRecordsApi /* 其他需要的 API */,
} from './gen/api';

// 创建 API 实例
const authApi = new AuthApi(configuration);
const usersApi = new UsersApi(configuration);
const checkinRecordsApi = new CheckinRecordsApi(configuration);
```

### 3. 调用 API 方法

#### 用户认证示例

```typescript
// 用户登录
const loginResponse = await authApi.authLoginPost({
  username: 'your-username',
  password: 'your-password',
});

// 用户注册
const registerResponse = await authApi.authRegisterPost({
  username: 'new-username',
  password: 'new-password',
  // 其他必要字段
});
```

#### 打卡记录示例

```typescript
// 获取打卡记录
const records = await checkinRecordsApi.checkinRecordsGet();

// 创建打卡记录
const newRecord = await checkinRecordsApi.checkinRecordsPost({
  // 打卡数据
});
```

## 拦截器配置

### 设置请求拦截器

您可以使用 axios 拦截器来统一处理请求和响应。创建一个自定义的 axios 实例并设置拦截器：

```typescript
import axios from 'axios';
import { Configuration } from './gen/configuration';
import { AuthApi, UsersApi /* 其他API */ } from './gen/api';

// 创建自定义 axios 实例
const axiosInstance = axios.create({
  baseURL: 'http://your-api-base-url',
  timeout: 10000,
});

// 请求拦截器 - 统一添加 token
axiosInstance.interceptors.request.use(
  (config) => {
    // 从 localStorage 或其他存储获取 token
    const token = localStorage.getItem('token');
    if (token) {
      // 添加 token 到请求头
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 统一处理异常
axiosInstance.interceptors.response.use(
  (response) => {
    // 可以在这里统一处理成功响应
    return response;
  },
  (error) => {
    // 统一处理错误
    if (error.response) {
      const status = error.response.status;

      // 处理 401 未授权错误
      if (status === 401) {
        // 清除本地 token
        localStorage.removeItem('token');
        // 重定向到登录页
        window.location.href = '/login';
      }

      // 处理 403 禁止访问错误
      else if (status === 403) {
        console.error('没有权限访问该资源');
        // 可以跳转到无权限页面
      }

      // 处理 500 服务器错误
      else if (status >= 500) {
        console.error('服务器错误，请稍后再试');
        // 可以显示全局错误提示
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误，请检查您的网络连接');
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }

    // 返回统一的错误结构
    return Promise.reject(error);
  }
);

// 使用自定义 axios 实例创建配置
const configuration = new Configuration({
  basePath: 'http://your-api-base-url',
  baseOptions: {}, // 这里可以添加 axios 配置
});

// 创建 API 实例并传入自定义的 axios 实例
const authApi = new AuthApi(configuration, undefined, axiosInstance);
const usersApi = new UsersApi(configuration, undefined, axiosInstance);
```

### Token 刷新机制

如果您需要实现 token 自动刷新功能，可以在响应拦截器中添加以下逻辑：

```typescript
// 创建一个变量来跟踪是否正在刷新 token
let isRefreshing = false;
// 存储等待刷新 token 的请求
let refreshSubscribers = [];

// 函数：完成 token 刷新后，执行队列中的请求
const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// 函数：添加请求到队列
const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 如果是 401 错误且不是刷新 token 的请求且没有标记为已重试
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      if (isRefreshing) {
        // 如果正在刷新，将请求添加到队列
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(axiosInstance(originalRequest));
          });
        });
      }

      // 标记为已重试和正在刷新
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 尝试刷新 token
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axiosInstance.post('/auth/refresh', {
          refresh_token: refreshToken,
        });

        // 获取新 token
        const { token, refreshToken: newRefreshToken } = response.data;

        // 更新存储的 token
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 更新 axios 默认 headers
        axiosInstance.defaults.headers.common[
          'Authorization'
        ] = `Bearer ${token}`;

        // 执行队列中的请求
        onRefreshed(token);

        // 重新发送原始请求
        originalRequest.headers.Authorization = `Bearer ${token}`;
        isRefreshing = false;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // 刷新 token 失败，清除登录状态并跳转到登录页
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### 全局异常处理

您可以创建一个全局的错误处理工具来展示错误信息：

```typescript
// errorHandler.ts
import { message } from 'antd'; // 使用 Ant Design 的消息组件

export const handleApiError = (error) => {
  let errorMessage = '未知错误';

  if (error.response) {
    const { status, data } = error.response;

    // 根据后端返回的错误信息
    if (data && data.message) {
      errorMessage = data.message;
    } else {
      // 根据状态码显示错误信息
      switch (status) {
        case 400:
          errorMessage = '请求参数错误';
          break;
        case 401:
          errorMessage = '登录已过期，请重新登录';
          break;
        case 403:
          errorMessage = '无权限访问';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
          errorMessage = '服务器内部错误';
          break;
        default:
          errorMessage = `请求错误 (${status})`;
      }
    }
  } else if (error.request) {
    errorMessage = '网络异常，请检查您的网络连接';
  } else {
    errorMessage = error.message;
  }

  // 显示错误消息
  message.error(errorMessage);

  // 可以在这里添加额外的日志记录
  console.error('API 错误:', errorMessage, error);

  return errorMessage;
};
```

然后在您的 API 调用中使用它：

```typescript
import { handleApiError } from './errorHandler';

try {
  const response = await authApi.authLoginPost({
    username: 'your-username',
    password: 'your-password',
  });
  // 处理成功响应
} catch (error) {
  // 统一处理错误
  handleApiError(error);
}
```

## 可用的 API 模块

项目中包含以下 API 模块：

- `AuditRequestsApi`: 审核请求相关
- `AuthApi`: 用户认证相关
- `CheckinRecordsApi`: 打卡记录相关
- `CheckinTasksApi`: 打卡任务相关
- `ExportApi`: 数据导出相关
- `FaceApi`: 人脸识别相关
- `GroupsApi`: 群组管理相关
- `StatisticsApi`: 统计数据相关
- `UsersApi`: 用户管理相关

## 错误处理

```typescript
try {
  const response = await authApi.authLoginPost({
    username: 'your-username',
    password: 'your-password',
  });

  // 处理成功响应
  console.log(response.data);
} catch (error) {
  // 处理错误
  if (error.response) {
    // 服务器返回了错误状态码
    console.error('错误状态码:', error.response.status);
    console.error('错误数据:', error.response.data);
  } else if (error.request) {
    // 请求已发送但没有收到响应
    console.error('未收到响应:', error.request);
  } else {
    // 其他错误
    console.error('错误:', error.message);
  }
}
```

## 数据模型

该库包含多个数据模型，用于表示请求和响应数据的结构。主要包括：

- 用户相关：`User`
- 群组相关：`Group`, `GroupMember`
- 打卡相关：`CheckinRecord`, `CheckinTask`
- 通用响应：`Success`, `SuccessWithData`, `Error` 等

请参考 `models` 目录下的文件查看完整的数据模型定义。

## 注意事项

1. 此 API 库是自动生成的，不应手动修改
2. 在使用前确保已经配置正确的 API 基础路径
3. 所有的 API 调用都会返回 Promise，请使用 async/await 或 Promise 链处理
4. 推荐使用拦截器统一处理 token 和错误，提高代码可维护性
