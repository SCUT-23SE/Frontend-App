import { JoinRequestStatusEnum } from '@/gen/models';

/**
 * Group Application Data Structure
 */
export interface Application {
  id: string; // Corresponds to requestId in JoinRequest, converted to string
  userId: string; // Corresponds to userId in JoinRequest, converted to string
  userName: string; // Corresponds to username in JoinRequest
  reason?: string; // 申请理由
  submitTime: number; // Corresponds to requestedAt (Unix timestamp)
  status: JoinRequestStatusEnum; // 'pending', 'approved', 'rejected'
}

/**
 * Response type for getting applications
 */
export interface ApplicationsResponse {
  success: boolean;
  data?: Application[];
  error?: string;
}

/**
 * Response type for handling an application
 */
export interface HandleApplicationResponse {
  success: boolean;
  error?: string;
}
