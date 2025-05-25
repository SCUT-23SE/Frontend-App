import { Platform } from 'react-native';
import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';

/**
 * 定义深度链接配置
 */
export const linkingConfig: LinkingOptions<any> = {
  prefixes: ['teamtick://', 'https://teamtick.app', 'http://teamtick.app'],
  config: {
    screens: {
      // 定义路由映射
      '(tabs)': {
        screens: {
          tasks: {
            screens: {
              'task-detail': {
                path: 'tasks/detail/:id',
                parse: {
                  id: (id: string) => id,
                },
              },
            },
          },
          groups: {
            screens: {
              'join-group': {
                path: 'groups/join/:groupId',
                parse: {
                  groupId: (groupId: string) => groupId,
                },
              },
              'group-detail': 'groups/detail/:groupId',
            },
          },
        },
      },
    },
  },
};

/**
 * 处理传入的URL
 * @param url 传入的URL
 * @returns 是否成功处理
 */
export const handleDeepLink = (url: string | null): boolean => {
  if (!url) return false;

  try {
    const { hostname, path, queryParams } = Linking.parse(url);

    console.log('Deep link received:', { hostname, path, queryParams });

    // 根据hostname和path组合处理不同类型的链接

    // 任务详情链接处理
    if (hostname === 'tasks' && path === 'detail' && queryParams?.id) {
      router.push(`/tasks/task-detail?id=${queryParams.id}`);
      return true;
    }

    // 加入组织链接处理
    if (hostname === 'groups' && path === 'join' && queryParams?.groupId) {
      router.push(`/groups/join-group?groupId=${queryParams.groupId}`);
      return true;
    }

    // 组织详情链接处理
    if (hostname === 'groups' && path === 'detail' && queryParams?.groupId) {
      router.push(`/groups/group-detail?groupId=${queryParams.groupId}`);
      return true;
    }

    // 兼容处理旧格式的链接（如果path包含完整路径）
    if (path === 'tasks/detail' && queryParams?.id) {
      router.push(`/tasks/task-detail?id=${queryParams.id}`);
      return true;
    }

    if (path === 'groups/join' && queryParams?.groupId) {
      router.push(`/groups/join-group?groupId=${queryParams.groupId}`);
      return true;
    }

    if (path === 'groups/detail' && queryParams?.groupId) {
      router.push(`/groups/group-detail?groupId=${queryParams.groupId}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Deep link parsing error:', error);
    return false;
  }
};

/**
 * 生成深度链接
 */
export const generateDeepLinks = {
  /**
   * 生成任务详情链接
   * @param taskId 任务ID
   * @returns 深度链接
   */
  taskDetail: (taskId: string | number): string => {
    return `teamtick://tasks/detail?id=${taskId}`;
  },

  /**
   * 生成加入组织链接
   * @param groupId 组织ID
   * @returns 深度链接
   */
  joinGroup: (groupId: string | number): string => {
    return `teamtick://groups/join?groupId=${groupId}`;
  },

  /**
   * 生成组织详情链接
   * @param groupId 组织ID
   * @returns 深度链接
   */
  groupDetail: (groupId: string | number): string => {
    return `teamtick://groups/detail?groupId=${groupId}`;
  },
};

// 添加默认导出以符合expo-router的路由要求
export default function LinkingConfiguration() {
  return null;
}
