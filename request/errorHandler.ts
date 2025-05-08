/**
 * API 错误处理模块
 * 提供统一的错误处理和展示逻辑
 */

import { AxiosError } from 'axios';
import { navigateToLogin } from './navigationService';

// 错误类型定义
interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: any;
}

/**
 * 统一处理API错误
 * @param error Axios错误对象
 * @returns 格式化后的错误信息
 */
export const handleApiError = (error: AxiosError<ApiErrorResponse>): string => {
  let errorMessage = '未知错误，请稍后重试';

  // 日志记录错误
  console.error('API请求错误:', error);

  if (error.response) {
    // 服务器返回了错误响应
    const { status, data } = error.response;

    // 优先使用后端返回的错误信息
    if (data && data.message) {
      errorMessage = data.message;
    } else {
      // 根据状态码提供通用错误信息
      switch (status) {
        case 400:
          errorMessage = '请求参数错误';
          break;
        case 401:
          errorMessage = '登录已过期，请重新登录';
          // 对于401错误，自动跳转到登录页面
          navigateToLogin();
          break;
        case 403:
          errorMessage = '无权限访问该资源';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = '服务器内部错误，请稍后再试';
          break;
        default:
          errorMessage = `请求失败 (${status})`;
      }
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    errorMessage = '网络连接失败，请检查您的网络';
  } else {
    // 请求设置时发生错误
    errorMessage = error.message || '请求过程中发生错误';
  }

  // TODO: 调用全局错误提示UI组件展示错误
  // 可以使用 Toast, Modal 或者导航到专门的错误页面
  // 这部分需要结合实际UI框架实现，例如：
  // Toast.show({
  //   type: 'error',
  //   text1: '错误',
  //   text2: errorMessage,
  //   position: 'bottom',
  // });

  return errorMessage;
};

/**
 * 创建错误页面导航函数
 * 根据错误类型导航到相应的错误页面
 */
export const navigateToErrorPage = (
  errorType: string,
  errorMessage: string
): void => {
  // 根据错误类型进行不同的处理
  switch (errorType) {
    case 'auth':
      // 认证错误，跳转到登录页面
      navigateToLogin();
      break;
    case 'network':
      // 网络错误，可以导航到网络错误页面
      console.log('网络错误:', errorMessage);
      // TODO: 实现网络错误页面导航
      break;
    case 'server':
      // 服务器错误，可以导航到服务器错误页面
      console.log('服务器错误:', errorMessage);
      // TODO: 实现服务器错误页面导航
      break;
    default:
      // 其他错误，记录日志
      console.log('其他错误:', errorType, errorMessage);
      // TODO: 实现通用错误页面导航
      break;
  }
};

/**
 * 辅助函数：判断是否为网络错误
 */
export const isNetworkError = (error: AxiosError): boolean => {
  return !error.response && !!error.request;
};

/**
 * 辅助函数：判断是否为授权错误
 */
export const isAuthError = (error: AxiosError): boolean => {
  return error.response?.status === 401;
};
