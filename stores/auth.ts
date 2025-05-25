import { create } from 'zustand';
// 引入 request/apis.ts 中的辅助函数
import {
  login as requestLogin,
  logout as requestLogout,
  authApi,
  usersApi,
} from '@/request';
// 假设 saveToken/clearToken 在 client 中处理持久化
// import { saveToken, clearToken } from '@/request/client'; // 不需要直接导入，辅助函数已处理
import { useNotificationStore } from './notification';
import { InlineObject3SceneEnum } from '@/gen/models/inline-object3'; // 导入类型
import { handleApiError, isNetworkError } from '@/request/errorHandler';

interface User {
  id: string;
  username: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  login: (username: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    password: string,
    email: string,
    verificationCode: string
  ) => Promise<boolean>;
  logout: () => Promise<void>; // logout 现在可能是异步的
  clearError: () => void;
  sendVerificationCode: (
    email: string,
    scene: 'register' | 'reset_password'
  ) => Promise<boolean>;
  resetPassword: (
    email: string,
    verificationCode: string,
    newPassword: string
  ) => Promise<boolean>;
}

export const useAuth = create<AuthState>((set, get) => ({
  // 添加 get 用于获取当前 token
  isAuthenticated: false,
  user: null,
  token: null, // TODO: Consider hydrating token from storage on init
  loading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // 这个方法现在由页面直接调用requestLogin，然后调用此方法
      // 如果能走到这里，说明requestLogin已经成功
      const loginResponse = await requestLogin(username, password);

      // 从data对象中获取token（尽管在requestLogin中已保存，这里为了一致性保留）
      if (
        loginResponse &&
        typeof loginResponse === 'object' &&
        'data' in loginResponse &&
        typeof loginResponse.data === 'object' &&
        loginResponse.data &&
        'token' in loginResponse.data
      ) {
        const token = loginResponse.data.token as string;
        set({ token });

        try {
          // 如果API已经返回了用户信息，直接使用
          if (
            'userId' in loginResponse.data &&
            'username' in loginResponse.data
          ) {
            set({
              isAuthenticated: true,
              user: {
                id: String(loginResponse.data.userId),
                username: String(loginResponse.data.username),
              },
              error: null,
            });

            // 登录成功后启动通知轮询
            try {
              await useNotificationStore.getState().startPolling();
            } catch (notificationError) {
              // 静默处理错误
            }

            return true; // 登录成功
          }

          // 如果API没有返回用户信息，尝试获取用户信息
          const userInfoResponse = await usersApi.usersMeGet();
          const userData = userInfoResponse.data;

          set({
            isAuthenticated: true,
            user: {
              id:
                typeof userData === 'object' && userData && 'id' in userData
                  ? String(userData.id)
                  : '0',
              username:
                typeof userData === 'object' &&
                userData &&
                'username' in userData
                  ? String(userData.username)
                  : username,
            },
            error: null,
          });

          // 登录成功后启动通知轮询
          try {
            await useNotificationStore.getState().startPolling();
          } catch (notificationError) {
            // 静默处理错误
          }

          return true; // 登录成功
        } catch (userError) {
          // 获取用户信息失败，虽然 token 有了，但用户信息不完整
          // 保持 token，但用户信息设为基础/未知，标记为已认证
          set({
            isAuthenticated: true,
            user: {
              // 仍然使用基础信息，但表示已认证
              id: '0',
              username: username, // 使用登录时的用户名
            },
            error: null, // 清除登录步骤可能产生的错误
          });

          // 登录成功后启动通知轮询（即使获取用户信息失败）
          try {
            await useNotificationStore.getState().startPolling();
          } catch (notificationError) {
            // 静默处理错误
          }

          // 即使获取用户信息失败，登录本身（获取 token）是成功的
          return true;
        }
      } else {
        // 数据格式错误
        set({
          error: '登录响应格式错误',
          token: null,
          isAuthenticated: false,
          user: null,
        });
        return false;
      }
    } catch (error: any) {
      // 这里的错误应该已经在页面层处理过了
      // 设置通用错误状态
      set({
        error: '登录过程中发生错误',
        token: null,
        isAuthenticated: false,
        user: null,
      });

      // 清除可能残留的token，不输出错误日志
      try {
        await requestLogout();
      } catch (logoutError) {
        // 静默处理错误
      }

      return false;
    } finally {
      set({ loading: false });
    }
  },

  register: async (
    username: string,
    password: string,
    email: string,
    verificationCode: string
  ) => {
    set({ loading: true, error: null });
    try {
      // 调用新的register接口，传递email和verificationCode
      await authApi.authRegisterPost({
        username,
        password,
        email,
        verificationCode,
      });

      set({ error: null });
      return true; // 注册成功
    } catch (error: any) {
      let errorMessage =
        error.response?.data?.message || '注册失败，请稍后重试';

      // 检查是否为网络错误
      if (
        error.message?.includes('Network Error') ||
        error.message?.includes('network') ||
        error.message?.includes('连接') ||
        error.code === 'ECONNABORTED' ||
        (error.response === undefined && error.request)
      ) {
        errorMessage = '网络连接失败，请检查网络设置后重试';
      }

      console.log(error);
      set({ error: errorMessage });
      // 将原始错误抛给调用方，让调用方可以根据状态码处理
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    // 改为 async
    try {
      // 在登出前停止通知轮询
      useNotificationStore.getState().stopPolling();

      // 调用 request/apis.ts 中的 logout 辅助函数
      // 它会处理可选的后端 API 调用和 token 持久化清除 (clearToken)
      await requestLogout();
    } catch (error) {
      // 即使辅助函数失败（比如网络问题），也要清除前端状态
      console.error('调用登出辅助函数失败:', error);
    } finally {
      // 无论辅助函数成功与否，都清除 Zustand state
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        error: null, // 清除登出时可能产生的错误
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // 添加发送验证码的功能
  sendVerificationCode: async (
    email: string,
    scene: 'register' | 'reset_password'
  ) => {
    set({ loading: true, error: null });
    try {
      await authApi.authSendVerificationCodePost({
        email,
        scene: scene as InlineObject3SceneEnum,
      });
      return true; // 发送成功
    } catch (error: any) {
      // 将错误传递给调用方处理，同时设置全局错误状态
      let errorMessage =
        error.response?.data?.message || '发送验证码失败，请稍后重试';

      // 检查是否为网络错误
      if (
        error.message?.includes('Network Error') ||
        error.message?.includes('network') ||
        error.message?.includes('连接') ||
        error.code === 'ECONNABORTED' ||
        (error.response === undefined && error.request)
      ) {
        errorMessage = '网络连接失败，请检查网络设置后重试';
      }

      set({ error: errorMessage });
      // 抛出原始错误对象，让调用方可以根据状态码处理
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // 添加重置密码功能
  resetPassword: async (
    email: string,
    verificationCode: string,
    newPassword: string
  ) => {
    set({ loading: true, error: null });
    try {
      await authApi.authResetPasswordPost({
        email,
        verificationCode,
        newPassword,
      });
      set({ error: null });
      return true; // 重置成功
    } catch (error: any) {
      // 将错误传递给调用方处理，同时设置全局错误状态
      let errorMessage =
        error.response?.data?.message || '重置密码失败，请稍后重试';

      // 检查是否为网络错误
      if (
        error.message?.includes('Network Error') ||
        error.message?.includes('network') ||
        error.message?.includes('连接') ||
        error.code === 'ECONNABORTED' ||
        (error.response === undefined && error.request)
      ) {
        errorMessage = '网络连接失败，请检查网络设置后重试';
      }

      set({ error: errorMessage });
      // 抛出原始错误对象，让调用方可以根据状态码处理
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
