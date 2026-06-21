import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type AiSettings = {
  priorities: string[];
  workStyle: string;
  condition: string;
  memo: string;
};

const STORAGE_KEY = 'ai_settings';

const PRIORITY_OPTIONS = ['期限', '就活', '大学', 'バイト', '健康', '趣味'];
const WORK_STYLE_OPTIONS = ['簡単なものから', '大変なものから', 'どちらでも'];
const CONDITION_OPTIONS = ['元気', '普通', '疲れている'];

export default function AiSettingsScreen() {
  const [priorities, setPriorities] = useState<string[]>(['期限']);
  const [workStyle, setWorkStyle] = useState('どちらでも');
  const [condition, setCondition] = useState('普通');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedSettings) {
        const parsed: AiSettings = JSON.parse(savedSettings);
        setPriorities(parsed.priorities ?? ['期限']);
        setWorkStyle(parsed.workStyle ?? 'どちらでも');
        setCondition(parsed.condition ?? '普通');
        setMemo(parsed.memo ?? '');
      }
    };

    loadSettings();
  }, []);

  const togglePriority = (option: string) => {
    if (priorities.includes(option)) {
      setPriorities(priorities.filter((item) => item !== option));
    } else {
      setPriorities([...priorities, option]);
    }
  };

  const saveSettings = async () => {
    const settings: AiSettings = {
      priorities,
      workStyle,
      condition,
      memo,
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    Alert.alert('保存完了', 'AI設定を保存しました');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>AI設定</Text>

      <Text style={styles.sectionTitle}>重視すること</Text>
      <Text style={styles.description}>
        AIがタスクを選ぶときに優先してほしいものを選んでください。
      </Text>

      <View style={styles.optionWrap}>
        {PRIORITY_OPTIONS.map((option) => (
          <Pressable
            key={option}
            style={[
              styles.optionButton,
              priorities.includes(option) && styles.selectedOption,
            ]}
            onPress={() => togglePriority(option)}
          >
            <Text
              style={[
                styles.optionText,
                priorities.includes(option) && styles.selectedOptionText,
              ]}
            >
              {priorities.includes(option) ? '✓ ' : ''}
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>作業スタイル</Text>

      {WORK_STYLE_OPTIONS.map((option) => (
        <Pressable
          key={option}
          style={styles.radioRow}
          onPress={() => setWorkStyle(option)}
        >
          <Text style={styles.radioMark}>
            {workStyle === option ? '●' : '○'}
          </Text>
          <Text style={styles.radioText}>{option}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>今の状態</Text>

      {CONDITION_OPTIONS.map((option) => (
        <Pressable
          key={option}
          style={styles.radioRow}
          onPress={() => setCondition(option)}
        >
          <Text style={styles.radioMark}>
            {condition === option ? '●' : '○'}
          </Text>
          <Text style={styles.radioText}>{option}</Text>
        </Pressable>
      ))}

      <Text style={styles.sectionTitle}>その他伝えたいこと</Text>
      <Text style={styles.description}>
        白紙で迷う場合は、今週優先したいことや避けたいことを書いてください。
      </Text>

      <TextInput
        style={styles.memoInput}
        value={memo}
        onChangeText={setMemo}
        multiline
        placeholder="例：今週は就活を優先したい。疲れている日は短時間で終わるものからやりたい。"
        placeholderTextColor="#9ca3af"
      />

      <Pressable style={styles.saveButton} onPress={saveSettings}>
        <Text style={styles.saveButtonText}>保存</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 22,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
  },
  selectedOption: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  optionText: {
    fontSize: 16,
    color: '#111827',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioMark: {
    fontSize: 20,
    color: '#4f46e5',
    marginRight: 10,
  },
  radioText: {
    fontSize: 17,
  },
  memoInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 100,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});