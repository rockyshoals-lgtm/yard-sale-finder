// XP Toast — animated popup when user earns XP or coins
import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ToastMessage {
  id: number;
  text: string;
  emoji: string;
  color: string;
}

interface XPToastContextType {
  showToast: (text: string, emoji?: string, color?: string) => void;
  showXP: (amount: number) => void;
  showCoins: (amount: number) => void;
  showLevelUp: (level: number, title: string) => void;
  showBadge: (name: string) => void;
}

const XPToastContext = createContext<XPToastContextType>({
  showToast: () => {},
  showXP: () => {},
  showCoins: () => {},
  showLevelUp: () => {},
  showBadge: () => {},
});

export const useXPToast = () => useContext(XPToastContext);

let toastIdCounter = 0;

function ToastItem({ message, onDone }: { message: ToastMessage; onDone: () => void }) {
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Entrance
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-dismiss after 2.5s
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -40,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => onDone());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: message.color,
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <Text style={styles.toastEmoji}>{message.emoji}</Text>
      <Text style={styles.toastText}>{message.text}</Text>
    </Animated.View>
  );
}

export function XPToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((text: string, emoji = '✨', color = COLORS.primary) => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev.slice(-2), { id, text, emoji, color }]); // max 3 visible
  }, []);

  const showXP = useCallback((amount: number) => {
    showToast(`+${amount} XP`, '⚡', COLORS.primary);
  }, [showToast]);

  const showCoins = useCallback((amount: number) => {
    showToast(`+${amount} Coins`, '🪙', COLORS.accent);
  }, [showToast]);

  const showLevelUp = useCallback((level: number, title: string) => {
    showToast(`Level ${level}! ${title}`, '🎉', '#7C3AED');
  }, [showToast]);

  const showBadge = useCallback((name: string) => {
    showToast(`Badge: ${name}`, '🏅', '#059669');
  }, [showToast]);

  return (
    <XPToastContext.Provider value={{ showToast, showXP, showCoins, showLevelUp, showBadge }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((msg) => (
          <ToastItem key={msg.id} message={msg} onDone={() => removeToast(msg.id)} />
        ))}
      </View>
    </XPToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 140,
  },
  toastEmoji: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
