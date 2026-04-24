import React from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  secureTextEntry?: boolean;
  maxLength?: number;
  multiline?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
}

export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry,
  maxLength,
  multiline,
  keyboardType,
  autoCapitalize,
}: InputProps) {
  const borderClass = error ? 'border border-semantic-error' : 'border border-transparent';
  const heightClass = multiline ? 'min-h-[100px]' : '';

  return (
    <View className="w-full">
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-text-primary">
          {label}
        </Text>
      )}
      <TextInput
        className={`rounded-lg bg-elevated px-4 py-3 text-sm text-text-primary ${borderClass} ${heightClass}`}
        placeholder={placeholder}
        placeholderTextColor="#808080"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        maxLength={maxLength}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label ?? placeholder}
      />
      {error && (
        <Text className="mt-1 text-xs text-semantic-error">{error}</Text>
      )}
    </View>
  );
}
