import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Task = {
  id: string;
  text: string;
  done: boolean;
  dueDate: string;
  category: string;
};

type AiSettings = {
  priorities: string[];
  workStyle: string;
  condition: string;
  memo: string;
};

const TASK_STORAGE_KEY = 'tasks';
const AI_SETTINGS_KEY = 'ai_settings';
const TASK_ADVICE_URL =
  'https://ai-chat-server-rkys.onrender.com/task-advice';

export default function RecommendScreen() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [message, setMessage] = useState('');

  const askAi = async () => {
    setIsAskingAi(true);
    setMessage('');

    try {
      const savedTasks = await AsyncStorage.getItem(TASK_STORAGE_KEY);
      const tasks: Task[] = savedTasks ? JSON.parse(savedTasks) : [];

      const unfinishedTasks = tasks.filter((task) => !task.done);

      if (unfinishedTasks.length === 0) {
        setMessage('未完了タスクがありません');
        setRecommendations([]);
        return;
      }

      const taskList = unfinishedTasks
        .map((task) =>
          `[${task.category}] ${task.text} ${
            task.dueDate ? `(期限:${task.dueDate})` : ''
          }`
        )
        .join('\n');

      const savedSettings = await AsyncStorage.getItem(AI_SETTINGS_KEY);

      const aiSettings: AiSettings = savedSettings
        ? JSON.parse(savedSettings)
        : {
            priorities: ['期限'],
            workStyle: 'どちらでも',
            condition: '普通',
            memo: '',
          };

      const response = await fetch(TASK_ADVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: taskList,
          settings: aiSettings,
        }),
      });

      const data = await response.json();
      const parsed = JSON.parse(data.reply);

      setRecommendations([
        { title: `🥇 ${parsed.first}`, reason: parsed.firstReason },
        { title: `🥈 ${parsed.second}`, reason: parsed.secondReason },
        { title: `🥉 ${parsed.third}`, reason: parsed.thirdReason },
      ]);
    } catch (error) {
      setMessage('AIにつながりませんでした');
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AIおすすめ</Text>

      <Pressable
        style={[styles.aiButton, isAskingAi && styles.disabledButton]}
        onPress={askAi}
        disabled={isAskingAi}
      >
        <Text style={styles.aiButtonText}>
          {isAskingAi ? 'AI考え中...' : '🤖 AIに聞く'}
        </Text>
      </Pressable>

      {message !== '' && <Text style={styles.message}>{message}</Text>}

      {recommendations.map((item, index) => (
        <View
          key={index}
          style={[
            styles.card,
            index === 0 && styles.goldCard,
            index === 1 && styles.silverCard,
            index === 2 && styles.bronzeCard,
          ]}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardReason}>{item.reason}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  aiButton: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  message: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  goldCard: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  silverCard: {
    backgroundColor: '#f3f4f6',
    borderColor: '#9ca3af',
  },
  bronzeCard: {
    backgroundColor: '#fde7d8',
    borderColor: '#c2410c',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardReason: {
    color: '#4b5563',
    lineHeight: 22,
  },
});