/**
 * Face API 请求客户端配置
 * 包含人脸识别API的基础配置和拦截器设置
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { Configuration } from '../gen/configuration';
import { getToken, clearToken } from './client';
import { navigateToLogin } from './navigationService';

// Face API 基础URL配置 - 硬编码为特定地址
export const FACE_API_BASE_URL = 'http://face.code-harmony.top:3000';

// 创建face API专用的axios实例
export const faceAxiosInstance: AxiosInstance = axios.create({
  baseURL: FACE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 为face API实例添加请求拦截器
faceAxiosInstance.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 为face API实例添加响应拦截器
faceAxiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      // JWT过期或无效，清除token
      await clearToken();

      // 使用导航服务重定向到登录页面
      navigateToLogin();
    }

    // 统一处理其他API错误
    return Promise.reject(error);
  }
);

// 创建Face API专用配置实例
export const faceApiConfiguration = new Configuration({
  basePath: FACE_API_BASE_URL,
  baseOptions: {},
});
