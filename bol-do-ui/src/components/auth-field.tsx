import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AuthFieldProps = TextInputProps & {
  label: string;
};

export function AuthField({
  label,
  style,
  secureTextEntry,
  textContentType,
  autoComplete,
  ...props
}: AuthFieldProps) {
  const theme = useTheme();
  const isPassword = Boolean(secureTextEntry);

  return (
    <ThemedView style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
        spellCheck={false}
        textContentType={
          isPassword
            ? Platform.OS === 'ios'
              ? 'oneTimeCode'
              : 'password'
            : textContentType
        }
        autoComplete={isPassword ? 'off' : autoComplete}
        importantForAutofill={isPassword ? 'no' : undefined}
        passwordRules={isPassword && Platform.OS === 'ios' ? '' : undefined}
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.backgroundElement,
            backgroundColor: theme.background,
          },
          style,
        ]}
        {...props}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
});
