import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';

import {TemplateCard} from '../components/TemplateCard';
import {templates} from '../data/templates';
import type {RootStackParamList} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Templates'>;

export function TemplatesScreen({navigation, route}: Props) {
  const visibleTemplates = route.params?.categoryId
    ? templates.filter(template => template.category === route.params?.categoryId)
    : templates;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>팬 활동 상황별 템플릿</Text>
          <Text style={styles.description}>
            콘서트, 팝업, 생카용 템플릿을 고르고 상황 조건을 더해 체크리스트를
            만드세요.
          </Text>
        </View>

        <View style={styles.templateList}>
          {visibleTemplates.map(item => (
            <TemplateCard
              key={item.id}
              template={item}
              onPress={() =>
                navigation.navigate('Conditions', {templateId: item.id})
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  header: {
    gap: 8,
    marginBottom: 18,
  },
  title: {
    color: '#241b16',
    fontSize: 28,
    fontWeight: '800',
  },
  description: {
    color: '#5f5047',
    fontSize: 15,
    lineHeight: 21,
  },
  templateList: {
    gap: 14,
  },
});
