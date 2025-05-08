import { GroupMember } from '@/gen/models';

// 定义应用内部使用的 Member 类型
export interface Member {
  id: number; // 使用 number 类型 ID
  name: string;
  joinTime: Date; // 使用 Date 类型
  role: 'admin' | 'member' | 'unknown'; // 增加 unknown 以处理非预期值
}

// 将 API 返回的 GroupMember 映射到内部 Member 类型
export function mapGroupMemberToMember(apiMember: GroupMember): Member {
  // 提供默认值以处理可选字段
  const id = apiMember.userId ?? -1; // 使用 -1 或其他方式标记无效 ID
  const name = apiMember.username ?? '未知用户';
  // 将 Unix 时间戳 (秒) 转换为 Date 对象
  const joinTime = apiMember.joinedAt
    ? new Date(apiMember.joinedAt * 1000)
    : new Date(0); // 使用 epoch 作为默认值

  let role: Member['role'] = 'unknown';
  if (apiMember.role?.toLowerCase() === 'admin') {
    role = 'admin';
  } else if (apiMember.role?.toLowerCase() === 'member') {
    role = 'member';
  }

  // 对 id === -1 的情况进行额外处理，例如抛出错误或返回 null/undefined
  if (id === -1) {
    console.warn('Received GroupMember with invalid userId:', apiMember);
    // 或者根据需要抛出错误: throw new Error('Invalid member data received');
  }

  return {
    id,
    name,
    joinTime,
    role,
  };
}

// 可选：如果需要批量映射
export function mapGroupMembersToMembers(apiMembers: GroupMember[]): Member[] {
  return apiMembers
    .map(mapGroupMemberToMember)
    .filter((member) => member.id !== -1); // 过滤掉无效成员
}
