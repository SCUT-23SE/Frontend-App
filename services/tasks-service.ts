import { checkinTasksApi, checkinRecordsApi, faceApi } from '@/request';
import { useAuth } from '@/stores/auth';
import type { TaskType, AdminTaskType } from '@/types/tasks';
import {
  InlineObject11VerifyTypeEnum,
  type VerificationDataLocationInfo,
  type WifiInfo,
  type TaskVerificationConfig,
  type CheckinTask,
  type CheckinRecord,
  BaseResponseCodeEnum,
  type VerificationData,
} from '@/gen/models';
import { formatDate, formatUnixTimestamp } from '@/utils/date';

// --- 自定义/辅助类型定义 ---

// 定义 getDetail 返回的详细类型 (如果 CheckinRecord 不够详细)
// 暂时直接使用 CheckinRecord，如果组件需要更多字段，再定义此类型
export type CheckInDetail = CheckinRecord; // 使用 CheckinRecord 作为详情类型

// 定义 verifyCheckInType 返回的类型
export interface VerificationResult {
  type: 'gps' | 'face' | 'wifi' | 'nfc';
  verified: boolean;
  reason?: string;
  message?: string;
}

// 为验证响应定义明确的接口 (内部使用)
interface VerifyCheckInResult {
  valid: boolean;
  message?: string;
  verifyType?: string;
}

// --- User Task Services ---

export const getUserTasks = async (): Promise<TaskType[]> => {
  const response = await checkinTasksApi.usersMeCheckinTasksGet();
  if (
    response.data &&
    response.data.code === BaseResponseCodeEnum._0 &&
    response.data.data
  ) {
    // 将API返回的CheckinTask类型转换为前端使用的TaskType类型
    const tasks = response.data.data as CheckinTask[];
    return tasks.map((task) => ({
      id: task.taskId.toString(),
      title: task.taskName,
      group: task.groupId.toString(),
      deadline: formatUnixTimestamp(task.endTime),
      status: task.status,
      type: {
        gps: task.verificationConfig?.checkinMethods?.gps || false,
        face: task.verificationConfig?.checkinMethods?.face || false,
        wifi: task.verificationConfig?.checkinMethods?.wifi || false,
        nfc: task.verificationConfig?.checkinMethods?.nfc || false,
      },
      location:
        task.verificationConfig?.locationInfo?.location &&
        task.verificationConfig.locationInfo.location.latitude &&
        task.verificationConfig.locationInfo.location.longitude
          ? {
              latitude: task.verificationConfig.locationInfo.location.latitude,
              longitude:
                task.verificationConfig.locationInfo.location.longitude,
              radius: task.verificationConfig.locationInfo.radius || 0,
            }
          : undefined,
      wifi: task.verificationConfig?.wifiInfo,
      startTime: formatUnixTimestamp(task.startTime),
      endTime: formatUnixTimestamp(task.endTime),
      description: task.description,
      myCheckinStatus: (task as any).myCheckinStatus,
      groupName: (task as any).groupName,
    }));
  } else {
    throw new Error('获取用户任务列表失败');
  }
};

export const getTaskDetail = async (taskId: string): Promise<TaskType> => {
  const response = await checkinTasksApi.checkinTasksTaskIdGet(Number(taskId));
  if (
    response.data &&
    response.data.code === BaseResponseCodeEnum._0 &&
    response.data.data
  ) {
    // 将API返回的CheckinTask类型转换为前端使用的TaskType类型
    const task = response.data.data as CheckinTask;
    return {
      id: task.taskId.toString(),
      title: task.taskName,
      group: task.groupId.toString(),
      deadline: formatUnixTimestamp(task.endTime),
      status: task.status,
      type: {
        gps: task.verificationConfig?.checkinMethods?.gps || false,
        face: task.verificationConfig?.checkinMethods?.face || false,
        wifi: task.verificationConfig?.checkinMethods?.wifi || false,
        nfc: task.verificationConfig?.checkinMethods?.nfc || false,
      },
      location:
        task.verificationConfig?.locationInfo?.location &&
        task.verificationConfig.locationInfo.location.latitude &&
        task.verificationConfig.locationInfo.location.longitude
          ? {
              latitude: task.verificationConfig.locationInfo.location.latitude,
              longitude:
                task.verificationConfig.locationInfo.location.longitude,
              radius: task.verificationConfig.locationInfo.radius || 0,
            }
          : undefined,
      wifi: task.verificationConfig?.wifiInfo,
      startTime: formatUnixTimestamp(task.startTime),
      endTime: formatUnixTimestamp(task.endTime),
      description: task.description,
    };
  } else {
    throw new Error('获取任务详情失败');
  }
};

