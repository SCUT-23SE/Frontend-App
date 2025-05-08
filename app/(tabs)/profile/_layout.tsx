import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '我的',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="check-in-history"
        options={{
          title: '签到历史',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="check-in-detail"
        options={{
          title: '记录详情',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="face-management"
        options={{
          title: '人脸信息管理',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: '设置',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}