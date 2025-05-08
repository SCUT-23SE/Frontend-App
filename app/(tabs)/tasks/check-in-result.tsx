import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react-native';
import { useTasksStore } from '@/stores/tasks';

export default function CheckInResultScreen() {
  const router = useRouter();
  const { checkIn, resetCheckInState } = useTasksStore();

  const handleClose = () => {
    resetCheckInState();
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {checkIn.status === 'success' ? (
          <>
            <CheckCircle2 size={64} color="#4CAF50" />
            <Text style={styles.title}>签到成功</Text>
            <Text style={styles.message}>{checkIn.message}</Text>
            {checkIn.checkInTime && (
              <Text style={styles.time}>
                签到时间：{new Date(checkIn.checkInTime).toLocaleString()}
              </Text>
            )}
          </>
        ) : (
          <>
            <XCircle size={64} color="#F44336" />
            <Text style={styles.title}>签到失败</Text>
            <Text style={styles.message}>{checkIn.message}</Text>
            {checkIn.failureReason && (
              <Text style={styles.failureReason}>
                失败原因：{checkIn.failureReason}
              </Text>
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleClose}>
        <Text style={styles.buttonText}>关闭</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  time: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  failureReason: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});