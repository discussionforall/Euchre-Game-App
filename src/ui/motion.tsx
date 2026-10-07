// Shared animation building blocks. Everything here animates only transform
// and opacity with `useNativeDriver: true`, so the motion runs on the native
// UI thread and stays smooth even while JavaScript is busy.

import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { Card } from '../engine/cards';
import { Seat } from '../engine/seats';

// Roughly where each player sits, measured from the middle of the trick area
// (in dp). Cards fly in from here and a won trick sweeps back here.
export const SEAT_OFFSET: Record<Seat, { x: number; y: number }> = {
  0: { x: 0, y: 330 },
  1: { x: -150, y: 0 },
  2: { x: 0, y: -190 },
  3: { x: 150, y: 0 },
};

// A small, stable tilt for each card (-7..7 degrees) so a trick looks like
// cards tossed on a table rather than a perfect grid.
export function cardTilt(card: Card): number {
  let hash = 0;
  for (const ch of card.rank + card.suit) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return (hash % 15) - 7;
}

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  // Start this far below (positive) or above (negative) the final position.
  fromY?: number;
  fromScale?: number;
  style?: StyleProp<ViewStyle>;
}

// Fades and springs its children into place when it first appears.
// Give it a `key` that changes to replay the animation.
export function FadeIn({ children, delay = 0, fromY = 10, fromScale = 1, style }: FadeInProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay,
      speed: 14,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [progress, delay]);

  const motion = {
    opacity: progress.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [
      { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [fromY, 0] }) },
      { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [fromScale, 1] }) },
    ],
  };

  return <Animated.View style={[style, motion]}>{children}</Animated.View>;
}

// A value that loops 0 -> 1 -> 0 while `active` is true, for pulses and glows.
export function usePulse(active: boolean, period = 1100): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      value.stopAnimation();
      value.setValue(0);
      return;
    }
    const half = { duration: period / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true };
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, { toValue: 1, ...half }),
        Animated.timing(value, { toValue: 0, ...half }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, period, value]);

  return value;
}
