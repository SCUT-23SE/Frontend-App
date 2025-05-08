/**
 * API 请求客户端配置
 * 包含基础请求配置、token 持久化和拦截器设置
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import { Configuration } from '../gen/configuration';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigateToLogin } from './navigationService';

// API 基础URL配置
// 根据Expo环境配置获取API基础URL
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ;

// Token存储键名
const TOKEN_KEY = 'auth_token';

// 创建axios实例
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Token存储接口
 * 使用 AsyncStorage 实现 token 的持久化存储
 */

/**
 * 从存储中获取token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('获取token失败', error);
    return null;
  }
};

/**
 * 保存token到存储
 */
export const saveToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('保存token失败', error);
  }
};

/**
 * 清除存储的token
 */
export const clearToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('清除token失败', error);
  }
};

// 请求拦截器 - 自动添加token
axiosInstance.interceptors.request.use(
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

// 响应拦截器 - 处理错误统一处理
axiosInstance.interceptors.response.use(
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

// 创建API配置实例
export const apiConfiguration = new Configuration({
  basePath: API_BASE_URL,
  baseOptions: {},
});

export { axiosInstance };
