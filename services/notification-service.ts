import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { groupsService } from './groups-service';
import { getUserTasks } from './tasks-service';
import { formatUnixTimestamp } from '@/utils/date';
import { TaskType } from '@/types/tasks';
import { useNotificationStore } from '@/stores/notification';

// 存储键定义
const STORAGE_KEYS = {
  LAST_FETCHED_USER_TASKS: 'lastFetchedUserTasks',
  LAST_FETCHED_ADMIN_GROUP_IDS: 'lastFetchedAdminGroupIds',
  LAST_FETCHED_JOIN_REQUESTS_PREFIX: 'lastFetchedJoinRequests_',
  LAST_FETCHED_AUDIT_REQUESTS_PREFIX: 'lastFetchedAuditRequests_',
  IS_FIRST_RUN: 'notificationIsFirstRun',
  SCHEDULED_TASK_NOTIFICATIONS: 'scheduledTaskNotifications', // 存储已调度的任务通知
};

// 通知ID前缀
const NOTIFICATION_IDS = {
  NEW_TASK: 'new-task-',
  TASK_STATUS_CHANGE: 'task-status-change-',
  TASK_UPCOMING_START: 'task-upcoming-start-', // 新增：即将开始的任务通知
  JOIN_REQUEST: 'join-request-',
  AUDIT_REQUEST: 'audit-request-',
};

// 定义请求类型接口
interface JoinRequestType {
  requestId: number | string;
  // 其他字段...
}

interface AuditRequestType {
  auditRequestId: number | string;
  // 其他字段...
}

/**
 * 请求通知权限
 * @returns 是否已获得权限
 */
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * 设置通知处理器
 */
export function setNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * 创建 Android 通知渠道
 */
