/**
 * 导航服务
 * 提供全局可访问的导航功能，用于非React组件中（如API客户端）
 */

import { router } from 'expo-router';

// 默认重定向目标
const DEFAULT_AUTH_SCREEN = '/login';

// 记录上一次401错误发生的时间，用于防止短时间内多次重定向
let lastAuthErrorTime = 0;
// 标记是否已经在进行重定向，防止多个API请求同时触发多次重定向
let isRedirecting = false;

/**
 * 导航到登录页面
 * 防止短时间内多次重定向和多个请求同时触发的重定向
 */
export const navigateToLogin = () => {
  const now = Date.now();

  // 如果正在重定向或者距离上次401错误小于2秒，则不执行重定向
  if (isRedirecting || now - lastAuthErrorTime < 2000) {
    return;
  }

  try {
    isRedirecting = true;
    lastAuthErrorTime = now;

    // 使用expo-router提供的router进行导航
    router.replace(DEFAULT_AUTH_SCREEN);

    // 显示友好的提示信息
    console.log('会话已过期，正在跳转到登录页面...');
  } catch (error) {
    console.error('导航到登录页面时出错:', error);
  } finally {
    // 重置重定向状态，允许未来的重定向
    setTimeout(() => {
      isRedirecting = false;
    }, 1000);
  }
};
