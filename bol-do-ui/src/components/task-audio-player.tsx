import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

type TaskAudioPlayerProps = {
  taskId: string;
};

export function TaskAudioPlayer({ taskId }: TaskAudioPlayerProps) {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const player = useAudioPlayer(localUri);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);

      try {
        const uri = await api.downloadTaskAudio(taskId);
        if (!cancelled) {
          setLocalUri(uri);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load audio');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [taskId]);

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
      return;
    }

    player.play();
  };

  if (loading) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ActivityIndicator />
        <ThemedText themeColor="textSecondary">Loading voice note…</ThemedText>
      </ThemedView>
    );
  }

  if (error || !localUri) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText themeColor="textSecondary">{error ?? 'Audio unavailable'}</ThemedText>
      </ThemedView>
    );
  }

  const progress =
    status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">Voice note</ThemedText>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.controls}>
        <Pressable onPress={togglePlayback} style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
          <ThemedText style={styles.playButtonText}>{status.playing ? 'Pause' : 'Play'}</ThemedText>
        </Pressable>
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(status.currentTime)} / {formatTime(status.duration)}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const whole = Math.floor(seconds);
  const mins = Math.floor(whole / 60);
  const secs = whole % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D8E4F5',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#208AEF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  playButton: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  playButtonText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
