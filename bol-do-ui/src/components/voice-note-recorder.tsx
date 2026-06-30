import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

type VoiceNoteRecorderProps = {
  title?: string;
  onSaved: (taskId: string) => void;
};

export function VoiceNoteRecorder({ title, onSaved }: VoiceNoteRecorderProps) {
  const recorder = useAudioRecorder(RecordingPresets.LOW_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    void (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Microphone', 'Microphone permission is required for voice notes.');
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
      setReady(true);
    })();
  }, []);

  const startRecording = async () => {
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopAndUpload = async () => {
    await recorder.stop();
    const uri = recorder.uri;

    if (!uri) {
      Alert.alert('Recording failed', 'No audio file was created.');
      return;
    }

    setUploading(true);

    try {
      const task = await api.createTaskFromVoice(uri, title);
      onSaved(task.id);
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setUploading(false);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Voice note</ThemedText>
        <ThemedText themeColor="textSecondary">
          Recording is available on iOS and Android only.
        </ThemedText>
      </ThemedView>
    );
  }

  const isRecording = recorderState.isRecording;
  const seconds = Math.floor(recorderState.durationMillis / 1000);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="smallBold">Voice note</ThemedText>
        {isRecording ? (
          <ThemedText type="small" themeColor="textSecondary">
            {seconds}s
          </ThemedText>
        ) : null}
      </View>

      <ThemedText themeColor="textSecondary">
        Record a quick note — saved as a task with audio attached.
      </ThemedText>

      <Pressable
        disabled={!ready || uploading}
        onPress={() => void (isRecording ? stopAndUpload() : startRecording())}
        style={({ pressed }) => [
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          pressed && styles.pressed,
          (!ready || uploading) && styles.disabled,
        ]}>
        {uploading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <ThemedText style={styles.recordButtonText}>
            {isRecording ? 'Stop & Save' : 'Start Recording'}
          </ThemedText>
        )}
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordButton: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#D64545',
  },
  recordButtonText: {
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
