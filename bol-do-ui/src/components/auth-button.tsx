import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type AuthButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function AuthButton({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...props
}: AuthButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed, hovered: false }) : style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : '#208AEF'} />
      ) : (
        <ThemedText style={isPrimary ? styles.primaryText : styles.secondaryText}>{label}</ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#208AEF',
  },
  secondary: {
    backgroundColor: '#E8F1FF',
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryText: {
    color: '#208AEF',
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
