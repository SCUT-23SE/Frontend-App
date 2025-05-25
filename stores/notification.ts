import { create } from 'zustand';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  requestNotificationPermission,
  setNotificationHandler,
  createNotificationChannels,
} from '@/services/notification-service';
import {
  startNotificationSystem,
  setupNotificationResponseListener,
  cleanupNotificationSystem,
  startPollingForNotifications,
  stopPollingForNotifications,
} from '@/services/notification-tasks';
import { useAuth } from './auth';

// 存储键定义
const NOTIFICATION_PERMISSION_KEY = 'notificationPermissionStatus';

// 通知权限状态
export type NotificationPermissionStatus =
  | 'granted' // 已授权
  | 'denied' // 已拒绝
  | 'undetermined' // 未决定
  | 'requesting'; // 请求中

interface NotificationState {
  // 通知权限状态
  permissionStatus: NotificationPermissionStatus;
  // 是否已初始化
  isInitialized: boolean;
  // 未读通知数量
  unreadCount: number;

  // 已轮询最新任务的时间戳
  lastTaskPollTime: number | null;
  // 已轮询最新申请的时间戳
  lastRequestPollTime: number | null;
  // 通知响应监听器
  responseListener: any;
  // 网络错误状态
  networkError: boolean;
  // 是否在轮询中
  isPolling: boolean;

  // 初始化通知系统
  initialize: () => Promise<boolean>;
  // 请求通知权限
  requestPermission: () => Promise<boolean>;
  // 标记所有通知为已读
  markAllAsRead: () => void;
  // 手动更新未读通知数量
  updateUnreadCount: (count: number) => void;
  // 更新最后一次轮询时间戳
  updateLastPollTime: (type: 'task' | 'request', timestamp: number) => void;
  // 清理资源
  cleanup: () => void;
  // 启动轮询（登录后调用）
  startPolling: () => Promise<boolean>;
  // 停止轮询（登出时调用）
  stopPolling: () => void;
  // 设置网络错误状态
  setNetworkError: (hasError: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  permissionStatus: 'undetermined',
  isInitialized: false,
  unreadCount: 0,
  lastTaskPollTime: null,
  lastRequestPollTime: null,
  responseListener: null,
  networkError: false,
  isPolling: false,

  /**
   * 初始化通知系统
   * 设置通知处理器、读取权限状态等
   */
  initialize: async () => {
    try {
      // 如果已初始化，则返回
      if (get().isInitialized) return true;

      try {
        // 设置通知处理器
        setNotificationHandler();

        // 创建通知渠道（Android）
        await createNotificationChannels();

        // 从本地存储读取权限状态
        const savedStatus = await AsyncStorage.getItem(
          NOTIFICATION_PERMISSION_KEY
        );
        if (savedStatus) {
          set({
            permissionStatus: savedStatus as NotificationPermissionStatus,
          });
        }

        // 设置通知响应监听器（即使未登录也需要设置，以便处理可能存在的历史通知）
        try {
          const listener = setupNotificationResponseListener();
          set({ responseListener: listener });
        } catch (listenerError) {
          console.warn('添加通知监听器失败:', listenerError);
        }

        // 如果已有权限且用户已登录，则启动通知系统
        const authState = useAuth.getState();
        if (savedStatus === 'granted' && authState.isAuthenticated) {
          try {
            await get().startPolling();
          } catch (notificationError) {
            console.warn(
              '启动通知系统失败，可能缺少ExpoPushTokenManager:',
              notificationError
            );
            // 继续执行，不阻断应用启动
          }
        }

        // 尝试监听通知接收
        try {
          const subscription = Notifications.addNotificationReceivedListener(
            () => {
              // 当收到通知时，增加未读计数
              set((state) => ({ unreadCount: state.unreadCount + 1 }));
            }
          );
        } catch (listenerError) {
          console.warn('添加通知监听器失败:', listenerError);
          // 继续执行，不阻断应用启动
        }
      } catch (moduleError) {
        console.warn(
          '通知模块初始化失败，可能缺少必要的原生模块:',
          moduleError
        );
        // 继续执行，不阻断应用启动
      }

      // 标记为已初始化
      set({ isInitialized: true });

      return true;
    } catch (error) {
      console.error('初始化通知系统失败:', error);
      // 即使失败也标记为已初始化，避免重复尝试
      set({ isInitialized: true });
      return false;
    }
  },

  /**
   * 请求通知权限
   */
  requestPermission: async () => {
    try {
      // 设置状态为请求中
      set({ permissionStatus: 'requesting' });

      try {
        // 请求权限
        const granted = await requestNotificationPermission();

        // 更新权限状态
        const newStatus: NotificationPermissionStatus = granted
          ? 'granted'
          : 'denied';
        set({ permissionStatus: newStatus });

        // 保存权限状态到本地存储
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, newStatus);

        // 如果授予了权限，并且用户已登录，则启动通知系统
        if (granted && useAuth.getState().isAuthenticated) {
          try {
            await get().startPolling();
          } catch (systemError) {
            console.warn('启动通知系统失败:', systemError);
          }
        }

        return granted;
      } catch (permissionError) {
        console.warn(
          '请求通知权限失败，可能缺少必要的原生模块:',
          permissionError
        );
        set({ permissionStatus: 'undetermined' });
        return false;
      }
    } catch (error) {
      console.error('请求通知权限失败:', error);
      set({ permissionStatus: 'undetermined' });
      return false;
    }
  },

  /**
   * 启动轮询（登录后调用）
   */
  startPolling: async () => {
    try {
      if (get().isPolling) {
        console.log('轮询已经在运行中');
        return true;
      }

      // 检查权限状态
      if (get().permissionStatus !== 'granted') {
        console.log('未获得通知权限，无法启动轮询');
        return false;
      }

      // 检查认证状态
      if (!useAuth.getState().isAuthenticated) {
        console.log('用户未登录，不启动轮询');
        return false;
      }

      // 启动通知系统和轮询
      await startNotificationSystem();
      set({ isPolling: true, networkError: false });
      return true;
    } catch (error) {
      console.error('启动轮询失败:', error);
      return false;
    }
  },

  /**
   * 停止轮询（登出时调用）
   */
  stopPolling: () => {
    try {
      if (!get().isPolling) {
        return;
      }

      stopPollingForNotifications();
      set({ isPolling: false, networkError: false });
    } catch (error) {
      console.error('停止轮询失败:', error);
    }
  },

  /**
   * 设置网络错误状态
   */
  setNetworkError: (hasError: boolean) => {
    set({ networkError: hasError });
  },

  /**
   * 标记所有通知为已读
   */
  markAllAsRead: () => {
    set({ unreadCount: 0 });
  },

  /**
   * 更新未读通知数量
   */
  updateUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },

  /**
   * 更新最后一次轮询时间戳
   */
  updateLastPollTime: (type: 'task' | 'request', timestamp: number) => {
    if (type === 'task') {
      set({ lastTaskPollTime: timestamp });
    } else {
      set({ lastRequestPollTime: timestamp });
    }
  },

  /**
   * 清理通知系统资源
   */
  cleanup: () => {
    get().stopPolling();
    cleanupNotificationSystem();
    set({ responseListener: null });
  },
}));
