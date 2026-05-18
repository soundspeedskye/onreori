import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {getEventCategoryById} from '../data/eventCategories';
import {
  createRoom,
  joinRoomWithCode,
  listRoomsByCategory,
} from '../services/rooms';
import type {EventRoom, RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EventRooms'>;

export function EventRoomsScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const category = getEventCategoryById(route.params.categoryId);
  const [rooms, setRooms] = useState<EventRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [entryCode, setEntryCode] = useState('');
  const [title, setTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [newRoomCode, setNewRoomCode] = useState('');

  const loadRooms = useCallback(async () => {
    if (!category) {
      return;
    }

    setLoading(true);
    try {
      setRooms(await listRoomsByCategory(category.id));
    } catch (error) {
      Alert.alert(
        '단톡방을 불러오지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth', {
        redirect: {type: 'eventRooms', categoryId: route.params.categoryId},
      });
      return;
    }

    loadRooms();
  }, [loadRooms, navigation, route.params.categoryId, user]);

  const handleCreateRoom = async () => {
    if (!user || !category) {
      return;
    }

    if (!title.trim() || !newRoomCode.trim()) {
      Alert.alert('방 제목과 입장코드를 입력하세요.');
      return;
    }

    try {
      setCreating(true);
      const room = await createRoom({
        categoryId: category.id,
        title,
        eventDate,
        location,
        entryCode: newRoomCode,
        user,
      });
      setRooms(current => [room, ...current]);
      setTitle('');
      setEventDate('');
      setLocation('');
      setNewRoomCode('');
    } catch (error) {
      Alert.alert(
        '방을 만들지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (room: EventRoom) => {
    if (!user) {
      return;
    }

    try {
      await joinRoomWithCode(room.id, entryCode, user);
      setEntryCode('');
      setSelectedRoomId(null);
      navigation.navigate('RoomChat', {roomId: room.id, title: room.title});
    } catch (error) {
      Alert.alert(
        '입장하지 못했습니다.',
        error instanceof Error ? error.message : '입장코드를 확인하세요.',
      );
    }
  };

  if (!category) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>카테고리를 찾지 못했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{category.title} 단톡방</Text>
          <Text style={styles.description}>
            방을 만들거나 공유받은 입장코드로 오늘의 이벤트 방에 들어가세요.
          </Text>

          <View style={styles.createBox}>
            <Text style={styles.sectionTitle}>방 만들기</Text>
            <TextInput
              onChangeText={setTitle}
              placeholder="예: KSPO 2일차 대기방"
              placeholderTextColor="#9d8f86"
              style={styles.input}
              value={title}
            />
            <View style={styles.inlineFields}>
              <TextInput
                onChangeText={setEventDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9d8f86"
                style={[styles.input, styles.inlineInput]}
                value={eventDate}
              />
              <TextInput
                onChangeText={setLocation}
                placeholder="장소"
                placeholderTextColor="#9d8f86"
                style={[styles.input, styles.inlineInput]}
                value={location}
              />
            </View>
            <TextInput
              onChangeText={setNewRoomCode}
              placeholder="입장코드"
              placeholderTextColor="#9d8f86"
              secureTextEntry
              style={styles.input}
              value={newRoomCode}
            />
            <Pressable
              disabled={creating}
              onPress={handleCreateRoom}
              style={styles.createButton}>
              <Text style={styles.createButtonText}>
                {creating ? '만드는 중...' : '단톡방 만들기'}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>오늘의 이벤트 단톡방</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#ff6b6b" style={styles.loader} />
        ) : rooms.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>아직 만들어진 방이 없습니다.</Text>
            <Text style={styles.emptyText}>첫 방을 만들어 현장 정보를 모아보세요.</Text>
          </View>
        ) : (
          <View style={styles.roomList}>
            {rooms.map(item => (
              <View key={item.id} style={styles.roomCard}>
                <Text style={styles.roomTitle}>{item.title}</Text>
                <Text style={styles.roomMeta}>
                  {item.eventDate} · {item.location}
                </Text>
                <Text style={styles.roomMembers}>참여 {item.memberCount}명</Text>
                {selectedRoomId === item.id ? (
                  <View style={styles.joinBox}>
                    <TextInput
                      onChangeText={setEntryCode}
                      placeholder="입장코드"
                      placeholderTextColor="#9d8f86"
                      secureTextEntry
                      style={styles.input}
                      value={entryCode}
                    />
                    <Pressable
                      onPress={() => {
                        handleJoinRoom(item);
                      }}
                      style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>입장하기</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setSelectedRoomId(item.id)}
                    style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>입장코드 입력</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f7f1ea',
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 14,
    marginBottom: 14,
  },
  title: {
    color: '#241b16',
    fontSize: 28,
    fontWeight: '900',
  },
  description: {
    color: '#5f5047',
    fontSize: 15,
    lineHeight: 22,
  },
  sectionTitle: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '900',
  },
  createBox: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 22,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  input: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 15,
    borderWidth: 1,
    color: '#241b16',
    fontSize: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineInput: {
    flex: 1,
  },
  createButton: {
    alignItems: 'center',
    backgroundColor: '#241b16',
    borderRadius: 15,
    paddingVertical: 13,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  loader: {
    marginTop: 18,
  },
  roomList: {
    gap: 12,
  },
  roomCard: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 20,
    borderWidth: 1,
    gap: 7,
    padding: 16,
  },
  roomTitle: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '900',
  },
  roomMeta: {
    color: '#5f5047',
    fontSize: 14,
  },
  roomMembers: {
    color: '#b05f3c',
    fontSize: 12,
    fontWeight: '800',
  },
  joinBox: {
    gap: 8,
    marginTop: 4,
  },
  joinButton: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 15,
    marginTop: 4,
    paddingVertical: 13,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#241b16',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: '#6d5e55',
    fontSize: 14,
  },
});