export const verifyCheckIn = async (
  taskId: string,
  data: {
    location?: { latitude: number; longitude: number };
    faceData?: string;
    wifiInfo?: { ssid: string; bssid: string };
  }
): Promise<{
  status: 'success' | 'failed';
  message: string;
  checkInTime?: string;
  failureReason?: string;
}> => {
  let verifyType: InlineObject11VerifyTypeEnum;
  if (data.location) {
    verifyType = InlineObject11VerifyTypeEnum.Gps;
  } else if (data.wifiInfo) {
    verifyType = InlineObject11VerifyTypeEnum.Wifi;
  } else {
    throw new Error('No valid verification data provided for check-in.');
  }

  // 构建符合API要求的验证数据结构
  const verificationData: VerificationData = {
    locationInfo: data.location
      ? {
          location: {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          },
        }
      : undefined,
    faceData: data.faceData,
    wifiInfo: data.wifiInfo as WifiInfo, // 明确指定类型
  };

  const verifyResponse = await checkinTasksApi.checkinTasksTaskIdVerifyPost(
    Number(taskId),
    { verifyType, verificationData }
  );

  if (
    verifyResponse.data &&
    verifyResponse.data.code === BaseResponseCodeEnum._0 &&
    verifyResponse.data.data
  ) {
    const verifyData = verifyResponse.data.data as VerifyCheckInResult;
    if (verifyData.valid) {
      return {
        status: 'success',
        message: '签到成功',
        checkInTime: formatDate(new Date()),
      };
    } else {
      return {
        status: 'failed',
        message: '签到失败',
        failureReason: verifyData.message || '验证未通过',
      };
    }
  } else {
    throw new Error('签到验证请求失败');
  }
};

// TODO: Implement submitTaskException service if API becomes available
/**
 * 提交任务异常报告
 * 注意：此函数目前为临时实现，当API可用时需要更新
 */
export const submitTaskException = async (
  taskId: string,
  reason: string,
  images?: string[]
): Promise<boolean> => {
  // 当API可用时，替换为实际实现
  console.warn('submitTaskException API尚未实现，将使用模拟实现');

  try {
    // 这里是临时模拟实现，当API可用时应替换为实际接口调用
    // 例如：await checkinTasksApi.checkinTasksTaskIdExceptionPost(Number(taskId), { reason, images });

    // 模拟异步操作
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 返回成功
    return true;
  } catch (error) {
    console.error('提交任务异常失败:', error);
    throw new Error('提交任务异常失败，API尚未实现');
  }
};

// --- Admin Task Services ---

export const getAdminGroupTasks = async (
  groupId: string
): Promise<AdminTaskType[]> => {
  const response = await checkinTasksApi.groupsGroupIdCheckinTasksGet(
    Number(groupId)
  );
  if (
    response.data &&
    response.data.code === BaseResponseCodeEnum._0 &&
    response.data.data
  ) {
    // 将 API 的 CheckinTask 类型转换为前端使用的 AdminTaskType 类型
    const tasks = response.data.data as CheckinTask[];
    return tasks.map((task) => ({
      id: task.taskId.toString(),
      title: task.taskName,
      groupId: task.groupId.toString(),
      startTime: formatUnixTimestamp(task.startTime),
      endTime: formatUnixTimestamp(task.endTime),
      status: task.status,
      type: {
        gps: task.verificationConfig?.checkinMethods?.gps || false,
        face: task.verificationConfig?.checkinMethods?.face || false,
        wifi: task.verificationConfig?.checkinMethods?.wifi || false,
        nfc: task.verificationConfig?.checkinMethods?.nfc || false,
      },
      location:
        task.verificationConfig?.locationInfo?.location &&
        task.verificationConfig.locationInfo.location.latitude &&
        task.verificationConfig.locationInfo.location.longitude
          ? {
              latitude: task.verificationConfig.locationInfo.location.latitude,
              longitude:
                task.verificationConfig.locationInfo.location.longitude,
              radius: task.verificationConfig.locationInfo.radius || 0,
            }
          : undefined,
      wifi: task.verificationConfig?.wifiInfo,
      nfcTagId: task.verificationConfig.nfcInfo?.tagId,
      description: task.description,
    }));
  } else {
    throw new Error('获取管理任务列表失败');
  }
};

