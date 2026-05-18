import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {useAuth} from '../auth/AuthContext';
import {
  listMessages,
  sendImageMessage,
  sendTextMessage,
  subscribeToRoomMessages,
} from '../services/rooms';
import type {ChatMessage, RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RoomChat'>;

export function RoomChatScreen({navigation, route}: Props) {
  const {user} = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!user) {
      navigation.replace('Auth');
      return;
    }

    let active = true;

    async function load() {
      try {
        const nextMessages = await listMessages(route.params.roomId);
        if (active) {
          setMessages(nextMessages);
        }
      } catch (error) {
        Alert.alert(
          '메시지를 불러오지 못했습니다.',
          error instanceof Error ? error.message : '다시 시도하세요.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    const unsubscribe = subscribeToRoomMessages(route.params.roomId, message => {
      setMessages(current =>
        current.some(item => item.id === message.id)
          ? current
          : [...current, message],
      );
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigation, route.params.roomId, user]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 50);
    }
  }, [messages.length]);

  const handleSendText = async () => {
    if (!user || sending) {
      return;
    }

    try {
      setSending(true);
      const message = await sendTextMessage(route.params.roomId, body, user);
      setMessages(current =>
        current.some(item => item.id === message.id)
          ? current
          : [...current, message],
      );
      setBody('');
    } catch (error) {
      Alert.alert(
        '메시지를 보내지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async () => {
    if (!user || sending) {
      return;
    }

    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel) {
      return;
    }

    const asset = result.assets?.[0];

    if (!asset?.uri) {
      Alert.alert('선택한 사진을 읽지 못했습니다.');
      return;
    }

    try {
      setSending(true);
      const message = await sendImageMessage({
        roomId: route.params.roomId,
        user,
        imageUri: asset.uri,
        fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
        contentType: asset.type ?? 'image/jpeg',
      });
      setMessages(current =>
        current.some(item => item.id === message.id)
          ? current
          : [...current, message],
      );
    } catch (error) {
      Alert.alert(
        '사진을 보내지 못했습니다.',
        error instanceof Error ? error.message : '다시 시도하세요.',
      );
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({item}: {item: ChatMessage}) => {
    const isMine = item.userId === user?.id;

    return (
      <View style={[styles.messageWrap, isMine && styles.myMessageWrap]}>
        <Text style={styles.nickname}>{item.nickname}</Text>
        <View style={[styles.bubble, isMine && styles.myBubble]}>
          {item.type === 'image' && item.mediaUrl ? (
            <Image source={{uri: item.mediaUrl}} style={styles.messageImage} />
          ) : (
            <Text style={[styles.messageText, isMine && styles.myMessageText]}>
              {item.body}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>{route.params.title}</Text>
        <Text style={styles.description}>입장코드로 들어온 사람들과만 대화해요.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#ff6b6b" style={styles.loader} />
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={styles.messageList}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>아직 메시지가 없습니다.</Text>
            </View>
          }
        />
      )}

      <View style={styles.composer}>
        <Pressable
          disabled={sending}
          onPress={handleSendImage}
          style={styles.photoButton}>
          <Text style={styles.photoButtonText}>사진</Text>
        </Pressable>
        <TextInput
          onChangeText={setBody}
          placeholder="현장 정보를 공유해보세요"
          placeholderTextColor="#9d8f86"
          style={styles.input}
          value={body}
        />
        <Pressable
          disabled={sending}
          onPress={handleSendText}
          style={styles.sendButton}>
          <Text style={styles.sendButtonText}>{sending ? '...' : '전송'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#f7f1ea',
    flex: 1,
  },
  header: {
    backgroundColor: '#fffaf5',
    borderBottomColor: '#eadccd',
    borderBottomWidth: 1,
    gap: 4,
    padding: 16,
  },
  title: {
    color: '#241b16',
    fontSize: 20,
    fontWeight: '900',
  },
  description: {
    color: '#6d5e55',
    fontSize: 13,
  },
  loader: {
    flex: 1,
  },
  messageList: {
    gap: 12,
    padding: 16,
    paddingBottom: 22,
  },
  messageWrap: {
    alignItems: 'flex-start',
    gap: 4,
  },
  myMessageWrap: {
    alignItems: 'flex-end',
  },
  nickname: {
    color: '#8b8078',
    fontSize: 12,
    fontWeight: '700',
  },
  bubble: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 17,
    borderWidth: 1,
    maxWidth: '82%',
    overflow: 'hidden',
    padding: 12,
  },
  myBubble: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff6b6b',
  },
  messageText: {
    color: '#241b16',
    fontSize: 15,
    lineHeight: 21,
  },
  myMessageText: {
    color: '#fff',
  },
  messageImage: {
    borderRadius: 12,
    height: 190,
    width: 190,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 28,
  },
  emptyText: {
    color: '#7a6d64',
    fontSize: 14,
  },
  composer: {
    alignItems: 'center',
    backgroundColor: '#fffaf5',
    borderTopColor: '#eadccd',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  photoButton: {
    alignItems: 'center',
    backgroundColor: '#241b16',
    borderRadius: 14,
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  input: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 15,
    borderWidth: 1,
    color: '#241b16',
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#ff6b6b',
    borderRadius: 14,
    justifyContent: 'center',
    minWidth: 52,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
});
