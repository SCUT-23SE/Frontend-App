import { create } from 'zustand';
// Remove direct API and model imports if no longer needed here
// import { checkinTasksApi } from '@/request';
// import type { TaskVerificationConfig } from '@/gen/models';
import type { AdminTaskType, TaskType } from '@/types/tasks';
import {
  getAdminGroupTasks,
  getTaskDetail, // Re-use from user tasks service
  createAdminTask,
  updateAdminTask,
  deleteAdminTask,
} from '@/services/tasks-service'; // Import service functions

// 辅助函数：将 TaskType 转换为 AdminTaskType
const convertToAdminTask = (task: TaskType): AdminTaskType => {
  return {
    id: task.id,
    title: task.title,
    groupId: task.group,
    startTime: task.startTime,
    endTime: task.endTime,
    status: task.status,
    type: task.type,
    location: task.location,
    wifi: task.wifi,
    nfcTagId: undefined, // TaskType 中可能没有此字段
    description: task.description,
  };
};

interface AdminTasksState {
  // 任务列表状态
  tasks: AdminTaskType[];
  loading: boolean;
  error: string | null;

  // 当前任务状态
  currentTask: AdminTaskType | null;
  currentTaskLoading: boolean;
  currentTaskError: string | null;

  // 操作状态
  operationStatus: {
    type: 'create' | 'update' | 'delete' | null;
    loading: boolean;
    error: string | null;
  };

  // 操作方法
  fetchTasks: (groupId: string) => Promise<void>;
  fetchTaskDetail: (taskId: string) => Promise<void>;
  createTask: (data: Omit<AdminTaskType, 'id' | 'status'>) => Promise<boolean>;
  updateTask: (
    taskId: string,
    data: Omit<AdminTaskType, 'id' | 'status'>
  ) => Promise<boolean>;
  deleteTask: (taskId: string) => Promise<boolean>;
  resetOperationStatus: () => void;
}

export const useAdminTasksStore = create<AdminTasksState>((set) => ({
  // 初始状态
  tasks: [],
  loading: false,
  error: null,

  currentTask: null,
  currentTaskLoading: false,
  currentTaskError: null,

  operationStatus: {
    type: null,
    loading: false,
    error: null,
  },

  // 获取任务列表
  fetchTasks: async (groupId: string) => {
    set({ loading: true, error: null });
    try {
      const tasksData = await getAdminGroupTasks(groupId); // Use service
      set({ tasks: tasksData });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '网络错误，请稍后重试',
      });
    } finally {
      set({ loading: false });
    }
  },

  // 获取任务详情
  fetchTaskDetail: async (taskId: string) => {
    set({ currentTaskLoading: true, currentTaskError: null });
    try {
      // 获取任务详情，然后转换为 AdminTaskType
      const taskData = await getTaskDetail(taskId);
      set({ currentTask: convertToAdminTask(taskData) });
    } catch (error) {
      set({
        currentTaskError:
          error instanceof Error ? error.message : '网络错误，请稍后重试',
      });
    } finally {
      set({ currentTaskLoading: false });
    }
  },

  // 创建任务
  createTask: async (data) => {
    set({ operationStatus: { type: 'create', loading: true, error: null } });
    try {
      const newTask = await createAdminTask(data); // Use service
      set((state) => ({
        tasks: [...state.tasks, newTask],
        operationStatus: { type: 'create', loading: false, error: null },
      }));
      return true;
    } catch (error) {
      set({
        operationStatus: {
          type: 'create',
          loading: false,
          error: error instanceof Error ? error.message : '创建任务失败',
        },
      });
      return false;
    }
  },

  // 更新任务
  updateTask: async (taskId, data) => {
    set({ operationStatus: { type: 'update', loading: true, error: null } });
    try {
      const updatedTask = await updateAdminTask(taskId, data); // Use service
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? updatedTask : task
        ),
        operationStatus: { type: 'update', loading: false, error: null },
      }));
      return true;
    } catch (error) {
      set({
        operationStatus: {
          type: 'update',
          loading: false,
          error: error instanceof Error ? error.message : '更新任务失败',
        },
      });
      return false;
    }
  },

  // 删除任务
  deleteTask: async (taskId: string) => {
    set({ operationStatus: { type: 'delete', loading: true, error: null } });
    try {
      await deleteAdminTask(taskId); // Use service
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        operationStatus: { type: 'delete', loading: false, error: null },
      }));
      return true;
    } catch (error) {
      set({
        operationStatus: {
          type: 'delete',
          loading: false,
          error: error instanceof Error ? error.message : '删除任务失败',
        },
      });
      return false;
    }
  },

  // 重置操作状态
  resetOperationStatus: () => {
    set({
      operationStatus: {
        type: null,
        loading: false,
        error: null,
      },
    });
  },
}));
