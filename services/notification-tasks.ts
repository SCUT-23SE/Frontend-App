import * as Notifications from 'expo-notifications';
import { performBackgroundFetch } from './notification-service';
import { router } from 'expo-router';
import { useNotificationStore } from '@/stores/notification';
import { Alert, ToastAndroid, Platform } from 'react-native';
import { useTasksStore } from '@/stores/tasks';

const POLLING_INTERVAL = 2000; // 例如，每2秒轮询一次 (60000毫秒)
const NETWORK_ERROR_INTERVAL = 60000; // 网络错误时的通知间隔（1分钟）
let pollingIntervalId: number | null = null;
let notificationResponseListener: any = null;
let lastNetworkErrorTime: number = 0; // 上次显示网络错误的时间
let lastNewTaskNotificationTime: number = 0; // 上次显示新任务通知的时间
const NEW_TASK_NOTIFICATION_INTERVAL = 30000; // 新任务通知间隔（30秒）

/**
 * 显示网络错误提示
 * 根据平台使用不同的提示方式，并限制提示频率
 */
function showNetworkErrorMessage() {
  const now = Date.now();
  // 限制提示频率，避免频繁弹出
  if (now - lastNetworkErrorTime < NETWORK_ERROR_INTERVAL) {
    return;
  }

  lastNetworkErrorTime = now;

  if (Platform.OS === 'android') {
    ToastAndroid.show('网络连接失败，请检查网络设置', ToastAndroid.SHORT);
  } else {
    // iOS 或其他平台使用 Alert
    Alert.alert('网络连接失败', '请检查网络设置后重试');
  }
}

/**
 * 显示新任务提示
 * 提示用户刷新页面查看新任务
 */
function showNewTaskNotification() {
  const now = Date.now();
  // 限制提示频率，避免频繁弹出
  if (now - lastNewTaskNotificationTime < NEW_TASK_NOTIFICATION_INTERVAL) {
    return;
  }

  lastNewTaskNotificationTime = now;

  if (Platform.OS === 'android') {
    ToastAndroid.show('发现新任务或状态更新，已为您刷新', ToastAndroid.SHORT);
  } else {
    // iOS 或其他平台使用 Alert，但要避免过于打扰
    // Alert.alert('发现新任务', '新任务或状态更新已加载');
    // iOS可以使用通知中心等更友好的方式
  }
}

/**
 * 实际执行轮询的函数
 */
async function poll() {
  try {
    const result = await performBackgroundFetch();

    // 检查是否存在网络错误
    const { networkError } = useNotificationStore.getState();
    if (networkError) {
      showNetworkErrorMessage();
      return;
    }

    // 有任何新数据时进行处理
    if (result.hasNewData) {
      // 如果有新任务或任务状态变更，刷新任务列表
      if (result.hasNewTasks || result.hasTaskStatusChanges) {
        const tasksStore = useTasksStore.getState();
        if (tasksStore && tasksStore.fetchTasks) {
          console.log('检测到新任务或任务状态变更，正在刷新任务列表');
          await tasksStore.fetchTasks();

          // 显示新任务通知
          showNewTaskNotification();
        }
      }

      // 如果有管理员请求变更，可以在这里添加针对管理员请求的处理
      if (result.hasAdminRequests) {
        console.log('检测到新的管理员请求');
        // 如果有相关组件需要刷新，在这里添加逻辑
        // 例如：if (useAdminStore.getState().refreshRequests) { useAdminStore.getState().refreshRequests(); }
      }
    }
  } catch (error) {
    console.error('Error during notification polling:', error);
    // 检查通知store中是否标记了网络错误
    const { networkError } = useNotificationStore.getState();
    if (networkError) {
      showNetworkErrorMessage();
    }
  }
}

/**
 * 处理通知点击的函数
 * @param response 通知响应对象
 */
