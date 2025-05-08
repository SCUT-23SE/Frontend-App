export interface GroupType {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  role: 'admin' | 'member' | null;
  joinTime?: string;
  adminInfo?: {
    name: string;
    contact: string;
  };
}

export interface GroupsResponse {
  success: boolean;
  data: GroupType[];
  error?: string;
}

export interface GroupDetailResponse {
  success: boolean;
  data?: GroupType;
  error?: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
}

export interface JoinApplicationRequest {
  groupId: string;
  reason: string;
}

export interface JoinApplicationResponse {
  success: boolean;
  data?: {
    status: 'pending';
    applicationId: string;
    submitTime: string;
  };
  error?: string;
}

export interface ApplicationCheckResponse {
  success: boolean;
  data?: {
    status: 'none' | 'pending' | 'member';
    message?: string;
  };
  error?: string;
}
