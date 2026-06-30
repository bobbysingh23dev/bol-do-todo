import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { Task } from '@/types/task';

type TaskCardProps = {
  task: Task;
};

function formatAmount(amount: number | null) {
  if (amount == null) {
    return null;
  }

  return `₹${amount.toLocaleString('en-IN')}`;
}

function formatType(type: string) {
  return type.replace(/_/g, ' ');
}

export function TaskCard({ task }: TaskCardProps) {
  const amount = formatAmount(task.amount);
  const isDone = task.status === 'done';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <ThemedText type="smallBold" style={styles.title}>
          {task.title}
        </ThemedText>
        <View style={[styles.badge, isDone ? styles.badgeDone : styles.badgePending]}>
          <ThemedText type="code" style={styles.badgeText}>
            {isDone ? 'done' : task.type}
          </ThemedText>
        </View>
      </View>

      {task.personName ? (
        <ThemedText type="small" themeColor="textSecondary">
          {task.personName}
          {amount ? ` · ${amount}` : ''}
        </ThemedText>
      ) : null}

      {task.dueDateText ? (
        <ThemedText type="small" themeColor="textSecondary">
          Due: {task.dueDateText}
        </ThemedText>
      ) : null}

      {task.audioPath ? (
        <ThemedText type="small" themeColor="textSecondary">
          Voice note attached
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
  },
  badge: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  badgePending: {
    backgroundColor: '#E8F1FF',
  },
  badgeDone: {
    backgroundColor: '#E7F8EE',
  },
  badgeText: {
    textTransform: 'capitalize',
  },
});

export { formatAmount, formatType };
