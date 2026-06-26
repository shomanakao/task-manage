import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

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

export default function HomeScreen() {
  const [taskText, setTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [category, setCategory] = useState('私用');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const STORAGE_KEY = 'tasks';
  const AI_SETTINGS_KEY = 'ai_settings';
  const TASK_ADVICE_URL =
  'https://ai-chat-server-rkys.onrender.com/task-advice';

  useEffect(() => {
    const loadTasks = async () => {
      const savedTasks = await AsyncStorage.getItem(STORAGE_KEY);

      if (savedTasks !== null) {
        setTasks(JSON.parse(savedTasks));
      }
    };

    loadTasks();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
  if (taskText.trim() === '') return;

  if (!isValidDueDate(dueDate)) {
    alert('期限は正しい日付で入力してください');
    return;
  }

  if (editingTaskId !== null) {
    setTasks(
      tasks.map((task) =>
        task.id === editingTaskId
          ? {
              ...task,
              text: taskText,
              dueDate: dueDate,
              category: category,
            }
          : task
      )
    );

    setEditingTaskId(null);
    setTaskText('');
    setDueDate('');
    Keyboard.dismiss();
    return;
  }

  const newTask: Task = {
    id: Date.now().toString(),
    text: taskText,
    done: false,
    dueDate: dueDate,
    category: category,
  };

  setTasks([newTask, ...tasks]);
  setDueDate('');
  setTaskText('');
  Keyboard.dismiss();
};

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
  };

  const isValidDueDate = (date: string) => {
    if (date.trim() === '') return true;

    const match = date.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (!match) return false;

    const month = Number(match[1]);
    const day = Number(match[2]);

    if (month < 1 || month > 12) return false;

    const daysInMonth = new Date(2026, month, 0).getDate();
    return day >= 1 && day <= daysInMonth;
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const editTask = (task: Task) => {
    setTaskText(task.text);
    setDueDate(task.dueDate);
    setCategory(task.category);
    setEditingTaskId(task.id);
  };

  const askAi = async () => {
    const unfinishedTasks = tasks.filter((task) => !task.done);

    if (unfinishedTasks.length === 0) {
      setAiAdvice('未完了タスクがありません');
      return;
    }

    setIsAskingAi(true);

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

    try {
      const response = await fetch(TASK_ADVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tasks: taskList,
          settings: aiSettings,
        }),
      });

      const data = await response.json();

      const parsed = JSON.parse(data.reply);

      setRecommendations([
        {
          title: `🥇 ${parsed.first}`,
          reason: parsed.firstReason,
        },
        {
          title: `🥈 ${parsed.second}`,
          reason: parsed.secondReason,
        },
        {
          title: `🥉 ${parsed.third}`,
          reason: parsed.thirdReason,
        },
      ]);
    } catch (error) {
      setAiAdvice('AIにつながりませんでした');
    } finally {
      setIsAskingAi(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>タスク管理</Text>

      <View style={styles.categoryRow}>
          {['就活', '大学', 'バイト', '私用'].map((item) => (
            <Pressable
              key={item}
              style={[
                styles.categoryButton,
                item === '就活' && styles.jobCategoryButton,
                item === '大学' && styles.schoolCategoryButton,
                item === 'バイト' && styles.workCategoryButton,
                item === '私用' && styles.privateCategoryButton,
                category === item && styles.selectedCategoryButton,
              ]}
              onPress={() => setCategory(item)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  category === item && styles.selectedCategoryButtonText,
                ]}
              >
                {item}
              </Text>
              </Pressable>
            ))}
        </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={taskText}
          onChangeText={setTaskText}
          placeholder="タスクを入力"
          returnKeyType="done"
          onSubmitEditing={addTask}
        />

        <TextInput
          style={styles.dueInput}
          value={dueDate}
          onChangeText={setDueDate}
          placeholderTextColor="#9ca3af"
          placeholder="期限 例: 6/20"
        />

        <Pressable style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>
            {editingTaskId !== null ? '更新' : '追加'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={[...tasks].sort((a, b) => {
          if (a.done !== b.done) {
            return Number(a.done) - Number(b.done);
          }

          if (a.dueDate === '' && b.dueDate === '') {
            return 0;
          }

          if (a.dueDate === '') {
            return 1;
          }

          if (b.dueDate === '') {
            return -1;
          }

          return a.dueDate.localeCompare(b.dueDate);
        })}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>まだタスクがありません</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Pressable
              style={styles.taskTextArea}
              onPress={() => toggleTask(item.id)}
            >
              <Text style={[styles.checkBox, item.done && styles.checked]}>
                {item.done ? '✓' : ''}
              </Text>

              <View style={styles.taskTextBox}>

                <Text
                  style={[
                    styles.categoryBadge,
                    item.category === '就活' && styles.jobBadge,
                    item.category === '大学' && styles.schoolBadge,
                    item.category === 'バイト' && styles.workBadge,
                    item.category === '私用' && styles.privateBadge,
                  ]}
                >
                  {item.category}
                </Text>

                <Text style={[styles.taskText, item.done && styles.doneText]}>
                  {item.text}
                </Text>

                {item.dueDate !== '' && (
                  <Text style={styles.dueText}>期限: {item.dueDate}</Text>
                )}
              </View>
            </Pressable>

            <Pressable onPress={() => editTask(item)}>
              <Text style={styles.editText}>編集</Text>
            </Pressable>

            <Pressable onPress={() => deleteTask(item.id)}>
              <Text style={styles.deleteText}>削除</Text>
            </Pressable>
          </View>
        )}
      />
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
  inputRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 12,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 16,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskTextArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#4f46e5',
    borderRadius: 6,
    marginRight: 12,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 18,
    color: '#4f46e5',
    fontWeight: 'bold',
  },
  checked: {
    backgroundColor: '#e0e7ff',
  },
  taskText: {
    fontSize: 18,
    flexShrink: 1,
  },
  doneText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  editText: {
    color: '#2563eb',
    fontSize: 16,
    marginLeft: 12,
  },
  deleteText: {
    color: '#ef4444',
    fontSize: 16,
    marginLeft: 12,
  },
  dueInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  taskTextBox: {
    flex: 1,
  },
  dueText: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
  },
  aiButton: {
    backgroundColor: '#10b981',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
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
  aiBox: {
    backgroundColor: '#ecfdf5',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  aiText: {
    fontSize: 16,
    color: '#065f46',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },

  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  selectedCategoryButton: {
    backgroundColor: '#4f46e5',
  },

  categoryButtonText: {
    color: '#333',
  },

  selectedCategoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
  },
  
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
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

  categoryBadge: {
  alignSelf: 'flex-start',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
  color: '#fff',
  fontSize: 12,
  marginBottom: 6,
  overflow: 'hidden',
  },

  jobBadge: {
    backgroundColor: '#f97316',
  },

  schoolBadge: {
    backgroundColor: '#2563eb',
  },

  workBadge: {
    backgroundColor: '#16a34a',
  },

  privateBadge: {
    backgroundColor: '#9333ea',
  },
  jobCategoryButton: {
    borderColor: '#f97316',
  },

  schoolCategoryButton: {
    borderColor: '#2563eb',
  },

  workCategoryButton: {
    borderColor: '#16a34a',
  },

  privateCategoryButton: {
    borderColor: '#9333ea',
  },
});