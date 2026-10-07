// The first screen: title, the four Jacks, the main menu, and your record.

import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from './AppState';
import { Button } from './Button';
import { Suit } from '../engine/cards';
import { CardView } from './CardView';
import { FadeIn } from './motion';
import { winRate } from './stats';
import { colors } from './theme';

// All four Jacks, alternating colours, from left (back) to right (front).
const FAN: { suit: Suit; angle: number; shift: number }[] = [
  { suit: 'spades', angle: -24, shift: -78 },
  { suit: 'hearts', angle: -8, shift: -26 },
  { suit: 'clubs', angle: 8, shift: 26 },
  { suit: 'diamonds', angle: 24, shift: 78 },
];

// The Jacks fan open like a hand of cards, then float gently.
function JackFan() {
  const open = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(open, { toValue: 1, delay: 150, speed: 6, bounciness: 10, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [open, float]);

  const card = (angle: number, shift: number) => ({
    transform: [
      { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) },
      { translateX: open.interpolate({ inputRange: [0, 1], outputRange: [0, shift] }) },
      // Outer cards sit a little lower, so the fan curves like a real hand.
      { translateY: open.interpolate({ inputRange: [0, 1], outputRange: [0, Math.abs(angle) * 0.9] }) },
      { rotate: open.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${angle}deg`] }) },
      { scale: 1.75 },
    ],
  });

  return (
    <View style={styles.fan}>
      {FAN.map(({ suit, angle, shift }) => (
        <Animated.View key={suit} style={[styles.fanCard, card(angle, shift)]}>
          <CardView card={{ rank: 'J', suit }} />
        </Animated.View>
      ))}
    </View>
  );
}

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { inProgress, startNewGame, stats } = useAppState();
  const rate = winRate(stats);

  const play = () => {
    startNewGame();
    router.push('/game');
  };
  const onNewGame = () => {
    if (!inProgress) return play();
    Alert.alert('Start a new game?', 'Your current game will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New game', style: 'destructive', onPress: play },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <FadeIn fromY={-20}>
        <Text style={styles.title}>Euchre</Text>
        <Text style={styles.tagline}>The classic trick-taking card game</Text>
      </FadeIn>

      <JackFan />

      <View style={styles.menu}>
        {inProgress && (
          <FadeIn delay={100} fromY={20} style={styles.menuItem}>
            <Button large label="Continue game" onPress={() => router.push('/game')} />
          </FadeIn>
        )}
        <FadeIn delay={160} fromY={20} style={styles.menuItem}>
          <Button large label="New game" variant={inProgress ? 'secondary' : 'primary'} onPress={onNewGame} />
        </FadeIn>
        <FadeIn delay={220} fromY={20} style={styles.menuItem}>
          <Button large label="How to play" variant="secondary" onPress={() => router.push('/rules')} />
        </FadeIn>
        <FadeIn delay={280} fromY={20} style={styles.menuItem}>
          <Button large label="Settings" variant="secondary" onPress={() => router.push('/settings')} />
        </FadeIn>
      </View>

      <FadeIn delay={360} style={styles.stats}>
        {stats.played === 0 ? (
          <Text style={styles.statsEmpty}>Finish a game to start your record.</Text>
        ) : (
          <View style={styles.statsRow}>
            <Stat label="Played" value={stats.played} />
            <Stat label="Won" value={stats.won} />
            <Stat label="Win rate" value={`${rate}%`} />
            <Stat label="Best streak" value={stats.bestStreak} />
          </View>
        )}
      </FadeIn>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.felt,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: colors.gold,
    fontSize: 52,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 2,
  },
  tagline: {
    color: colors.textDim,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
  },
  fan: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  fanCard: {
    position: 'absolute',
  },
  menu: {
    width: '100%',
    gap: 12,
  },
  menuItem: {
    width: '100%',
  },
  stats: {
    marginTop: 22,
    width: '100%',
    backgroundColor: colors.feltDark,
    borderRadius: 12,
    padding: 14,
  },
  statsEmpty: {
    color: colors.textDim,
    textAlign: 'center',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.gold,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 2,
  },
});