export async function createNotificationChannels() {
  if (Platform.OS === 'android') {
    // 任务通知渠道
    await Notifications.setNotificationChannelAsync('task-notifications', {
      name: '任务通知',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    // 审批通知渠道
    await Notifications.setNotificationChannelAsync('approval-notifications', {
      name: '审批通知',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

/**
 * 发送任务相关通知
 */
async function sendTaskNotification(
  title: string,
  body: string,
  taskId: string,
  type: 'new' | 'status-change'
) {
  const identifier =
    type === 'new'
      ? `${NOTIFICATION_IDS.NEW_TASK}${taskId}`
      : `${NOTIFICATION_IDS.TASK_STATUS_CHANGE}${taskId}`;

  // 创建通知配置
  const notificationRequest: Notifications.NotificationRequestInput = {
    content: {
      title,
      body,
      data: {
        taskId,
        type: type === 'new' ? 'NEW_TASK' : 'TASK_STATUS_CHANGE',
      },
    },
    trigger: null, // 立即发送
    identifier, // 防止重复通知
  };

  // Android 需要设置通知渠道
  if (Platform.OS === 'android') {
    // 由于类型定义问题，我们需要使用类型断言
    (notificationRequest.content as any).channelId = 'task-notifications';
  }

  await Notifications.scheduleNotificationAsync(notificationRequest);
}

/**
 * 调度即将开始的任务通知
 * @param task 即将开始的任务
 */
async function scheduleTaskStartNotification(task: TaskType): Promise<void> {
  try {
    // 解析任务开始时间 - 将字符串格式的startTime转换为Date
    const startTime = new Date(task.startTime);
    const now = new Date();

    // 如果开始时间已经过去，不调度通知
    if (startTime.getTime() <= now.getTime()) {
      return;
    }

    const identifier = `${NOTIFICATION_IDS.TASK_UPCOMING_START}${task.id}`;

    // 创建通知配置
    const notificationRequest: Notifications.NotificationRequestInput = {
      content: {
        title: '任务即将开始',
        body: `${task.title} 将在 ${task.startTime} 开始，请准备打卡`,
        data: {
          taskId: task.id,
          type: 'TASK_UPCOMING_START',
        },
      },
      trigger: {
        date: startTime,
        channelId: Platform.OS === 'android' ? 'task-notifications' : undefined,
      } as Notifications.NotificationTriggerInput,
      identifier,
    };

    // Android 需要设置通知渠道
    if (Platform.OS === 'android') {
      // 由于类型定义问题，我们需要使用类型断言
      (notificationRequest.content as any).channelId = 'task-notifications';
    }

    // 调度通知
    await Notifications.scheduleNotificationAsync(notificationRequest);

    // 存储已调度的通知信息，便于后续管理
    const scheduledNotificationsJson = await AsyncStorage.getItem(
      STORAGE_KEYS.SCHEDULED_TASK_NOTIFICATIONS
    );
    const scheduledNotifications = scheduledNotificationsJson
      ? JSON.parse(scheduledNotificationsJson)
      : {};

    scheduledNotifications[task.id] = {
      taskId: task.id,
      notificationId: identifier,
      scheduledTime: startTime.getTime(),
    };

    await AsyncStorage.setItem(
      STORAGE_KEYS.SCHEDULED_TASK_NOTIFICATIONS,
      JSON.stringify(scheduledNotifications)
    );

    console.log(
      `已为任务 ${task.id} 调度开始通知，预计触发时间: ${task.startTime}`
    );
  } catch (error) {
    console.error('调度任务开始通知失败:', error);
  }
}

/**
 * 取消任务的调度通知
 * @param taskId 任务ID
 */
async function cancelTaskStartNotification(taskId: string): Promise<void> {
  try {
    const identifier = `${NOTIFICATION_IDS.TASK_UPCOMING_START}${taskId}`;

    // 取消通知
    await Notifications.cancelScheduledNotificationAsync(identifier);

    // 从存储中移除
    const scheduledNotificationsJson = await AsyncStorage.getItem(
      STORAGE_KEYS.SCHEDULED_TASK_NOTIFICATIONS
    );
    if (scheduledNotificationsJson) {
      const scheduledNotifications = JSON.parse(scheduledNotificationsJson);
      delete scheduledNotifications[taskId];

      await AsyncStorage.setItem(
        STORAGE_KEYS.SCHEDULED_TASK_NOTIFICATIONS,
        JSON.stringify(scheduledNotifications)
      );
    }

    console.log(`已取消任务 ${taskId} 的调度通知`);
  } catch (error) {
    console.error('取消任务通知失败:', error);
  }
}

/**
 * 发送审批相关通知
 */
async function sendApprovalNotification(
  title: string,
  body: string,
  groupId: string,
  requestId: string,
  type: 'join' | 'audit'
) {
  const identifier =
    type === 'join'
      ? `${NOTIFICATION_IDS.JOIN_REQUEST}${requestId}`
      : `${NOTIFICATION_IDS.AUDIT_REQUEST}${requestId}`;

  // 创建通知配置
  const notificationRequest: Notifications.NotificationRequestInput = {
    content: {
      title,
      body,
      data: {
        groupId,
        requestId,
        type: type === 'join' ? 'JOIN_REQUEST' : 'AUDIT_REQUEST',
      },
    },
    trigger: null,
    identifier,
  };

  // Android 需要设置通知渠道
  if (Platform.OS === 'android') {
    // 由于类型定义问题，我们需要使用类型断言
    (notificationRequest.content as any).channelId = 'approval-notifications';
  }

  await Notifications.scheduleNotificationAsync(notificationRequest);
}

/**
 * 检查是否为网络错误
 * @param error 捕获的错误对象
 * @returns 是否为网络连接问题
 */
function isNetworkError(error: any): boolean {
  // 检查常见的网络错误模式
  return (
    error.message?.includes('Network Error') ||
    error.message?.includes('network') ||
    error.message?.includes('连接') ||
    error.message?.includes('connection') ||
    error.message?.includes('timeout') ||
    error.message?.includes('断开') ||
    error.name === 'NetworkError' ||
    error.name === 'AbortError' ||
    error.code === 'ECONNABORTED' ||
    // 以下是一些具体库可能抛出的特定错误类型
    (error.response === undefined && error.request) || // axios 网络错误模式
    error instanceof TypeError // 可能是fetch API的网络错误
  );
}

/**
 * 轮询用户任务并发送通知
 * 处理需求1和需求2
 */
export async function pollUserTasksAndNotify(): Promise<boolean> {
  try {
    // 在开始前重置网络错误状态
    useNotificationStore.getState().setNetworkError(false);

    // 检查是否首次运行
    const isFirstRun =
      (await AsyncStorage.getItem(STORAGE_KEYS.IS_FIRST_RUN)) === null;

    // 获取当前任务列表
    const currentTasks = await getUserTasks();

    // 获取上次存储的任务
    const storedTasksJson = await AsyncStorage.getItem(
      STORAGE_KEYS.LAST_FETCHED_USER_TASKS
    );
    const lastTasks: TaskType[] = storedTasksJson
      ? JSON.parse(storedTasksJson)
      : [];

    // 创建用于快速查找的映射
    const lastTasksMap = new Map(lastTasks.map((task) => [task.id, task]));
    const currentTasksMap = new Map(
      currentTasks.map((task) => [task.id, task])
    );

    let hasNewData = false;

    // 非首次运行时才发送通知
    if (!isFirstRun) {
      for (const task of currentTasks) {
        const lastTask = lastTasksMap.get(task.id);

        // 需求1: 检测新任务
        if (!lastTask) {
          // 发送新任务即时通知
          await sendTaskNotification(
            '新任务',
            `${task.title}，开始时间: ${task.startTime}`,
            task.id,
            'new'
          );

          // 如果是即将开始的任务，调度一个开始时间的通知
          if (task.status === 'upcoming') {
            await scheduleTaskStartNotification(task);
          }

          hasNewData = true;
        }
        // 需求2: 检测任务状态从"待开始"变为"进行中"
        else if (lastTask.status === 'upcoming' && task.status === 'ongoing') {
          // 发送任务已开始通知
          await sendTaskNotification(
            '任务已开始',
            `${task.title} 已开始，请及时打卡`,
            task.id,
            'status-change'
          );

          // 取消之前可能调度的开始通知
          await cancelTaskStartNotification(task.id);

          hasNewData = true;
        }
        // 检查任务状态更新，或开始时间变更
        else if (lastTask.status === 'upcoming' && task.status === 'upcoming') {
          // 如果开始时间有变化，需要重新调度通知
          if (lastTask.startTime !== task.startTime) {
            // 先取消之前的通知
            await cancelTaskStartNotification(task.id);
            // 重新调度
            await scheduleTaskStartNotification(task);

            hasNewData = true;
          }
        }
        // 如果任务状态变为了过期，取消可能存在的调度通知
        else if (
          lastTask &&
          task.status === 'expired' &&
          lastTask.status !== 'expired'
        ) {
          await cancelTaskStartNotification(task.id);
        }
      }

      // 检查在新任务列表中不存在但在旧任务列表中存在的任务，取消它们的调度通知
      for (const lastTask of lastTasks) {
        if (
          !currentTasksMap.has(lastTask.id) &&
          lastTask.status === 'upcoming'
        ) {
          await cancelTaskStartNotification(lastTask.id);
        }
      }
    } else {
      // 首次运行时，为所有即将开始的任务调度通知
      for (const task of currentTasks) {
        if (task.status === 'upcoming') {
          await scheduleTaskStartNotification(task);
        }
      }
    }

    // 更新存储
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_FETCHED_USER_TASKS,
      JSON.stringify(currentTasks)
    );

    // 如果是首次运行，标记已完成首次运行
    if (isFirstRun) {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_FIRST_RUN, 'false');
      // 首次运行也返回 true 以便返回新数据
      hasNewData = true;
    }

    return hasNewData;
  } catch (error) {
    console.error('轮询用户任务失败:', error);

    // 检查是否为网络错误
    if (isNetworkError(error)) {
      console.log('检测到网络连接问题，将设置网络错误状态');
      useNotificationStore.getState().setNetworkError(true);
    }

    return false;
  }
}

/**
 * 轮询管理员需要处理的请求并发送通知
 * 处理需求3
 */
export async function pollAdminActionsAndNotify(): Promise<boolean> {
  try {
    // 在开始前重置网络错误状态
    useNotificationStore.getState().setNetworkError(false);

    // 检查是否首次运行
    const isFirstRun =
      (await AsyncStorage.getItem(STORAGE_KEYS.IS_FIRST_RUN)) === null;

    // 获取用户相关的组列表
    const groupsResponse = await groupsService.getGroups();
    if (!groupsResponse.success) {
      console.error('获取用户组列表失败:', groupsResponse.error);
      return false;
    }

    // 筛选出用户是管理员的组
    const adminGroups = groupsResponse.data.filter(
      (group) => group.role === 'admin'
    );

    // 获取上次存储的管理员组 ID 列表
    const storedAdminGroupIdsJson = await AsyncStorage.getItem(
      STORAGE_KEYS.LAST_FETCHED_ADMIN_GROUP_IDS
    );
    const lastAdminGroupIds = storedAdminGroupIdsJson
      ? JSON.parse(storedAdminGroupIdsJson)
      : [];

    // 更新管理员组 ID 列表
    const currentAdminGroupIds = adminGroups.map((group) => group.id);
    await AsyncStorage.setItem(
      STORAGE_KEYS.LAST_FETCHED_ADMIN_GROUP_IDS,
      JSON.stringify(currentAdminGroupIds)
    );

    let hasNewData = false;

    // 对于每个管理员组，检查加入申请和审批请求
    if (!isFirstRun) {
      for (const group of adminGroups) {
        const groupId = group.id;
        const groupName = group.name;

        try {
          // 检查入组申请
          const joinRequestsHasNew = await checkJoinRequests(
            groupId,
            groupName
          );

          // 检查审核申请
          const auditRequestsHasNew = await checkAuditRequests(
            groupId,
            groupName
          );

          if (joinRequestsHasNew || auditRequestsHasNew) {
            hasNewData = true;
          }
        } catch (groupError) {
          console.error(`检查组 ${groupName} 的请求失败:`, groupError);
        }
      }
    }

    // 如果是首次运行，标记已完成首次运行
    if (isFirstRun) {
      await AsyncStorage.setItem(STORAGE_KEYS.IS_FIRST_RUN, 'false');
      hasNewData = true;
    }

    return hasNewData;
  } catch (error) {
    console.error('轮询管理员操作失败:', error);

    // 检查是否为网络错误
    if (isNetworkError(error)) {
      console.log('检测到网络连接问题，将设置网络错误状态');
      useNotificationStore.getState().setNetworkError(true);
    }

    return false;
  }
}

/**
 * 检查指定组的加入请求
 */
async function checkJoinRequests(
  groupId: string,
  groupName: string
): Promise<boolean> {
  try {
    // 获取当前加入请求列表
    const pendingRequests = await groupsService.getGroupJoinRequests(
      Number(groupId)
    );

    // 获取上次存储的加入请求
    const storageKey = `${STORAGE_KEYS.LAST_FETCHED_JOIN_REQUESTS_PREFIX}${groupId}`;
    const storedJoinRequestsJson = await AsyncStorage.getItem(storageKey);
    const lastJoinRequests: JoinRequestType[] = storedJoinRequestsJson
      ? JSON.parse(storedJoinRequestsJson)
      : [];

    // 创建上次请求ID集合，用于快速查找
    const lastRequestIds = new Set(
      lastJoinRequests.map((req: JoinRequestType) => req.requestId)
    );

    let hasNewData = false;

    // 检查新的加入请求
    for (const request of pendingRequests) {
      if (request.requestId && !lastRequestIds.has(request.requestId)) {
        await sendApprovalNotification(
          '新的入组申请',
          `${groupName} 有新的入组申请需要审批`,
          groupId,
          request.requestId.toString(),
          'join'
        );
        hasNewData = true;
      }
    }

    // 更新存储
    await AsyncStorage.setItem(storageKey, JSON.stringify(pendingRequests));

    return hasNewData;
  } catch (error) {
    console.error(`检查组 ${groupId} 的加入请求失败:`, error);

    // 检查是否为网络错误
    if (isNetworkError(error)) {
      console.log(`检查组 ${groupId} 加入请求时检测到网络连接问题`);
      useNotificationStore.getState().setNetworkError(true);
    }

    return false;
  }
}

/**
 * 检查指定组的审批请求
 */
async function checkAuditRequests(
  groupId: string,
  groupName: string
): Promise<boolean> {
  try {
    // 获取当前审批请求列表
    const pendingRequests = await groupsService.getGroupAuditRequests(
      Number(groupId)
    );

    // 获取上次存储的审批请求
    const storageKey = `${STORAGE_KEYS.LAST_FETCHED_AUDIT_REQUESTS_PREFIX}${groupId}`;
    const storedAuditRequestsJson = await AsyncStorage.getItem(storageKey);
    const lastAuditRequests: AuditRequestType[] = storedAuditRequestsJson
      ? JSON.parse(storedAuditRequestsJson)
      : [];

    // 创建上次请求ID集合，用于快速查找
    const lastRequestIds = new Set(
      lastAuditRequests.map((req: AuditRequestType) => req.auditRequestId)
    );

    let hasNewData = false;

    // 检查新的审批请求
    for (const request of pendingRequests) {
      if (
        request.auditRequestId &&
        !lastRequestIds.has(request.auditRequestId)
      ) {
        await sendApprovalNotification(
          '新的异常申诉',
          `${groupName} 有新的异常申诉需要审批`,
          groupId,
          request.auditRequestId.toString(),
          'audit'
        );
        hasNewData = true;
      }
    }

    // 更新存储
    await AsyncStorage.setItem(storageKey, JSON.stringify(pendingRequests));

    return hasNewData;
  } catch (error) {
    console.error(`检查组 ${groupId} 的审批请求失败:`, error);

    // 检查是否为网络错误
    if (isNetworkError(error)) {
      console.log(`检查组 ${groupId} 审批请求时检测到网络连接问题`);
      useNotificationStore.getState().setNetworkError(true);
    }

    return false;
  }
}

/**
 * 执行通知检查
 * 用于应用内调用，检查是否有新的任务或请求需要通知
 * @returns 是否有新数据
 */
export async function performBackgroundFetch(): Promise<{
  hasNewData: boolean;
  hasNewTasks: boolean;
  hasTaskStatusChanges: boolean;
  hasAdminRequests: boolean;
}> {
  try {
    // 重置网络错误状态
    useNotificationStore.getState().setNetworkError(false);

    // 检查用户任务
    const userTasksResult = await pollUserTasksAndNotify();

    // 检查管理员操作
    const adminActionsResult = await pollAdminActionsAndNotify();

    // 返回更详细的信息，包括是否有新的任务或状态变更
    return {
      hasNewData: userTasksResult || adminActionsResult,
      hasNewTasks: userTasksResult, // 简化处理，任何任务变更都视为需要刷新任务列表
      hasTaskStatusChanges: userTasksResult, // 任务状态变更也需要刷新任务列表
      hasAdminRequests: adminActionsResult, // 管理员请求变更
    };
  } catch (error) {
    console.error('执行通知检查失败:', error);

    // 检查是否为网络错误
    if (isNetworkError(error)) {
      console.log('执行通知检查时检测到网络连接问题');
      useNotificationStore.getState().setNetworkError(true);
    }

    // 出错时返回所有值为 false
    return {
      hasNewData: false,
      hasNewTasks: false,
      hasTaskStatusChanges: false,
      hasAdminRequests: false,
    };
  }
}
