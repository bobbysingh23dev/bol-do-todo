import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TaskCard } from '@/components/task-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getApiBaseUrl } from '@/constants/api';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import type { Task } from '@/types/task';

export default function TasksScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTasks();
    }, [loadTasks]),
  );

  const pendingCount = tasks.filter((task) => task.status !== 'done').length;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <ThemedText type="subtitle">BolDo</ThemedText>
            <Pressable
              onPress={() => {
                void logout().then(() => router.replace('/login'));
              }}>
              <ThemedText type="linkPrimary">Log out</ThemedText>
            </Pressable>
          </View>
          <ThemedText themeColor="textSecondary">
            Hi {user?.name ?? 'there'} — your tasks are here.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            API: {getApiBaseUrl()}
          </ThemedText>
        </View>

        <View style={styles.summaryRow}>
          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="smallBold">{tasks.length}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Total
            </ThemedText>
          </ThemedView>
          <ThemedView type="backgroundElement" style={styles.summaryCard}>
            <ThemedText type="smallBold">{pendingCount}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Pending
            </ThemedText>
          </ThemedView>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <Pressable onPress={() => void loadTasks()} style={styles.retryButton}>
              <ThemedText type="linkPrimary">Retry</ThemedText>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => void loadTasks(true)} />
            }
            ListEmptyComponent={
              <ThemedView type="backgroundElement" style={styles.emptyCard}>
                <ThemedText type="smallBold">No tasks yet</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Go to the Add tab to create your first task.
                </ThemedText>
              </ThemedView>
            }
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/task/${item.id}`)}>
                <ThemedView type="backgroundElement" style={styles.taskItem}>
                  <TaskCard task={item} />
                </ThemedView>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  header: {
    gap: Spacing.one,
    paddingTop: Platform.OS === 'web' ? Spacing.four : Spacing.two,
    paddingBottom: Spacing.three,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  summaryCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  listContent: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  taskItem: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  emptyCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.one,
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  errorText: {
    textAlign: 'center',
  },
  retryButton: {
    padding: Spacing.two,
  },
});
