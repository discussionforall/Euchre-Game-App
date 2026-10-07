// Card suits raining down the screen, for big moments (winning the game,
// a march, euchring the opponents). Purely decorative: it ignores touches.

import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { colors } from './theme';

const SYMBOLS = ['♠', '♥', '♦', '♣'];
const COUNT = 22;

interface Particle {
  symbol: string;
  color: string;
  x: number;
  size: number;
  delay: number;
  duration: number;
  spin: number;
  drift: number;
}

function makeParticles(width: number): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => {
    const symbol = SYMBOLS[i % SYMBOLS.length];
    return {
      symbol,
      color: symbol === '♥' || symbol === '♦' ? colors.red : colors.cardFace,
      x: Math.random() * width,
      size: 18 + Math.random() * 18,
      delay: Math.random() * 700,
      duration: 1900 + Math.random() * 1200,
      spin: (Math.random() - 0.5) * 720,
      drift: (Math.random() - 0.5) * 80,
    };
  });
}

function FallingSymbol({ particle, height }: { particle: Particle; height: number }) {
  const fall = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fall, {
      toValue: 1,
      delay: particle.delay,
      duration: particle.duration,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fall, particle]);

  const motion = {
    opacity: fall.interpolate({ inputRange: [0, 0.05, 0.85, 1], outputRange: [0, 1, 1, 0] }),
    transform: [
      { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-40, height + 40] }) },
      { translateX: fall.interpolate({ inputRange: [0, 1], outputRange: [0, particle.drift] }) },
      { rotate: fall.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${particle.spin}deg`] }) },
    ],
  };

  return (
    <Animated.Text
      style={[styles.symbol, { left: particle.x, fontSize: particle.size, color: particle.color }, motion]}
    >
      {particle.symbol}
    </Animated.Text>
  );
}

export function Celebration() {
  const { width, height } = Dimensions.get('window');
  // Random layout chosen once, so re-renders do not reshuffle the particles.
  const particles = useRef(makeParticles(width)).current;

  return (
    <View style={styles.layer} pointerEvents="none">
      {particles.map((particle, i) => (
        <FallingSymbol key={i} particle={particle} height={height} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  symbol: {
    position: 'absolute',
    top: 0,
  },
});
