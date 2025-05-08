import { create } from 'zustand';
// Remove direct API and model imports if no longer needed here
// import { checkinTasksApi } from '@/request';
// import { InlineObject8VerifyTypeEnum } from '@/gen/models';
// import type { VerificationDataLocationInfo, WifiInfo } from '@/gen/models';
import type { TaskType } from '@/types/tasks';
import {
  getUserTasks,
  getTaskDetail,
  checkInService, // 导入新的 service
} from '@/services/tasks-service'; // Import service functions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDate } from '@/utils/date';

// 定义单项验证的状态
interface VerificationItemState {
  status: 'idle' | 'verifying' | 'success' | 'failed';
  reason?: string; // 失败原因
  data?: any; // 存储验证时使用的数据
}

// 新的签到状态管理
interface CheckInVerificationState {
  gps: VerificationItemState;
  face: VerificationItemState;
  wifi: VerificationItemState;
}

// 最终提交状态
interface SubmitState {
  status: 'idle' | 'submitting' | 'success' | 'failed';
  message?: string;
  checkInTime?: string;
  error?: string;
}

interface ExceptionState {
  status: 'idle' | 'submitting' | 'submitted' | 'failed';
  applicationId?: string;
  submitTime?: string;
  error?: string;
}

interface TasksState {
  // 任务列表状态
  tasks: TaskType[];
  loading: boolean;
  error: string | null;

  // 当前任务状态
  currentTask: TaskType | null;
  currentTaskLoading: boolean;
  currentTaskError: string | null;

  // 分步验证状态
  verification: CheckInVerificationState;
  // 最终提交状态
  submission: SubmitState;

  // 异常申请状态
  exception: ExceptionState;

  // 操作方法
  fetchTasks: () => Promise<void>;
  fetchTaskDetail: (taskId: string) => Promise<void>;

  // 新的验证方法
  verifyGps: (
    taskId: string,
    location: { latitude: number; longitude: number }
  ) => Promise<void>;
  verifyFace: (taskId: string, faceData: string) => Promise<void>;
  verifyWifi: (
    taskId: string,
    wifiInfo: { ssid: string; bssid: string }
  ) => Promise<void>;

  // 最终提交方法
  submitFinalCheckIn: (taskId: string, groupId?: number) => Promise<void>;

  submitException: (
    taskId: string,
    reason: string,
    images?: string[]
  ) => Promise<void>;

  // 重置方法
  resetVerificationStates: () => void;
  resetSubmissionState: () => void;
  resetExceptionState: () => void;
}

// 默认验证状态
const initialVerificationItemState: VerificationItemState = {
  status: 'idle',
  data: undefined,
};

const initialVerificationState: CheckInVerificationState = {
  gps: { ...initialVerificationItemState },
  face: { ...initialVerificationItemState },
  wifi: { ...initialVerificationItemState },
};

const initialSubmissionState: SubmitState = {
  status: 'idle',
};

