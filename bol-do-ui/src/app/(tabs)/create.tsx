import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { VoiceNoteRecorder } from '@/components/voice-note-recorder';
import { ThemedView } from '@/components/themed-view';
import { getApiBaseUrl } from '@/constants/api';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { CreateTaskInput } from '@/types/task';

const SAMPLE_TASK: CreateTaskInput = {
  title: 'Remind Rahul for payment',
  type: 'payment',
  personName: 'Rahul',
  amount: 25000,
  dueDateText: 'Tomorrow',
  sourceText: 'Kal Rahul ko 25000 payment ke liye remind karna.',
  generatedMsg:
    'Hi Rahul, just a reminder for the pending ₹25,000 payment. Please let me know when you can process it.',
};

type FormState = {
  title: string;
  type: string;
  personName: string;
  amount: string;
  dueDateText: string;
  sourceText: string;
  generatedMsg: string;
};

const emptyForm: FormState = {
  title: '',
  type: 'task',
  personName: '',
  amount: '',
  dueDateText: '',
  sourceText: '',
  generatedMsg: '',
};

function formFromSample(): FormState {
  return {
    title: SAMPLE_TASK.title ?? '',
    type: SAMPLE_TASK.type ?? 'task',
    personName: SAMPLE_TASK.personName ?? '',
    amount: SAMPLE_TASK.amount?.toString() ?? '',
    dueDateText: SAMPLE_TASK.dueDateText ?? '',
    sourceText: SAMPLE_TASK.sourceText ?? '',
    generatedMsg: SAMPLE_TASK.generatedMsg ?? '',
  };
}

export default function CreateTaskScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const fillSample = () => {
    setForm(formFromSample());
  };

  const handleCreate = async () => {
    if (!form.title.trim()) {
      Alert.alert('Missing title', 'Task title is required.');
      return;
    }

    setSaving(true);

    try {
      const payload: CreateTaskInput = {
        title: form.title.trim(),
        type: form.type.trim() || 'task',
        personName: form.personName.trim() || undefined,
        dueDateText: form.dueDateText.trim() || undefined,
        sourceText: form.sourceText.trim() || undefined,
        generatedMsg: form.generatedMsg.trim() || undefined,
      };

      const parsedAmount = Number(form.amount);
      if (form.amount.trim() && !Number.isNaN(parsedAmount)) {
        payload.amount = parsedAmount;
      }

      const task = await api.createTask(payload);
      setForm(emptyForm);
      router.push(`/task/${task.id}`);
    } catch (error) {
      Alert.alert('Create failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Add Task</ThemedText>
            <ThemedText themeColor="textSecondary">
              Manual create or record a voice note.
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              API: {getApiBaseUrl()}
            </ThemedText>
          </View>

          <VoiceNoteRecorder
            title={form.title.trim() || undefined}
            onSaved={(taskId) => {
              setForm(emptyForm);
              router.push(`/task/${taskId}`);
            }}
          />

          <Pressable onPress={fillSample} style={styles.sampleButton}>
            <ThemedText type="linkPrimary">Fill sample: Rahul payment reminder</ThemedText>
          </Pressable>

          <Field label="Title" required>
            <TextInput
              value={form.title}
              onChangeText={(value) => updateField('title', value)}
              placeholder="Remind Rahul for payment"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement }]}
            />
          </Field>

          <Field label="Type">
            <TextInput
              value={form.type}
              onChangeText={(value) => updateField('type', value)}
              placeholder="payment / follow_up / meeting / task"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement }]}
            />
          </Field>

          <Field label="Person">
            <TextInput
              value={form.personName}
              onChangeText={(value) => updateField('personName', value)}
              placeholder="Rahul"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement }]}
            />
          </Field>

          <Field label="Amount">
            <TextInput
              value={form.amount}
              onChangeText={(value) => updateField('amount', value)}
              placeholder="25000"
              keyboardType="numeric"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement }]}
            />
          </Field>

          <Field label="Due">
            <TextInput
              value={form.dueDateText}
              onChangeText={(value) => updateField('dueDateText', value)}
              placeholder="Tomorrow"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, borderColor: theme.backgroundElement }]}
            />
          </Field>

          <Field label="Source text">
            <TextInput
              value={form.sourceText}
              onChangeText={(value) => updateField('sourceText', value)}
              placeholder="What the user spoke or typed"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[
                styles.input,
                styles.multiline,
                { color: theme.text, borderColor: theme.backgroundElement },
              ]}
            />
          </Field>

          <Field label="WhatsApp message">
            <TextInput
              value={form.generatedMsg}
              onChangeText={(value) => updateField('generatedMsg', value)}
              placeholder="Generated message preview"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[
                styles.input,
                styles.multiline,
                { color: theme.text, borderColor: theme.backgroundElement },
              ]}
            />
          </Field>

          <Pressable
            onPress={() => void handleCreate()}
            disabled={saving}
            style={({ pressed }) => [
              styles.createButton,
              pressed && styles.pressed,
              saving && styles.disabled,
            ]}>
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.createButtonText}>Save Task</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">
        {label}
        {required ? ' *' : ''}
      </ThemedText>
      {children}
    </View>
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
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'web' ? Spacing.four : Spacing.two,
    paddingBottom: BottomTabInset + Spacing.six,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  sampleButton: {
    alignSelf: 'flex-start',
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  createButton: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.7,
  },
});
