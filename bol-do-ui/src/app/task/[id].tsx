import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';

import { formatAmount } from '@/components/task-card';
import { TaskAudioPlayer } from '@/components/task-audio-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import type { Task } from '@/types/task';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid task id');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.getTask(id);
      setTask(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadTask();
    }, [loadTask]),
  );

  const handleMarkDone = async () => {
    if (!task) {
      return;
    }

    setUpdating(true);

    try {
      const updated = await api.markTaskDone(task.id);
      setTask(updated);
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (error || !task) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>{error ?? 'Task not found'}</ThemedText>
        <Pressable onPress={() => void loadTask()}>
          <ThemedText type="linkPrimary">Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const amount = formatAmount(task.amount);
  const isDone = task.status === 'done';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Status
          </ThemedText>
          <ThemedText type="smallBold">{task.status}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="small" themeColor="textSecondary">
            Task
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            {task.title}
          </ThemedText>
        </View>

        {task.personName ? (
          <DetailRow label="Person" value={task.personName} />
        ) : null}
        {amount ? <DetailRow label="Amount" value={amount} /> : null}
        {task.dueDateText ? <DetailRow label="Due" value={task.dueDateText} /> : null}
        {task.type ? <DetailRow label="Type" value={task.type} /> : null}

        {task.audioPath ? <TaskAudioPlayer taskId={task.id} /> : null}

        {task.sourceText ? (
          <ThemedView type="backgroundElement" style={styles.block}>
            <ThemedText type="smallBold">Transcript / source</ThemedText>
            <ThemedText>{task.sourceText}</ThemedText>
          </ThemedView>
        ) : null}

        {task.generatedMsg ? (
          <ThemedView type="backgroundElement" style={styles.block}>
            <ThemedText type="smallBold">WhatsApp message</ThemedText>
            <ThemedText>{task.generatedMsg}</ThemedText>
          </ThemedView>
        ) : null}

        {!isDone ? (
          <Pressable
            onPress={() => void handleMarkDone()}
            disabled={updating}
            style={({ pressed }) => [
              styles.doneButton,
              pressed && styles.pressed,
              updating && styles.disabled,
            ]}>
            {updating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.doneButtonText}>Mark Done</ThemedText>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.section}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  section: {
    gap: Spacing.half,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  block: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  doneButton: {
    backgroundColor: '#1F9D55',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
});
