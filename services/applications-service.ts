import { groupsApi } from '@/request';
import {
  JoinRequest,
  RequestQueryStatus,
  BaseResponseCodeEnum,
  InlineObject8,
  InlineObject8ActionEnum,
} from '@/gen/models';
import {
  Application,
  ApplicationsResponse,
  HandleApplicationResponse,
} from '@/types/applications';

// Helper function to transform JoinRequest to Application
const transformApplication = (joinRequest: JoinRequest): Application => {
  return {
    id: joinRequest.requestId!.toString(), // Ensure requestId is present and convert to string
    userId: joinRequest.userId!.toString(), // Ensure userId is present and convert to string
    userName: joinRequest.username || '未知用户', // Provide default if username is missing
    submitTime: joinRequest.requestedAt!, // Use requestedAt timestamp
    status: joinRequest.status!,
  };
};

export const applicationsService = {
  /**
   * Fetches the list of join applications for a specific group.
   * @param groupId The ID of the group.
   * @param status Optional filter for application status.
   */
  getApplications: async (
    groupId: string,
    status: RequestQueryStatus = RequestQueryStatus.Pending // Default to pending
  ): Promise<ApplicationsResponse> => {
    try {
      const response = await groupsApi.groupsGroupIdJoinRequestsGet(
        Number(groupId),
        status
      );
      if (
        response.status === 200 &&
        response.data.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        // Assuming response.data.data is JoinRequest[]
        const applications = (response.data.data as JoinRequest[]).map(
          transformApplication
        );
        return {
          success: true,
          data: applications,
        };
      }
      const errorMessage =
        response.data.code === BaseResponseCodeEnum._1
          ? '获取申请列表失败'
          : '获取申请列表失败';
      return {
        success: false,
        error: errorMessage,
      };
    } catch (error: any) {
      // Consider using the centralized error handler from /request/errorHandler
      console.error('Error fetching applications:', error);
      return {
        success: false,
        error: error.message || '网络错误或请求失败',
      };
    }
  },

  /**
   * Handles a specific join application (approve or reject).
   * @param groupId The ID of the group.
   * @param applicationId The ID of the application (requestId).
   * @param action The action to perform ('approve' or 'reject').
   * @param rejectReason Optional reason for rejection.
   */
  handleApplication: async (
    groupId: string,
    applicationId: string,
    action: 'approve' | 'reject',
    rejectReason?: string
  ): Promise<HandleApplicationResponse> => {
    try {
      const requestBody: InlineObject8 = {
        action:
          action === 'approve'
            ? InlineObject8ActionEnum.Approve
            : InlineObject8ActionEnum.Reject,
        ...(action === 'reject' && rejectReason && { rejectReason }),
      };

      const response = await groupsApi.groupsGroupIdJoinRequestsRequestIdPut(
        Number(groupId),
        Number(applicationId),
        requestBody
      );

      if (
        response.status === 200 &&
        response.data.code === BaseResponseCodeEnum._0
      ) {
        return { success: true };
      }
      return {
        success: false,
        error: '处理申请失败',
      };
    } catch (error: any) {
      // Consider using the centralized error handler
      console.error('Error handling application:', error);
      return {
        success: false,
        error: error.message || '网络错误或请求失败',
      };
    }
  },

  /**
   * 获取单个申请详情
   * @param groupId 组ID
   * @param applicationId 申请ID
   */
  getApplication: async (
    groupId: string,
    applicationId: string
  ): Promise<{ success: boolean; data?: Application; error?: string }> => {
    try {
      // 由于API未直接提供单个申请详情接口，我们先获取所有申请列表，再找到匹配的申请
      const allApplicationsResponse = await applicationsService.getApplications(
        groupId,
        RequestQueryStatus.All
      );

      if (!allApplicationsResponse.success || !allApplicationsResponse.data) {
        return {
          success: false,
          error: allApplicationsResponse.error || '获取申请详情失败',
        };
      }

      const foundApplication = allApplicationsResponse.data.find(
        (app) => app.id === applicationId
      );

      if (!foundApplication) {
        return {
          success: false,
          error: '未找到对应的申请记录',
        };
      }

      return {
        success: true,
        data: foundApplication,
      };
    } catch (error: any) {
      console.error('Error fetching application detail:', error);
      return {
        success: false,
        error: error.message || '网络错误或请求失败',
      };
    }
  },
};
