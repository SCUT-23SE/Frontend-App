/**
 * API 实例工厂
 * 创建和导出预配置的 API 客户端实例
 */

import { apiConfiguration, axiosInstance } from './client';
import { faceApiConfiguration, faceAxiosInstance } from './faceClient';
import {
  AuthApi,
  UsersApi,
  CheckinRecordsApi,
  CheckinTasksApi,
  GroupsApi,
  StatisticsApi,
  AuditRequestsApi,
  ExportApi,
  FaceApi,
} from '../gen/api';

// 创建授权相关API实例
export const authApi = new AuthApi(apiConfiguration, undefined, axiosInstance);

// 创建用户相关API实例
export const usersApi = new UsersApi(
  apiConfiguration,
  undefined,
  axiosInstance
);

// 创建打卡记录相关API实例
export const checkinRecordsApi = new CheckinRecordsApi(
  apiConfiguration,
  undefined,
  axiosInstance
);

// 创建打卡任务相关API实例
export const checkinTasksApi = new CheckinTasksApi(
  apiConfiguration,
  undefined,
  axiosInstance
);

// 创建群组相关API实例
export const groupsApi = new GroupsApi(
  apiConfiguration,
  undefined,
  axiosInstance
);

// 创建统计相关API实例
export const statisticsApi = new StatisticsApi(
  apiConfiguration,
  undefined,
  axiosInstance
);

// 创建审核请求相关API实例
export const auditRequestsApi = new AuditRequestsApi(
  apiConfiguration,
  undefined,
  axiosInstance
);

// 创建数据导出相关API实例
export const exportApi = new ExportApi(
  apiConfiguration,
  undefined,
  axiosInstance
);

// 创建人脸识别相关API实例 - 使用专用配置和实例
export const faceApi = new FaceApi(
  faceApiConfiguration,
  undefined,
  faceAxiosInstance
);

/**
 * 授权辅助函数
 * 登录并保存 token
 */
import { saveToken, clearToken } from './client';

export const login = async (username: string, password: string) => {
  try {
    const response = await authApi.authLoginPost({
      username,
      password,
    });

    // JWT 180天后过期，不使用 refresh token
    const responseData = response.data;
    const token =
      typeof responseData === 'object' &&
      'data' in responseData &&
      typeof responseData.data === 'object' &&
      responseData.data &&
      'token' in responseData.data
        ? (responseData.data.token as string)
        : undefined;

    // 确保token不为undefined或null再保存
    if (token) {
      await saveToken(token);
    } else {
      console.error('登录接口返回的token为空');
      console.log(response);
    }
    return response.data;
  } catch (error) {
    // 错误会被拦截器捕获并处理
    throw error;
  }
};

/**
 * 注销登录
 */
export const logout = async () => {
  try {
    // 检查是否有登出API，有则调用
    if ('authLogoutPost' in authApi) {
      await (authApi as any).authLogoutPost();
    } else {
      console.log('后端API不支持登出操作，仅清除本地token');
    }
  } catch (error) {
    // 即使API调用失败，也要清除本地token
    console.error('登出API调用失败', error);
  } finally {
    // 清除本地保存的token
    await clearToken();
  }
};
