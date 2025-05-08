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
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>; // logout 现在可能是异步的
  clearError: () => void;
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
      // 调用 request/apis.ts 中的 login 辅助函数
      // 它会处理 API 调用和 token 持久化 (saveToken)
      const loginResponse = await requestLogin(username, password);

      // 检查响应数据格式
      if (
        loginResponse &&
        typeof loginResponse === 'object' &&
        'data' in loginResponse &&
        typeof loginResponse.data === 'object' &&
        loginResponse.data &&
        'token' in loginResponse.data
      ) {
        // 从data对象中获取token
        const token = loginResponse.data.token as string;
        // 更新 Zustand state 中的 token
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
          return true; // 登录成功
        } catch (userError) {
          // 获取用户信息失败，虽然 token 有了，但用户信息不完整
          // 保持 token，但用户信息设为基础/未知，标记为已认证
          set({
            isAuthenticated: true,
            user: {
              // 仍然使用基础信息，但表示已认证
              id: '0', // 或者可以尝试从 token 解码 id (如果可能)
              username: username, // 使用登录时的用户名
            },
            error: null, // 清除登录步骤可能产生的错误
          });
          console.error('获取用户信息失败 (但已登录)', userError);
          // 即使获取用户信息失败，登录本身（获取 token）是成功的
          return true;
        }
      } else {
        // requestLogin 内部应该已抛出错误，或者返回了无效数据
        // 但为保险起见，处理一下理论上可能走到的分支
        set({
          error: '登录失败，请检查用户名和密码',
          token: null,
          isAuthenticated: false,
          user: null,
        });
        return false;
      }
    } catch (error: any) {
      // requestLogin 或 usersMeGet 抛出的错误
      const errorMessage =
        error.response?.data?.message || '登录或获取用户信息时出错';
      set({
        error: errorMessage,
        token: null,
        isAuthenticated: false,
        user: null,
      });
      // 确保登出状态，清除可能残留的 token (虽然 requestLogin 失败可能已清除)
      try {
        await requestLogout(); // 尝试清除持久化 token
      } catch (logoutError) {
        console.error('尝试在登录失败后清除 token 时出错:', logoutError);
      }
      return false; // 登录失败
    } finally {
      set({ loading: false });
    }
  },

  register: async (username: string, password: string) => {
    set({ loading: true, error: null });
    try {
      // 注册逻辑保持不变，因为它不涉及 token 持久化
      await authApi.authRegisterPost({
        username,
        password,
      });

      set({ error: null });
      return true; // 注册成功
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || '注册失败，请稍后重试';
      console.log(error);
      set({ error: errorMessage });
      return false; // 注册失败
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    // 改为 async
    try {
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
}));