export const useTasksStore = create<TasksState>((set, get) => ({
  // 初始状态
  tasks: [],
  loading: false,
  error: null,

  currentTask: null,
  currentTaskLoading: false,
  currentTaskError: null,

  verification: { ...initialVerificationState }, // 初始化分步验证状态
  submission: { ...initialSubmissionState }, // 初始化最终提交状态

  exception: {
    status: 'idle',
  },

  // 获取任务列表
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const tasksData = await getUserTasks();
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
    // 重置该任务的验证状态
    get().resetVerificationStates();
    get().resetSubmissionState();
    try {
      const taskData = await getTaskDetail(taskId);
      set({ currentTask: taskData });
    } catch (error) {
      set({
        currentTaskError:
          error instanceof Error ? error.message : '网络错误，请稍后重试',
      });
    } finally {
      set({ currentTaskLoading: false });
    }
  },

  // --- 新增验证方法 (使用 checkInService) ---
  verifyGps: async (taskId, location) => {
    set((state) => ({
      verification: { ...state.verification, gps: { status: 'verifying' } },
    }));
    try {
      const result = await checkInService.verifyCheckInType(taskId, 'gps', {
        location,
      });

      set((state) => ({
        verification: {
          ...state.verification,
          gps: {
            status: result.verified ? 'success' : 'failed',
            reason: result.message,
            data: result.verified ? location : undefined, // 只有在验证成功时才保存位置数据
          },
        },
      }));
    } catch (error) {
      console.error('GPS Verification Error:', error);
      set((state) => ({
        verification: {
          ...state.verification,
          gps: {
            status: 'failed',
            reason: error instanceof Error ? error.message : 'GPS验证请求失败',
          },
        },
      }));
    }
  },

  verifyFace: async (taskId, faceData) => {
    set((state) => ({
      verification: { ...state.verification, face: { status: 'verifying' } },
    }));
    try {
      const result = await checkInService.verifyCheckInType(taskId, 'face', {
        faceData,
      });
      set((state) => ({
        verification: {
          ...state.verification,
          face: {
            status: result.verified ? 'success' : 'failed',
            reason: result.message,
            data: result.verified ? faceData : undefined, // 只有在验证成功时才保存人脸数据
          },
        },
      }));
    } catch (error) {
      console.error('Face Verification Error:', error);
      set((state) => ({
        verification: {
          ...state.verification,
          face: {
            status: 'failed',
            reason: error instanceof Error ? error.message : '人脸验证请求失败',
          },
        },
      }));
    }
  },

  verifyWifi: async (taskId, wifiInfo) => {
    set((state) => ({
      verification: { ...state.verification, wifi: { status: 'verifying' } },
    }));
    try {
      const result = await checkInService.verifyCheckInType(taskId, 'wifi', {
        wifiInfo,
      });
      set((state) => ({
        verification: {
          ...state.verification,
          wifi: {
            status: result.verified ? 'success' : 'failed',
            reason: result.message,
            data: result.verified ? wifiInfo : undefined, // 只有在验证成功时才保存WiFi数据
          },
        },
      }));
    } catch (error) {
      console.error('WiFi Verification Error:', error);
      set((state) => ({
        verification: {
          ...state.verification,
          wifi: {
            status: 'failed',
            reason: error instanceof Error ? error.message : 'WiFi验证请求失败',
          },
        },
      }));
    }
  },

  // --- 最终提交方法 (使用 checkInService) ---
  submitFinalCheckIn: async (taskId, groupId) => {
    const { verification, currentTask } = get();

    // 收集已验证成功的数据
    const data: {
      location?: { latitude: number; longitude: number };
      faceData?: string;
      wifiInfo?: { ssid: string; bssid: string };
    } = {};

    // 使用Store中保存的验证数据
    if (
      currentTask?.type.gps &&
      verification.gps.status === 'success' &&
      verification.gps.data
    ) {
      data.location = verification.gps.data;
    }

    if (
      currentTask?.type.face &&
      verification.face.status === 'success' &&
      verification.face.data
    ) {
      data.faceData = verification.face.data;
    }

    if (
      currentTask?.type.wifi &&
      verification.wifi.status === 'success' &&
      verification.wifi.data
    ) {
      data.wifiInfo = verification.wifi.data;
    }

    set({ submission: { status: 'submitting' } });
    try {
      const response = await checkInService.submitCheckIn(
        taskId,
        data,
        groupId
      ); // 使用 checkInService
      if (response.success) {
        set({
          submission: {
            status: 'success',
            message: response.message,
            checkInTime: response.checkInTime,
          },
        });
      } else {
        set({
          submission: {
            status: 'failed',
            error: response.error || '签到提交失败',
          },
        });
      }
    } catch (error) {
      console.error('Final Check-in Submission Error:', error);
      set({
        submission: {
          status: 'failed',
          error: error instanceof Error ? error.message : '签到提交请求失败',
        },
      });
    }
  },

  // 提交异常申请
  submitException: async (
    taskId: string,
    reason: string,
    images?: string[]
  ) => {
    set({ exception: { status: 'submitting' } });
    try {
      // TODO: Replace with call to submitTaskException service when available
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay
      set({
        exception: {
          status: 'submitted',
          applicationId: Math.random().toString(36).substring(7),
          submitTime: formatDate(new Date()),
        },
      });
    } catch (error) {
      set({
        exception: {
          status: 'failed',
          error:
            error instanceof Error ? error.message : '网络错误，请稍后重试',
        },
      });
    }
  },

  // --- 重置方法 ---
  resetVerificationStates: () => {
    set({ verification: { ...initialVerificationState } });
  },

  resetSubmissionState: () => {
    set({ submission: { ...initialSubmissionState } });
  },

  resetExceptionState: () => {
    set({ exception: { status: 'idle' } });
  },
}));
