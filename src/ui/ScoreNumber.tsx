// A team's score. When it goes up, the number bounces and a "+2" floats away.

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from './theme';

export function ScoreNumber({ value }: { value: number }) {
  const previous = useRef(value);
  const bump = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const [gain, setGain] = useState<number | null>(null);

  useEffect(() => {
    const diff = value - previous.current;
    previous.current = value;
    if (diff <= 0) return; // a new game resets to 0: no celebration

    setGain(diff);
    bump.setValue(0);
    float.setValue(0);
    Animated.parallel([
      Animated.sequence([
        Animated.spring(bump, { toValue: 1, speed: 30, bounciness: 16, useNativeDriver: true }),
        Animated.spring(bump, { toValue: 0, speed: 12, bounciness: 8, useNativeDriver: true }),
      ]),
      Animated.timing(float, { toValue: 1, duration: 1400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start(() => setGain(null));
  }, [value, bump, float]);

  const numberMotion = {
    transform: [{ scale: bump.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
  };
  const gainMotion = {
    opacity: float.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
    transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }],
  };

  return (
    <View style={styles.box}>
      <Animated.Text style={[styles.points, numberMotion]}>{value}</Animated.Text>
      {gain !== null && <Animated.Text style={[styles.gain, gainMotion]}>+{gain}</Animated.Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minWidth: 26,
    alignItems: 'center',
  },
  points: {
    color: colors.gold,
    fontWeight: 'bold',
    fontSize: 22,
  },
  gain: {
    position: 'absolute',
    top: -4,
    color: colors.gold,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
