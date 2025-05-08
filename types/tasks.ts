import type { TaskVerificationConfig } from '@/gen/models';

export interface TaskType {
  id: string;
  title: string;
  group: string;
  deadline: string;
  status: 'ongoing' | 'upcoming' | 'expired';
  type: {
    gps: boolean;
    face: boolean;
    wifi: boolean;
    nfc: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  wifi?: {
    ssid: string;
    bssid: string;
  };
  startTime: string;
  endTime: string;
  description?: string;
  myCheckinStatus?:
    | 'unchecked'
    | 'success'
    | 'pending'
    | 'pending_audit'
    | 'audit_approved'
    | 'audit_rejected';
  groupName?: string;
}

export interface AdminTaskType {
  id: string;
  title: string;
  groupId: string;
  startTime: string;
  endTime: string;
  status: 'ongoing' | 'upcoming' | 'expired';
  type: {
    gps: boolean;
    face: boolean;
    wifi: boolean;
    nfc: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  wifi?: {
    ssid: string;
    bssid: string;
  };
  nfcTagId?: string;
  description?: string;
}
