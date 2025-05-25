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

// 常见错误代码及对应的友好提示信息
const ERROR_MESSAGES: Record<string, string> = {
  // 通用错误
  network_error: '网络连接失败，请检查您的网络',
  timeout_error: '请求超时，请稍后再试',
  server_error: '服务器暂时不可用，请稍后再试',

  // 认证相关错误
  invalid_credentials: '用户名或密码错误',
  account_locked: '账号已被锁定，请联系管理员',
  account_disabled: '账号已被禁用',
  token_expired: '登录已过期，请重新登录',
  token_invalid: '登录凭证无效，请重新登录',

  // 请求相关错误
  invalid_request: '请求参数错误',
  resource_not_found: '请求的资源不存在',
  permission_denied: '您没有权限执行此操作',
  too_many_requests: '请求频率过高，请稍后再试',
};

/**
 * 统一处理API错误
 * @param error Axios错误对象
 * @param isLoginRequest 是否为登录请求，默认为false
 * @returns 格式化后的错误信息
 */
export const handleApiError = (
  error: AxiosError<ApiErrorResponse>,
  isLoginRequest: boolean = false
): string => {
  let errorMessage = '未知错误，请稍后重试';
  let errorCode = '';

  // 日志记录错误
  console.error('API请求错误:', error);

  if (error.response) {
    // 服务器返回了错误响应
    const { status, data } = error.response;

    // 提取错误代码
    if (data && data.code) {
      errorCode = data.code;
    }

    // 优先使用后端返回的错误信息
    if (data && data.message) {
      errorMessage = data.message;
    } else if (errorCode && ERROR_MESSAGES[errorCode]) {
      // 使用预定义的错误消息
      errorMessage = ERROR_MESSAGES[errorCode];
    } else {
      // 根据状态码提供通用错误信息
      switch (status) {
        case 400:
          errorMessage = '请求参数错误';
          break;
        case 401:
          if (isLoginRequest) {
            // 登录请求的401表示用户名或密码错误
            errorMessage = '用户名或密码错误';
          } else {
            // 其他请求的401表示登录已过期
            errorMessage = '登录已过期，请重新登录';
            // 对于非登录请求的401错误，可以在此处添加导航的判断
            // 但我们已经在拦截器中处理了，这里不再重复导航
          }
          break;
        case 403:
          errorMessage = '无权限访问该资源';
          break;
        case 404:
          errorMessage = '请求的资源不存在';
          break;
        case 409:
          errorMessage = '资源冲突，请检查数据是否重复';
          break;
        case 429:
          errorMessage = '请求频率过高，请稍后再试';
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
    if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请检查网络并重试';
    } else {
      errorMessage = '网络连接失败，请检查您的网络';
    }
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
  return (!error.response && !!error.request) || error.code === 'ECONNABORTED';
};

/**
 * 辅助函数：判断是否为授权错误
 */
export const isAuthError = (error: AxiosError): boolean => {
  return error.response?.status === 401;
};

/**
 * 辅助函数：判断是否为服务器错误
 */
export const isServerError = (error: AxiosError): boolean => {
  const status = error.response?.status;
  return status !== undefined && status >= 500 && status < 600;
};

/**
 * 辅助函数：判断是否为请求错误（客户端错误）
 */
export const isClientError = (error: AxiosError): boolean => {
  const status = error.response?.status;
  return (
    status !== undefined && status >= 400 && status < 500 && status !== 401
  );
};

/**
 * 辅助函数：获取错误代码（如果存在）
 */
export const getErrorCode = (error: AxiosError<ApiErrorResponse>): string => {
  return error.response?.data?.code || '';
};
