import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Platform,
  View,
  Text,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../contexts/ThemeContext';

export interface OtpBoxesProps {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (full: string) => void;
  length?: number;
  autoFocus?: boolean;
  errorKey?: number;
}

// -----------------------------------------------------------------------------
// SINGLE BOX COMPONENT
// -----------------------------------------------------------------------------
const OtpBox = ({ digit, focused, filled, colors }: any) => {
  const scale = useSharedValue(1);
  const prevFilled = useRef(filled);

  useEffect(() => {
    if (filled && !prevFilled.current) {
      scale.value = withSequence(
        withTiming(1.15, { duration: 90, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 12, stiffness: 220 })
      );
    }
    prevFilled.current = filled;
  }, [filled, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderColor = focused
    ? colors.primary
    : filled
    ? 'rgba(99, 102, 241, 0.45)'
    : colors.border;
  const bg = focused ? 'rgba(99, 102, 241, 0.08)' : colors.muted;

  return (
    <View style={styles.boxTouch}>
      <Animated.View
        style={[
          styles.box,
          animatedStyle,
          { borderColor, backgroundColor: bg },
        ]}
      >
        <Text style={[styles.boxText, { color: colors.foreground }]}>{digit}</Text>
      </Animated.View>
    </View>
  );
};

// -----------------------------------------------------------------------------
// MAIN OTP BOXES COMPONENT
// -----------------------------------------------------------------------------
export const OtpBoxes: React.FC<OtpBoxesProps> = ({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus = false,
  errorKey,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const sanitize = useCallback(
    (raw: string) => raw.replace(/\D/g, '').slice(0, length),
    [length]
  );

  const [internal, setInternal] = useState<string>(() => sanitize(value || ''));
  const [isFocused, setIsFocused] = useState(false);
  const externalRef = useRef(value);

  useEffect(() => {
    if (value === externalRef.current) return;
    externalRef.current = value;
    setInternal(sanitize(value || ''));
  }, [value, sanitize]);

  const completeFiredRef = useRef(false);
  const shake = useSharedValue(0);
  const lastErrorKey = useRef(errorKey);

  // Shake animation on verify error
  useEffect(() => {
    if (errorKey === undefined) return;
    if (errorKey === lastErrorKey.current) return;
    lastErrorKey.current = errorKey;
    shake.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-4, { duration: 40 }),
      withTiming(0, { duration: 40 })
    );
    setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
  }, [errorKey, shake]);

  // Auto-complete trigger
  useEffect(() => {
    if (internal.length === length && !completeFiredRef.current) {
      completeFiredRef.current = true;
      const t = setTimeout(() => onComplete?.(internal), 120);
      return () => clearTimeout(t);
    }
    if (internal.length < length) {
      completeFiredRef.current = false;
    }
  }, [internal, length, onComplete]);

  const handleChangeText = (text: string) => {
    const next = sanitize(text);
    setInternal(next);
    onChange(next);
  };

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  const digits = useMemo(() => {
    const arr: string[] = Array(length).fill('');
    for (let i = 0; i < internal.length && i < length; i++) {
      arr[i] = internal[i];
    }
    return arr;
  }, [internal, length]);

  const focusIndex = isFocused ? Math.min(internal.length, length - 1) : -1;

  return (
    <View style={styles.wrapper}>
      {/* 
        The visual boxes are rendered underneath the invisible TextInput. 
        pointerEvents="none" ensures they do not intercept any touches.
      */}
      <Animated.View style={[styles.row, rowStyle]} pointerEvents="none">
        {digits.map((d, i) => (
          <OtpBox
            key={i}
            digit={d}
            focused={focusIndex === i}
            filled={d !== ''}
            colors={colors}
          />
        ))}
      </Animated.View>

      {/* 
        This is a full-size, completely transparent TextInput laid EXACTLY 
        over the top of the boxes. We let the OS natively handle all focus, 
        blur, and keyboard behaviors. No JS hacks or manual listeners. 
      */}
      <TextInput
        ref={inputRef}
        value={internal}
        onChangeText={handleChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
        autoFocus={autoFocus}
        caretHidden={true}
        spellCheck={false}
        autoCorrect={false}
        maxLength={length}
        style={styles.hiddenInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    position: 'relative',
    height: 60, // Fixed height to ensure it takes up space
    justifyContent: 'center',
  },
  row: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  boxTouch: {
    flex: 1,
    aspectRatio: 0.82,
    maxWidth: 54,
  },
  box: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: {
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject, // Fills the entire wrapper
    opacity: 1, // Crucial for Android touch registration
    color: 'transparent', // Makes text invisible
    backgroundColor: 'transparent',
  },
});
