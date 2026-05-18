import React, {useEffect, useMemo, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {StickerPickerModal} from '../components/StickerPickerModal';
import {StickerSlot} from '../components/StickerSlot';
import {conditions} from '../data/templates';
import {getChecklistById, saveChecklist} from '../storage/checklists';
import type {Checklist, RootStackParamList, StickerSlotKey} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ShareCard'>;

const stickerOptions = ['✨', '💖', '🎤', '🎟️', '☕', '🛍️', '🌧️', '❄️'];

const slotPositions: Record<StickerSlotKey, object> = {
  topLeft: {left: 14, top: 14},
  topRight: {right: 14, top: 14},
  bottomLeft: {bottom: 14, left: 14},
  bottomRight: {bottom: 14, right: 14},
};

export function ShareCardScreen({route}: Props) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [activeSlot, setActiveSlot] = useState<StickerSlotKey | null>(null);

  useEffect(() => {
    const loadChecklist = async () => {
      const storedChecklist = await getChecklistById(route.params.checklistId);
      setChecklist(storedChecklist ?? null);
    };

    loadChecklist();
  }, [route.params.checklistId]);

  const selectedConditionLabels = useMemo(() => {
    if (!checklist) {
      return [];
    }

    return conditions
      .filter(condition => checklist.selectedConditions.includes(condition.id))
      .map(condition => condition.label);
  }, [checklist]);

  const previewItems = useMemo(() => {
    if (!checklist) {
      return [];
    }

    return checklist.items.slice(0, 5);
  }, [checklist]);

  const checkedCount = checklist?.items.filter(item => item.checked).length ?? 0;
  const totalCount = checklist?.items.length ?? 0;

  const persistChecklist = async (nextChecklist: Checklist) => {
    setChecklist(nextChecklist);
    await saveChecklist(nextChecklist);
  };

  const handleSelectSticker = async (emoji: string) => {
    if (!checklist || !activeSlot) {
      return;
    }

    const nextChecklist = {
      ...checklist,
      updatedAt: new Date().toISOString(),
      stickers: {
        ...checklist.stickers,
        [activeSlot]: emoji,
      },
    };

    setActiveSlot(null);
    await persistChecklist(nextChecklist);
  };

  const handleClearSticker = async () => {
    if (!checklist || !activeSlot) {
      return;
    }

    const nextChecklist = {
      ...checklist,
      updatedAt: new Date().toISOString(),
      stickers: {
        ...checklist.stickers,
        [activeSlot]: null,
      },
    };

    setActiveSlot(null);
    await persistChecklist(nextChecklist);
  };

  const handleShare = async () => {
    if (!checklist) {
      Alert.alert('공유할 체크리스트를 찾지 못했습니다.');
      return;
    }

    const completedItems = checklist.items
      .filter(item => item.checked)
      .slice(0, 5)
      .map(item => `• ${item.name}`)
      .join('\n');

    const shareMessage = [
      `${checklist.icon} ${checklist.title}`,
      `진행률: ${checkedCount}/${totalCount}`,
      selectedConditionLabels.length > 0
        ? `상황: ${selectedConditionLabels.join(', ')}`
        : '상황: 기본 템플릿',
      completedItems || '• 아직 체크된 항목이 없습니다.',
    ].join('\n');

    try {
      await Share.share({message: shareMessage});
    } catch {
      Alert.alert('공유를 열지 못했습니다.');
    }
  };

  if (!checklist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>공유 카드를 불러오지 못했습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.previewWrap}>
          <View style={styles.previewCard}>
            <StickerSlot
              onPress={() => setActiveSlot('topLeft')}
              positionStyle={slotPositions.topLeft}
              value={checklist.stickers.topLeft}
            />
            <StickerSlot
              onPress={() => setActiveSlot('topRight')}
              positionStyle={slotPositions.topRight}
              value={checklist.stickers.topRight}
            />
            <StickerSlot
              onPress={() => setActiveSlot('bottomLeft')}
              positionStyle={slotPositions.bottomLeft}
              value={checklist.stickers.bottomLeft}
            />
            <StickerSlot
              onPress={() => setActiveSlot('bottomRight')}
              positionStyle={slotPositions.bottomRight}
              value={checklist.stickers.bottomRight}
            />

            <View style={styles.previewHeader}>
              <Text style={styles.previewIcon}>{checklist.icon}</Text>
              <Text style={styles.previewTitle}>{checklist.title}</Text>
              <Text style={styles.previewMeta}>
                진행률 {checkedCount}/{totalCount}
              </Text>
            </View>

            <View style={styles.previewConditions}>
              {selectedConditionLabels.length > 0 ? (
                selectedConditionLabels.map(label => (
                  <Text key={label} style={styles.previewChip}>
                    {label}
                  </Text>
                ))
              ) : (
                <Text style={styles.previewChip}>기본 템플릿</Text>
              )}
            </View>

            <View style={styles.previewList}>
              {previewItems.map(item => (
                <Text key={item.id} style={styles.previewItem}>
                  {item.checked ? '☑︎' : '☐'} {item.name}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.helpBox}>
          <Text style={styles.helpTitle}>꾸미기 안내</Text>
          <Text style={styles.helpText}>
            카드 모서리의 4개 슬롯을 눌러 이모지 스티커를 고를 수 있습니다.
            내보내기는 현재 텍스트 공유로만 동작합니다.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handleShare} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>내보내기</Text>
        </Pressable>
      </View>

      <StickerPickerModal
        visible={activeSlot !== null}
        options={stickerOptions}
        onClose={() => setActiveSlot(null)}
        onSelect={emoji => {
          handleSelectSticker(emoji);
        }}
        onClear={() => {
          handleClearSticker();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: 20,
    padding: 20,
    paddingBottom: 120,
  },
  previewWrap: {
    alignItems: 'center',
  },
  previewCard: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 28,
    borderWidth: 1,
    minHeight: 360,
    overflow: 'hidden',
    padding: 24,
    paddingTop: 70,
    position: 'relative',
    width: '100%',
  },
  previewHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  previewIcon: {
    fontSize: 42,
  },
  previewTitle: {
    color: '#241b16',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  previewMeta: {
    color: '#b05f3c',
    fontSize: 14,
    fontWeight: '700',
  },
  previewConditions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 18,
  },
  previewChip: {
    backgroundColor: '#ffe4d6',
    borderRadius: 999,
    color: '#8a4d2b',
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  previewList: {
    backgroundColor: '#fff',
    borderColor: '#eadccd',
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  previewItem: {
    color: '#241b16',
    fontSize: 15,
    lineHeight: 20,
  },
  helpBox: {
    backgroundColor: '#fffaf5',
    borderColor: '#eadccd',
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  helpTitle: {
    color: '#241b16',
    fontSize: 16,
    fontWeight: '700',
  },
  helpText: {
    color: '#6d5e55',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    backgroundColor: '#f7f1ea',
    borderTopColor: '#eadccd',
    borderTopWidth: 1,
    padding: 16,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#241b16',
    borderRadius: 16,
    paddingVertical: 16,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#241b16',
    fontSize: 18,
    fontWeight: '700',
  },
});
