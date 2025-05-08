import { auditRequestsApi } from '@/request';
import {
  AuditRequestStatusEnum,
  BaseResponseCodeEnum,
  RequestQueryStatus,
  InlineObject11ActionEnum,
} from '@/gen/models';
import { formatUnixTimestamp } from '@/utils/date';

export interface AuditRequestItem {
  id: string;
  taskId: string;
  taskName: string;
  userId: string;
  userName: string;
  reason: string;
  proofImageUrls: string[];
  status: AuditRequestStatusEnum;
  requestTime: string;
  adminId?: string;
  adminName?: string;
  processTime?: string;
}

export interface AuditRequestsResponse {
  success: boolean;
  data?: AuditRequestItem[];
  error?: string;
}

export interface HandleAuditRequestResponse {
  success: boolean;
  error?: string;
}

export const auditRequestsService = {
  // 获取用户组的签到审核申请列表
  getAuditRequests: async (
    groupId: string,
    status: 'pending' | 'processed' | 'all' = 'pending'
  ): Promise<AuditRequestsResponse> => {
    try {
      // 将字符串状态映射到枚举类型
      let queryStatus: RequestQueryStatus | undefined;

      if (status === 'pending') {
        queryStatus = RequestQueryStatus.Pending;
      } else if (status === 'processed') {
        queryStatus = RequestQueryStatus.Processed;
      } else if (status === 'all') {
        queryStatus = RequestQueryStatus.All;
      }

      const response = await auditRequestsApi.groupsGroupIdAuditRequestsGet(
        parseInt(groupId),
        queryStatus
      );

      if (
        response?.data?.code === BaseResponseCodeEnum._0 &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        return {
          success: true,
          data: response.data.data.map((item) => ({
            id: String(item.auditRequestId),
            taskId: String(item.taskId),
            taskName: item.taskName || '',
            userId: String(item.userId),
            userName: item.username || '',
            reason: item.reason || '',
            proofImageUrls: item.proofImageUrls
              ? item.proofImageUrls.split(',').filter(Boolean)
              : [],
            status: item.status as AuditRequestStatusEnum,
            requestTime: item.requestedAt
              ? formatUnixTimestamp(item.requestedAt)
              : '',
            adminId: item.adminId ? String(item.adminId) : undefined,
            adminName: item.adminUsername || undefined,
            processTime: item.processedAt
              ? formatUnixTimestamp(item.processedAt)
              : undefined,
          })),
        };
      }

      return {
        success: false,
        data: [],
        error: '获取审核申请列表失败',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || '网络错误，请稍后重试',
      };
    }
  },

  // 处理签到审核申请
  handleAuditRequest: async (
    auditRequestId: string,
    action: 'approve' | 'reject'
  ): Promise<HandleAuditRequestResponse> => {
    try {
      // 将字符串action映射为枚举值
      const actionEnum =
        action === 'approve'
          ? InlineObject11ActionEnum.Approve
          : InlineObject11ActionEnum.Reject;

      const response = await auditRequestsApi.auditRequestsAuditRequestIdPut(
        parseInt(auditRequestId),
        { action: actionEnum }
      );

      if (response?.data?.code === BaseResponseCodeEnum._0) {
        return {
          success: true,
        };
      }

      return {
        success: false,
        error: '处理审核申请失败',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '网络错误，请稍后重试',
      };
    }
  },
};
