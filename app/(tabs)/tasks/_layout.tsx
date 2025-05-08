import { Stack } from 'expo-router';

export default function TasksLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '待处理任务',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="task-detail"
        options={{
          title: '任务详情',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="check-in-result"
        options={{
          title: '签到结果',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="exception"
        options={{
          title: '异常申请',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
