import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { User, UserMinus } from 'lucide-react-native';
import { Member } from '@/types/member';
import { groupsService } from '@/services/groups-service';

export default function MembersScreen() {
  const { id: groupIdStr } = useLocalSearchParams();
  const groupId = Number(groupIdStr);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMembers = async () => {
    if (isNaN(groupId)) {
      setError('无效的用户组 ID');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetchedMembers = await groupsService.getGroupMembers(groupId);
      setMembers(fetchedMembers);
    } catch (err: any) {
      setError(err.message || '获取成员列表失败，请稍后重试');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [groupId]);

  const handleRemoveMember = (member: Member) => {
    Alert.alert('确认移除', `确定要将成员 "${member.name}" 移出用户组吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          setLoading(true);
          try {
              await groupsService.removeGroupMember(groupId, member.id);
            setMembers((prevMembers) =>
              prevMembers.filter((m) => m.id !== member.id)
            );
            Alert.alert('成功', `成员 "${member.name}" 已被移除。`);
          } catch (err: any) {
            Alert.alert('移除失败', err.message || '移除成员时发生错误');
          } finally {
            setLoading(false);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const renderMember = ({ item }: { item: Member }) => (
    <View style={styles.memberItem}>
      <User size={20} color="gray" />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRole}>
          {item.role === 'admin' ? '管理员' : '成员'} - 加入于:{' '}
          {item.joinTime.toLocaleDateString()}
        </Text>
      </View>
      {item.role !== 'admin' && (
        <TouchableOpacity
          onPress={() => handleRemoveMember(item)}
          style={styles.removeButton}
        >
          <UserMinus size={20} color="red" />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing && members.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchMembers}>
          <Text style={styles.retryText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      renderItem={renderMember}
      keyExtractor={(item) => item.id.toString()}
      style={styles.container}
      contentContainerStyle={members.length === 0 && styles.centered}
      ListEmptyComponent={() => !loading && <Text>该用户组暂无其他成员</Text>}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  memberRole: {
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
  removeButton: {
    padding: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryText: {
    color: 'blue',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