export const createAdminTask = async (
  data: Omit<AdminTaskType, 'id' | 'status'>
): Promise<AdminTaskType> => {
  const verificationConfig: TaskVerificationConfig = {
    checkinMethods: {
      gps: data.type.gps,
      face: data.type.face,
      wifi: data.type.wifi,
      nfc: data.type.nfc,
    },
    locationInfo: {
      location: data.location
        ? {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          }
        : {},
      radius: data.location?.radius ?? 0,
    },
    wifiInfo: data.wifi,
    nfcInfo: data.nfcTagId ? { tagId: data.nfcTagId } : undefined,
  };

  const response = await checkinTasksApi.groupsGroupIdCheckinTasksPost(
    Number(data.groupId),
    {
      taskName: data.title,
      description: data.description,
      startTime: Math.floor(new Date(data.startTime).getTime() / 1000),
      endTime: Math.floor(new Date(data.endTime).getTime() / 1000),
      verificationConfig: verificationConfig,
    }
  );

  if (
    response.data &&
    response.data.code === BaseResponseCodeEnum._0 &&
    response.data.data
  ) {
    // 将 API 的 CheckinTask 类型转换为前端使用的 AdminTaskType 类型
    const task = response.data.data as CheckinTask;
    return {
      id: task.taskId.toString(),
      title: task.taskName,
      groupId: task.groupId.toString(),
      startTime: formatUnixTimestamp(task.startTime),
      endTime: formatUnixTimestamp(task.endTime),
      status: task.status,
      type: {
        gps: task.verificationConfig.checkinMethods.gps || false,
        face: task.verificationConfig.checkinMethods.face || false,
        wifi: task.verificationConfig.checkinMethods.wifi || false,
        nfc: task.verificationConfig.checkinMethods.nfc || false,
      },
      location:
        task.verificationConfig.locationInfo.location &&
        task.verificationConfig.locationInfo.location.latitude &&
        task.verificationConfig.locationInfo.location.longitude
          ? {
              latitude: task.verificationConfig.locationInfo.location.latitude,
              longitude:
                task.verificationConfig.locationInfo.location.longitude,
              radius: task.verificationConfig.locationInfo.radius || 0,
            }
          : undefined,
      wifi: task.verificationConfig.wifiInfo,
      nfcTagId: task.verificationConfig.nfcInfo?.tagId,
      description: task.description,
    };
  } else {
    throw new Error('创建管理任务失败');
  }
};

export const updateAdminTask = async (
  taskId: string,
  data: Omit<AdminTaskType, 'id' | 'status'>
): Promise<AdminTaskType> => {
  // 校验开始时间是否已过
  const taskStartTime = new Date(data.startTime).getTime();
  if (taskStartTime <= Date.now()) {
    throw new Error('任务已开始或已过开始时间，无法修改');
  }

  const verificationConfig: TaskVerificationConfig = {
    checkinMethods: {
      gps: data.type.gps,
      face: data.type.face,
      wifi: data.type.wifi,
      nfc: data.type.nfc,
    },
    locationInfo: {
      location: data.location
        ? {
            latitude: data.location.latitude,
            longitude: data.location.longitude,
          }
        : {},
      radius: data.location?.radius ?? 0,
    },
    wifiInfo: data.wifi,
    nfcInfo: data.nfcTagId ? { tagId: data.nfcTagId } : undefined,
  };

  const response = await checkinTasksApi.checkinTasksTaskIdPut(Number(taskId), {
    taskName: data.title,
    description: data.description ?? '',
    startTime: Math.floor(new Date(data.startTime).getTime() / 1000),
    endTime: Math.floor(new Date(data.endTime).getTime() / 1000),
    verificationConfig: verificationConfig,
  });

  if (
    response.data &&
    response.data.code === BaseResponseCodeEnum._0 &&
    response.data.data
  ) {
    // 将 API 的 CheckinTask 类型转换为前端使用的 AdminTaskType 类型
    const task = response.data.data as CheckinTask;
    return {
      id: task.taskId.toString(),
      title: task.taskName,
      groupId: task.groupId.toString(),
      startTime: formatUnixTimestamp(task.startTime),
      endTime: formatUnixTimestamp(task.endTime),
      status: task.status,
      type: {
        gps: task.verificationConfig.checkinMethods.gps || false,
        face: task.verificationConfig.checkinMethods.face || false,
        wifi: task.verificationConfig.checkinMethods.wifi || false,
        nfc: task.verificationConfig.checkinMethods.nfc || false,
      },
      location:
        task.verificationConfig.locationInfo.location &&
        task.verificationConfig.locationInfo.location.latitude &&
        task.verificationConfig.locationInfo.location.longitude
          ? {
              latitude: task.verificationConfig.locationInfo.location.latitude,
              longitude:
                task.verificationConfig.locationInfo.location.longitude,
              radius: task.verificationConfig.locationInfo.radius || 0,
            }
          : undefined,
      wifi: task.verificationConfig.wifiInfo,
      nfcTagId: task.verificationConfig.nfcInfo?.tagId,
      description: task.description,
    };
  } else {
    throw new Error('更新管理任务失败');
  }
};

