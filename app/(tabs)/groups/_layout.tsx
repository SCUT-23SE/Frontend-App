import { Stack } from 'expo-router';

export default function GroupsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '用户组',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="group-detail"
        options={{
          title: '用户组信息',
          presentation: 'card',
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="create-group"
        options={{
          title: '创建用户组',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="join-group"
        options={{
          title: '加入用户组',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="group-manage"
        options={{
          title: '用户组管理',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="admin-tasks"
        options={{
          title: '签到任务管理',
          headerBackTitle: '返回',
        }}
      />
      <Stack.Screen
        name="admin-task-form"
        options={({ route }) => ({
          title: route.params?.taskId ? '更新签到任务' : '创建签到任务',
          presentation: 'modal',
        })}
      />
      <Stack.Screen
        name="admin-members"
        options={{
          title: '成员列表',
        }}
      />
      <Stack.Screen
        name="admin-applications"
        options={{
          title: '入组申请',
        }}
      />
    </Stack>
  );
}
