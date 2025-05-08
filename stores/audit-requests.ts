import { create } from 'zustand';
import {
  auditRequestsService,
  AuditRequestItem,
} from '@/services/audit-requests-service';
import { AuditRequestStatusEnum } from '@/gen/models';

interface AuditRequestsState {
  // 审核申请列表状态
  auditRequests: AuditRequestItem[];
  loading: boolean;
  error: string | null;
  filterStatus: 'pending' | 'processed' | 'all';

  // 处理状态
  processing: {
    id: string;
    action: 'approve' | 'reject';
  } | null;

  // 操作方法
  fetchAuditRequests: (groupId: string) => Promise<void>;
  setFilterStatus: (status: 'pending' | 'processed' | 'all') => void;
  handleAuditRequest: (
    auditRequestId: string,
    action: 'approve' | 'reject'
  ) => Promise<boolean>;
  resetState: () => void;
}

export const useAuditRequestsStore = create<AuditRequestsState>((set, get) => ({
  // 初始状态
  auditRequests: [],
  loading: false,
  error: null,
  filterStatus: 'pending',
  processing: null,

  // 获取审核申请列表
  fetchAuditRequests: async (groupId: string) => {
    const { filterStatus } = get();
    set({ loading: true, error: null });

    try {
      const response = await auditRequestsService.getAuditRequests(
        groupId,
        filterStatus
      );

      if (response.success) {
        set({ auditRequests: response.data || [] });
      } else {
        set({ error: response.error || '获取审核申请列表失败' });
      }
    } catch (error: any) {
      set({ error: error.message || '网络错误，请稍后重试' });
    } finally {
      set({ loading: false });
    }
  },

  // 设置过滤状态
  setFilterStatus: (status: 'pending' | 'processed' | 'all') => {
    set({ filterStatus: status });
  },

  // 处理审核申请
  handleAuditRequest: async (
    auditRequestId: string,
    action: 'approve' | 'reject'
  ) => {
    set({ processing: { id: auditRequestId, action } });

    try {
      const response = await auditRequestsService.handleAuditRequest(
        auditRequestId,
        action
      );

      if (response.success) {
        // 更新本地状态
        set((state) => ({
          auditRequests: state.auditRequests.map((item) =>
            item.id === auditRequestId
              ? {
                  ...item,
                  status:
                    action === 'approve'
                      ? AuditRequestStatusEnum.Approved
                      : AuditRequestStatusEnum.Rejected,
                  processTime: new Date().toLocaleString(),
                }
              : item
          ),
        }));
        return true;
      } else {
        set({ error: response.error || '处理审核申请失败' });
        return false;
      }
    } catch (error: any) {
      set({ error: error.message || '网络错误，请稍后重试' });
      return false;
    } finally {
      set({ processing: null });
    }
  },

  // 重置状态
  resetState: () => {
    set({
      auditRequests: [],
      loading: false,
      error: null,
      filterStatus: 'pending',
      processing: null,
    });
  },
}));