export const deleteAdminTask = async (taskId: string): Promise<boolean> => {
  const response = await checkinTasksApi.checkinTasksTaskIdDelete(
    Number(taskId)
  );
  if (response.data && response.data.code === BaseResponseCodeEnum._0) {
    return true;
  } else {
    // Throw specific error maybe based on response code/message
    throw new Error('删除管理任务失败');
  }
};

// --- CheckIn Services ---

export const checkInService = {
  // 获取签到历史记录
  getHistory: async (): Promise<{
    success: boolean;
    data?: CheckinRecord[];
    error?: string;
  }> => {
    try {
      const response = await checkinRecordsApi.usersMeCheckinRecordsGet();

      if (
        response.data &&
        response.data.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        // 直接使用API返回的 CheckinRecord[] 类型数据，如果字段匹配的话
        // 注意：API返回的Record可能与前端所需的 CheckinRecord 结构有差异，需要确认
        // 如果有差异，需要进行映射转换
        const records: CheckinRecord[] = response.data.data as CheckinRecord[];

        return {
          success: true,
          data: records,
        };
      } else {
        const errorMsg = response.data
          ? '获取签到历史记录失败'
          : '获取签到历史记录失败';
        console.error('获取签到历史记录失败:', response.data);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('获取签到历史记录异常:', error);
      return {
        success: false,
        error: '获取签到历史记录失败，请检查网络连接',
      };
    }
  },

  // 获取签到详情
  getDetail: async (
    id: string
  ): Promise<{ success: boolean; data?: CheckInDetail; error?: string }> => {
    try {
      const response = await checkinRecordsApi.usersMeCheckinRecordsGet();
      if (
        response.data &&
        response.data.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        const record = (response.data.data as CheckinRecord[]).find(
          (r) => String(r.recordId) === id
        );

        if (!record) {
          return {
            success: false,
            error: '未找到指定的签到记录',
          };
        }
        // 直接返回找到的 CheckinRecord，因为 CheckInDetail = CheckinRecord
        return {
          success: true,
          data: record as CheckInDetail, // 类型断言
        };
      } else {
        const errorMsg = response.data
          ? '获取签到详情失败'
          : '获取签到详情失败';
        console.error('获取签到详情失败:', response.data);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('获取签到详情异常:', error);
      return {
        success: false,
        error: '获取签到详情失败，请检查网络连接',
      };
    }
  },

  // 单独验证某一种签到类型
  verifyCheckInType: async (
    taskId: string,
    verifyType: 'gps' | 'face' | 'wifi' | 'nfc',
    data: {
      location?: { latitude: number; longitude: number };
      faceDataArray?: string[];
      wifiInfo?: { ssid: string; bssid: string };
      nfcId?: string;
    }
  ): Promise<VerificationResult> => {
    try {
      if (verifyType === 'face') {
        if (!data.faceDataArray || data.faceDataArray.length === 0) {
          return {
            type: 'face',
            verified: false,
            reason: '未提供人脸数据或数据为空',
            message: '未提供人脸数据或数据为空',
          };
        }

        // 严格验证必须是5张图片
        if (data.faceDataArray.length !== 5) {
          return {
            type: 'face',
            verified: false,
            reason: `人脸数据数量不正确，期望5张，实际${data.faceDataArray.length}张`,
            message: `人脸数据数量不正确，期望5张，实际${data.faceDataArray.length}张`,
          };
        }

        const currentUser = useAuth.getState().user;
        if (!currentUser || !currentUser.id) {
          return {
            type: 'face',
            verified: false,
            reason: '无法获取用户信息，请重新登录',
            message: '无法获取用户信息，请重新登录',
          };
        }
        const userId = parseInt(currentUser.id, 10);

        if (isNaN(userId)) {
          return {
            type: 'face',
            verified: false,
            reason: '无效的用户ID格式',
            message: '无效的用户ID格式',
          };
        }

        try {
          // 增加请求超时和错误处理
          console.log(`[请求开始]array:${data.faceDataArray.length}`);

          // 计算每个图片的大小并输出
          const imageSizes = data.faceDataArray.map((base64) => {
            // 去除base64前缀部分，只计算实际数据大小
            const base64Data = base64.split(',')[1] || base64;
            // 计算base64字符串的字节大小并转换为KB
            const sizeInBytes = (base64Data.length * 3) / 4;
            return Math.round(sizeInBytes / 1024); // 转换为KB并四舍五入
          });

          // 计算总大小
          const totalSizeKB = imageSizes.reduce((sum, size) => sum + size, 0);
          console.log(`[人脸图片总大小] ${totalSizeKB} KB`);

          // 使用Promise.race来设置超时
          const timeoutPromise = new Promise<any>((_, reject) => {
            setTimeout(() => reject(new Error('人脸验证请求超时')), 15000); // 15秒超时
          });

          // 实际API请求
          const apiPromise = faceApi.usersMeFaceVerifyPost({
            userId: userId,
            faceImagesBase64: data.faceDataArray,
          });

          // 使用Promise.race竞争，谁先完成就用谁的结果
          const response = await Promise.race([apiPromise, timeoutPromise]);

          console.log(
            'Face verification API response data:',
            response.data.data
          );

          if (
            response.data &&
            response.data.code === BaseResponseCodeEnum._0 &&
            response.data.data &&
            typeof (response.data.data as any).isMatch === 'boolean'
          ) {
            const isMatch = (response.data.data as any).isMatch;
            const responseMessage = (response.data as any).message || '';
            return {
              type: 'face',
              verified: isMatch,
              message: isMatch
                ? '人脸验证成功'
                : responseMessage || '人脸验证失败，请重试',
              reason: isMatch ? '人脸匹配' : responseMessage || '人脸不匹配',
            };
          } else {
            const errorMsg =
              (response.data as any).message || '人脸验证接口未能成功处理请求';
            console.error(`人脸验证失败 (API: ${errorMsg}):`, response.data);
            return {
              type: 'face',
              verified: false,
              reason: errorMsg,
              message: errorMsg,
            };
          }
        } catch (faceError: any) {
          console.error(
            '人脸验证异常 (调用 faceApi):',
            faceError.response?.data || faceError.message,
            '[数据长度]',
            data.faceDataArray?.length
          );
          console.error(faceError);

          // 检查是否为网络错误，优化错误处理
          let errorMessage = '人脸验证请求失败，请检查网络或联系管理员';

          if (faceError.message && faceError.message.includes('超时')) {
            errorMessage = '人脸验证请求超时，请重试';
          } else if (
            faceError.message &&
            faceError.message.includes('Network Error')
          ) {
            errorMessage = '网络连接错误，请检查网络后重试';
          } else if (faceError.response?.status === 413) {
            errorMessage = '图像数据过大，请确保光线良好并靠近摄像头';
          } else if (faceError.response?.data?.message) {
            errorMessage = faceError.response.data.message;
          } else if (faceError.message) {
            errorMessage = faceError.message;
          }

          return {
            type: 'face',
            verified: false,
            reason: errorMessage,
            message: errorMessage,
          };
        }
      } else {
        let apiVerifyType: InlineObject11VerifyTypeEnum;
        const verificationDataForTask: Partial<VerificationData> = {};

        switch (verifyType) {
          case 'gps':
            apiVerifyType = InlineObject11VerifyTypeEnum.Gps;
            if (data.location) {
              verificationDataForTask.locationInfo = {
                location: {
                  latitude: data.location.latitude,
                  longitude: data.location.longitude,
                },
              };
            } else {
              return {
                type: 'gps',
                verified: false,
                reason: '未提供GPS数据',
                message: '未提供GPS数据',
              };
            }
            break;
          case 'wifi':
            apiVerifyType = InlineObject11VerifyTypeEnum.Wifi;
            if (data.wifiInfo) {
              verificationDataForTask.wifiInfo = data.wifiInfo as WifiInfo;
            } else {
              return {
                type: 'wifi',
                verified: false,
                reason: '未提供WiFi数据',
                message: '未提供WiFi数据',
              };
            }
            break;
          case 'nfc':
            apiVerifyType = InlineObject11VerifyTypeEnum.Nfc;
            if (data.nfcId) {
              verificationDataForTask.nfcInfo = { tagId: data.nfcId };
            } else {
              return {
                type: 'nfc',
                verified: false,
                reason: '未提供NFC数据',
                message: '未提供NFC数据',
              };
            }
            break;
          default:
            const exhaustiveCheck: never = verifyType;
            console.error(`未知的验证类型: ${exhaustiveCheck}`);
            return {
              type: verifyType as any,
              verified: false,
              reason: `不支持的验证类型: ${verifyType}`,
              message: `不支持的验证类型: ${verifyType}`,
            };
        }

        const response = await checkinTasksApi.checkinTasksTaskIdVerifyPost(
          Number(taskId),
          {
            verifyType: apiVerifyType,
            verificationData: verificationDataForTask as VerificationData,
          }
        );

        if (
          response.data &&
          response.data.code === BaseResponseCodeEnum._0 &&
          response.data.data
        ) {
          const verifyResult = response.data.data as {
            message?: string;
            valid?: boolean;
            verifyType?: string;
          };
          return {
            type: verifyType,
            verified: verifyResult.valid === true,
            reason: verifyResult.message,
            message: verifyResult.message,
          };
        } else {
          const errorMsg =
            (response.data as any).message || `${verifyType}验证接口处理失败`;
          console.error(
            `${verifyType}验证失败 (API: ${errorMsg}):`,
            response.data
          );
          return {
            type: verifyType,
            verified: false,
            reason: errorMsg,
            message: errorMsg,
          };
        }
      }
    } catch (error: any) {
      console.error(
        `${verifyType}验证顶层异常:`,
        error.response?.data || error.message
      );
      const errorMessage =
        (error.response?.data as any)?.message ||
        error.message ||
        `${verifyType}验证请求发生未知错误`;
      return {
        type: verifyType,
        verified: false,
        reason: errorMessage,
        message: errorMessage,
      };
    }
  },

  // 提交签到
  submitCheckIn: async (
    taskId: string,
    data: {
      location?: { latitude: number; longitude: number };
      faceData?: string;
      wifiInfo?: { ssid: string; bssid: string };
    },
    groupId?: number
  ): Promise<{
    success: boolean;
    message?: string;
    checkInTime?: string;
    recordId?: number;
    error?: string;
  }> => {
    try {
      // 确保始终提供locationInfo对象，即使location为空
      const verificationData = {
        locationInfo: {
          location: data.location || { latitude: 0, longitude: 0 },
        },
        faceData: data.faceData,
        wifiInfo: data.wifiInfo,
      };

      const signinTime = Math.floor(Date.now() / 1000);

      const response = await checkinRecordsApi.checkinTasksTaskIdCheckinPost(
        Number(taskId),
        {
          verificationData,
          signinTime,
          groupId: groupId,
        }
      );

      if (
        response.data &&
        response.data.code === BaseResponseCodeEnum._0 &&
        response.data.data
      ) {
        const responseData = response.data.data as {
          recordId: number;
          signedTime: number;
          success: boolean;
        };

        return {
          success: responseData.success,
          message: '签到成功',
          recordId: responseData.recordId,
          checkInTime: formatUnixTimestamp(responseData.signedTime),
        };
      } else {
        const errorMsg = response.data ? '签到提交失败' : '签到提交失败';
        console.error('签到提交失败:', response.data);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('签到提交异常:', error);
      return {
        success: false,
        error: '签到提交失败，请检查网络连接',
      };
    }
  },
};
