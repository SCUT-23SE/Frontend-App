import { create } from 'zustand';
import { GroupType } from '@/types/groups';
import { groupsService } from '@/services/groups-service';

interface GroupsState {
  // 用户组列表状态
  groups: GroupType[];
  loading: boolean;
  error: string | null;

  // 当前用户组状态
  currentGroup: GroupType | null;
  currentGroupLoading: boolean;
  currentGroupError: string | null;

  // 申请状态
  applicationStatus: {
    status: 'none' | 'pending' | 'member';
    message?: string;
  } | null;
  applicationStatusLoading: boolean;
  applicationStatusError: string | null;

  // 申请提交状态
  applicationSubmission: {
    status: 'idle' | 'submitting' | 'submitted' | 'failed';
    applicationId?: string;
    submitTime?: string;
    error?: string;
  };

  // 操作方法
  fetchGroups: () => Promise<void>;
  fetchGroupDetail: (groupId: string) => Promise<void>;
  checkApplicationStatus: (groupId: string) => Promise<void>;
  submitApplication: (groupId: string, reason: string) => Promise<void>;
  resetApplicationState: () => void;
}

export const useGroupsStore = create<GroupsState>((set) => ({
  // 初始状态
  groups: [],
  loading: false,
  error: null,

  currentGroup: null,
  currentGroupLoading: false,
  currentGroupError: null,

  applicationStatus: null,
  applicationStatusLoading: false,
  applicationStatusError: null,

  applicationSubmission: {
    status: 'idle',
  },

  // 获取用户组列表
  fetchGroups: async () => {
    set({ loading: true, error: null });
    try {
      const response = await groupsService.getGroups();
      if (response.success) {
        set({ groups: response.data });
      } else {
        set({ error: response.error || '获取用户组列表失败' });
      }
    } catch (error) {
      set({ error: '网络错误，请稍后重试' });
    } finally {
      set({ loading: false });
    }
  },

  // 获取用户组详情
  fetchGroupDetail: async (groupId: string) => {
    set({ currentGroupLoading: true, currentGroupError: null });
    try {
      const response = await groupsService.getGroupDetail(groupId);
      if (response.success && response.data) {
        set({ currentGroup: response.data });
      } else {
        set({ currentGroupError: response.error || '获取用户组详情失败' });
      }
    } catch (error) {
      set({ currentGroupError: '网络错误，请稍后重试' });
    } finally {
      set({ currentGroupLoading: false });
    }
  },

  // 检查申请状态
  checkApplicationStatus: async (groupId: string) => {
    set({ applicationStatusLoading: true, applicationStatusError: null });
    try {
      const response = await groupsService.checkApplicationStatus(groupId);
      if (response.success && response.data) {
        set({ applicationStatus: response.data });
      } else {
        set({ applicationStatusError: response.error || '检查申请状态失败' });
      }
    } catch (error) {
      set({ applicationStatusError: '网络错误，请稍后重试' });
    } finally {
      set({ applicationStatusLoading: false });
    }
  },

  // 提交申请
  submitApplication: async (groupId: string, reason: string) => {
    set({
      applicationSubmission: {
        status: 'submitting',
      },
    });
    try {
      const response = await groupsService.submitApplication({
        groupId,
        reason,
      });
      if (response.success && response.data) {
        set({
          applicationSubmission: {
            status: 'submitted',
            applicationId: response.data.applicationId,
            submitTime: response.data.submitTime,
          },
        });
      } else {
        set({
          applicationSubmission: {
            status: 'failed',
            error: response.error || '提交申请失败',
          },
        });
      }
    } catch (error) {
      set({
        applicationSubmission: {
          status: 'failed',
          error: '网络错误，请稍后重试',
        },
      });
    }
  },

  // 重置申请状态
  resetApplicationState: () => {
    set({
      applicationStatus: null,
      applicationStatusError: null,
      applicationSubmission: {
        status: 'idle',
      },
    });
  },
}));