async function handleNotificationResponse(
  response: Notifications.NotificationResponse
) {
  const data = response.notification.request.content.data;
  console.log('通知被点击，数据:', data);

  try {
    // 根据通知类型进行导航
    switch (data.type) {
      case 'NEW_TASK':
      case 'TASK_STATUS_CHANGE':
      case 'TASK_UPCOMING_START':
        if (data.taskId) {
          console.log(`准备跳转到任务: ${data.taskId}`);
          // 任务类通知 - 尝试先获取任务详情，确认任务存在且有权限访问
          try {
            // 导入任务服务
            const { getTaskDetail } = await import('./tasks-service');
            // 尝试获取任务详情，如果失败会抛出异常
            await getTaskDetail(String(data.taskId));

            // 任务存在且用户有权限访问，跳转到任务详情页
            router.push({
              pathname: '/(tabs)/tasks/task-detail',
              params: { id: String(data.taskId) },
            });
          } catch (error) {
            console.error('获取任务详情失败:', error);
            // 显示友好的错误提示
            if (Platform.OS === 'android') {
              ToastAndroid.show(
                '无法访问该任务，可能任务不存在或您没有权限',
                ToastAndroid.LONG
              );
            } else {
              // iOS 使用 Alert
              Alert.alert('无法访问任务', '该任务可能不存在或您没有访问权限', [
                { text: '确定', onPress: () => router.push('/(tabs)/tasks') },
              ]);
            }
            // 失败后默认跳转到任务列表页
            router.push('/(tabs)/tasks');
          }
        }
        break;

      case 'JOIN_REQUEST':
        if (data.groupId) {
          console.log(`准备跳转到入组请求: 组 ${data.groupId}`);
          try {
            // 跳转到入组申请管理页面
            router.push('/(tabs)/groups/admin-applications');
          } catch (error) {
            console.error('跳转到入组请求页面失败:', error);
            if (Platform.OS === 'android') {
              ToastAndroid.show('跳转到入组申请页面失败', ToastAndroid.SHORT);
            } else {
              Alert.alert('跳转失败', '无法打开入组申请页面');
            }
            router.push('/(tabs)/groups');
          }
        }
        break;

      case 'AUDIT_REQUEST':
        if (data.groupId) {
          console.log(`准备跳转到审核请求: 组 ${data.groupId}`);
          try {
            // 修改为跳转到异常审核页面，而不是组管理页面
            router.push({
              pathname: '/(tabs)/groups/admin-audit-requests',
              params: { id: String(data.groupId) },
            });
          } catch (error) {
            console.error('跳转到审核请求页面失败:', error);
            if (Platform.OS === 'android') {
              ToastAndroid.show('跳转到审核请求页面失败', ToastAndroid.SHORT);
            } else {
              Alert.alert('跳转失败', '无法打开审核请求页面');
            }
            router.push('/(tabs)/groups');
          }
        }
        break;

      case 'test':
        console.log('这是一个测试通知，不执行跳转');
        break;

      default:
        console.log('未知通知类型，跳转到首页');
        try {
          router.push('/(tabs)/tasks');
        } catch (error) {
          console.error('跳转到首页失败:', error);
        }
        break;
    }
  } catch (error) {
    console.error('处理通知点击失败:', error);
    // 处理通知点击的全局错误，跳转到首页
    if (Platform.OS === 'android') {
      ToastAndroid.show('处理通知失败，请稍后重试', ToastAndroid.SHORT);
    } else {
      Alert.alert('通知处理失败', '无法处理该通知，请稍后重试');
    }
    try {
      router.push('/(tabs)/tasks');
    } catch (navError) {
      console.error('导航到首页失败:', navError);
    }
  }
}

/**
 * 设置通知响应监听器，用于处理用户点击通知
 */
export function setupNotificationResponseListener() {
  // 先移除之前的监听器，避免重复
  if (notificationResponseListener) {
    Notifications.removeNotificationSubscription(notificationResponseListener);
  }

  // 添加新的监听器
  notificationResponseListener =
    Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

  console.log('已设置通知响应监听器');
  return notificationResponseListener;
}

/**
 * 启动周期性轮询检查通知
 */
export function startPollingForNotifications(
  interval: number = POLLING_INTERVAL
) {
  if (pollingIntervalId) {
    console.log('Polling is already active.');
    return;
  }
  console.log(
    `Starting notification polling every ${interval / 1000} seconds.`
  );
  // 立即执行一次，然后开始定时轮询
  poll();
  pollingIntervalId = setInterval(poll, interval);
}

/**
 * 停止周期性轮询
 */
export function stopPollingForNotifications() {
  if (pollingIntervalId) {
    console.log('Stopping notification polling.');
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
}

/**
 * 启动通知系统 - 仅应用内本地通知
 * @returns 启动是否成功
 */
export async function startNotificationSystem(): Promise<boolean> {
  try {
    // 检查通知权限
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('通知权限尚未授予，跳过通知系统初始化');
      return false;
    }

    // 设置通知徽标数量为0
    await Notifications.setBadgeCountAsync(0);

    // 设置通知响应监听器
    setupNotificationResponseListener();

    // 立即执行一次通知检查（在应用内）
    // 这一步由 startPollingForNotifications 内部的首次 poll() 调用覆盖
    // try {
    //   await performBackgroundFetch();
    // } catch (error) {
    //   console.warn('初始通知检查失败:', error);
    // }

    // 启动周期性轮询
    startPollingForNotifications();

    console.log('应用内通知系统启动成功，并已开始轮询');
    return true;
  } catch (error) {
    console.error('启动通知系统失败:', error);
    stopPollingForNotifications(); // 确保如果启动失败则停止轮询
    return false;
  }
}

/**
 * 检查是否有新通知
 * 可在应用内手动调用以检查新通知，或者由轮询机制调用
 * @returns 是否获取到新数据
 */
export async function checkForNotifications(): Promise<boolean> {
  try {
    // 如果需要手动触发，可以直接调用 poll 或者 performBackgroundFetch
    const result = await performBackgroundFetch();
    return result.hasNewData;
  } catch (error) {
    console.error('检查通知失败:', error);
    return false;
  }
}

/**
 * 发送一个简单的测试通知
 * 用于测试通知功能是否正常
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '测试通知',
        body: '如果你看到这条通知，说明本地通知系统工作正常',
        data: { type: 'test' },
      },
      trigger: null, // 立即发送
    });
    return true;
  } catch (error) {
    console.error('发送测试通知失败:', error);
    return false;
  }
}

/**
 * 清理通知资源
 * 在应用退出或组件卸载时调用
 */
export function cleanupNotificationSystem() {
  // 停止轮询
  stopPollingForNotifications();

  // 移除通知响应监听器
  if (notificationResponseListener) {
    Notifications.removeNotificationSubscription(notificationResponseListener);
    notificationResponseListener = null;
  }

  console.log('通知系统资源已清理');
}

/**
 * 手动刷新任务数据
 * 可以从应用的任何地方调用，用于强制刷新任务列表
 */
export async function refreshTasksData(): Promise<boolean> {
  try {
    const tasksStore = useTasksStore.getState();
    if (tasksStore && tasksStore.fetchTasks) {
      console.log('手动刷新任务列表');
      await tasksStore.fetchTasks();
      return true;
    }
    return false;
  } catch (error) {
    console.error('刷新任务列表失败:', error);
    return false;
  }
}
