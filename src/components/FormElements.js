import React from 'react';
import { View, Text, TextInput as RNTextInput, StyleSheet, Switch } from 'react-native';
import Colors from '../theme/colors';
import { Typography, Spacing, BorderRadius, Shadows } from '../theme/typography';

/**
 * FormInput - Styled text input with label
 * Clean, modern input matching the reference aesthetic
 */
export function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  returnKeyType,
  style,
  inputStyle,
  maxLength,
  editable = true,
}) {
  return (
    <View style={[styles.inputContainer, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, multiline && styles.inputMultiline]}>
        <RNTextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline={multiline}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          maxLength={maxLength}
          editable={editable}
          style={[
            styles.input,
            multiline && { minHeight: 80, textAlignVertical: 'top' },
            !editable && styles.inputDisabled,
            inputStyle,
          ]}
        />
      </View>
    </View>
  );
}

/**
 * ToggleRow - A labeled toggle switch
 * Clean toggle style matching the reference
 */
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  style,
}) {
  return (
    <View style={[styles.toggleRow, style]}>
      <View style={styles.toggleTextArea}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && (
          <Text style={styles.toggleDescription}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: Colors.toggleInactive,
          true: Colors.toggleActive,
        }}
        thumbColor={Colors.toggleThumb}
        ios_backgroundColor={Colors.toggleInactive}
      />
    </View>
  );
}

/**
 * SectionLabel - Section heading within forms
 */
export function SectionLabel({ label, style }) {
  return (
    <Text style={[styles.sectionLabel, style]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.label,
    color: Colors.textDark,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    backgroundColor: Colors.chipBg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.chipBgAlt,
  },
  inputMultiline: {
    minHeight: 80,
  },
  input: {
    ...Typography.input,
    color: Colors.textDark,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  toggleTextArea: {
    flex: 1,
    marginRight: Spacing.lg,
  },
  toggleLabel: {
    ...Typography.bodyBold,
    color: Colors.textDark,
  },
  toggleDescription: {
    ...Typography.small,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    ...Typography.label,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
});
