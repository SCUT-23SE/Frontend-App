import { groupsApi } from '../request';
import { InlineObject4 } from '@/gen/models/inline-object4';
import { InlineObject2 } from '@/gen/models/inline-object2';
import {
  Group,
  GroupRole,
  JoinRequest,
  GroupMembershipStatus,
  BaseResponseCodeEnum,
  GroupMember,
} from '@/gen/models';
import {
  GroupType,
  GroupsResponse,
  GroupDetailResponse,
  ApplicationCheckResponse,
  JoinApplicationRequest,
  JoinApplicationResponse,
} from '@/types/groups';
import { Member, mapGroupMembersToMembers } from '@/types/member';
import { formatDate, formatUnixTimestamp } from '@/utils/date';

// 定义一个扩展接口，因为返回的 Group 对象可能包含额外的字段
interface ExtendedGroup extends Group {
  // 在 /groups GET 返回中，添加了用户在组中的角色
  roleInGroup?: string;
  // 在 /groups GET 返回中，可能包含加入时间
  joinedAt?: number;
}

export const groupsService = {
  getGroups: async (): Promise<GroupsResponse> => {
    try {
      const response = await groupsApi.groupsGet();
      if (
        response?.data?.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        const responseData = response.data.data as ExtendedGroup[];
        return {
          success: true,
          data: responseData.map((group) => ({
            id: group.groupId?.toString() || '',
            name: group.groupName || '',
            description: group.description || '',
            memberCount: group.memberCount || 0,
            role: (group.roleInGroup as 'admin' | 'member' | null) || null,
            joinTime: group.joinedAt
              ? formatUnixTimestamp(group.joinedAt)
              : undefined,
            adminInfo: group.creatorName
              ? {
                  name: group.creatorName,
                  contact: '', // API 中可能没有这个字段
                }
              : undefined,
          })),
        };
      }
      return {
        success: false,
        data: [],
        error: '获取用户组列表失败',
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.message || '获取用户组列表失败',
      };
    }
  },

  getGroupDetail: async (groupId: string): Promise<GroupDetailResponse> => {
    try {
      const response = await groupsApi.groupsGroupIdGet(Number(groupId));
      if (
        response?.data?.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        const groupData = response.data.data as ExtendedGroup;
        return {
          success: true,
          data: {
            id: groupId,
            name: groupData.groupName || '',
            description: groupData.description || '',
            memberCount: groupData.memberCount || 0,
            role: (groupData.roleInGroup as 'admin' | 'member' | null) || null,
            adminInfo: groupData.creatorName
              ? {
                  name: groupData.creatorName,
                  contact: '', // API 中可能没有联系方式
                }
              : undefined,
          },
        };
      }
      return {
        success: false,
        error: '获取用户组详情失败',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '获取用户组详情失败',
      };
    }
  },

  checkApplicationStatus: async (
    groupId: string
  ): Promise<ApplicationCheckResponse> => {
    try {
      const response = await groupsApi.groupsGroupIdMyStatusGet(
        Number(groupId)
      );
      if (
        response?.data?.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        const statusData = response.data.data as {
          status: GroupMembershipStatus;
          message?: string;
        };

        // 转换 API 的状态类型到前端使用的类型
        let frontendStatus: 'none' | 'pending' | 'member' = 'none';
        switch (statusData.status) {
          case GroupMembershipStatus.None:
            frontendStatus = 'none';
            break;
          case GroupMembershipStatus.Pending:
            frontendStatus = 'pending';
            break;
          case GroupMembershipStatus.Member:
            frontendStatus = 'member';
            break;
          default:
            frontendStatus = 'none';
        }

        return {
          success: true,
          data: {
            status: frontendStatus,
            message: statusData.message,
          },
        };
      }
      return {
        success: false,
        error: '检查申请状态失败',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '检查申请状态失败',
      };
    }
  },

  submitApplication: async (
    data: JoinApplicationRequest
  ): Promise<JoinApplicationResponse> => {
    try {
      const requestData: InlineObject4 = {
        reason: data.reason,
      };
      const response = await groupsApi.groupsGroupIdJoinRequestsPost(
        Number(data.groupId),
        requestData
      );
      if (
        response?.data?.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        const applicationData = response.data.data as JoinRequest;
        return {
          success: true,
          data: {
            status: 'pending',
            applicationId: applicationData.requestId?.toString() || '',
            submitTime: applicationData.requestedAt
              ? formatUnixTimestamp(applicationData.requestedAt)
              : formatDate(new Date()),
          },
        };
      }
      return {
        success: false,
        error: '提交申请失败',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '提交申请失败',
      };
    }
  },

  createGroup: async (
    name: string,
    description: string
  ): Promise<GroupDetailResponse> => {
    try {
      const requestData: InlineObject2 = {
        groupName: name,
        description: description,
      };
      const response = await groupsApi.groupsPost(requestData);

      if (
        response?.data?.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        const groupData = response.data.data as Group;
        return {
          success: true,
          data: {
            id: groupData.groupId?.toString() || '',
            name: groupData.groupName || '',
            description: groupData.description || '',
            memberCount: groupData.memberCount || 1,
            role: 'admin',
            adminInfo: groupData.creatorName
              ? {
                  name: groupData.creatorName,
                  contact: '',
                }
              : undefined,
          },
        };
      }

      return {
        success: false,
        error: '创建用户组失败',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '创建用户组失败',
      };
    }
  },

  /**
   * 获取用户组成员列表
   * @param groupId 用户组ID
   * @returns 成员列表
   */
  getGroupMembers: async (groupId: number): Promise<Member[]> => {
    try {
      const response = await groupsApi.groupsGroupIdMembersGet(groupId);

      if (
        response.data.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        const groupMembers = response.data.data as GroupMember[];
        return mapGroupMembersToMembers(groupMembers);
      }

      throw new Error('获取成员列表失败');
    } catch (error: any) {
      console.error('获取成员列表出错:', error);
      throw new Error(error.message || '获取成员列表失败');
    }
  },

  /**
   * 移除用户组成员
   * @param groupId 用户组ID
   * @param memberId 要移除的成员ID
   */
  removeGroupMember: async (
    groupId: number,
    memberId: number
  ): Promise<void> => {
    try {
      const response = await groupsApi.groupsGroupIdMembersUserIdDelete(
        groupId,
        memberId
      );

      if (response.data.code === BaseResponseCodeEnum._0) {
        return;
      }

      throw new Error('移除成员失败');
    } catch (error: any) {
      console.error('移除成员出错:', error);
      throw new Error(error.message || '移除成员失败');
    }
  },
};
