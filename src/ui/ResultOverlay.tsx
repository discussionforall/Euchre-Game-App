// Shown over the table when a hand or the whole game ends.

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text } from 'react-native';
import { Button } from './Button';
import { Celebration } from './Celebration';
import { FadeIn } from './motion';
import { colors } from './theme';

interface Props {
  title: string;
  detail: string;
  scoreLine: string;
  buttonLabel: string;
  onPress: () => void;
  // An optional second, quieter button (e.g. "Home").
  secondaryLabel?: string;
  onSecondary?: () => void;
  // Rain card suits down the screen for a big moment.
  celebrate?: boolean;
}

export function ResultOverlay({
  title,
  detail,
  scoreLine,
  buttonLabel,
  onPress,
  secondaryLabel,
  onSecondary,
  celebrate = false,
}: Props) {
  // Fade the backdrop in and let the box "pop" from slightly smaller.
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.back(1.5)),
      useNativeDriver: true,
    }).start();
  }, [progress]);
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  // The "back" easing overshoots past 1 for the pop; opacity must stay within 0..1.
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });

  return (
    <Animated.View style={[styles.backdrop, { opacity }]}>
      <Animated.View style={[styles.box, { transform: [{ scale }] }]}>
        {/* Each line arrives a moment after the one before. */}
        <FadeIn delay={120} fromScale={0.4} fromY={0}>
          <Text style={styles.title}>{title}</Text>
        </FadeIn>
        <FadeIn delay={260}>
          <Text style={styles.detail}>{detail}</Text>
        </FadeIn>
        <FadeIn delay={360}>
          <Text style={styles.score}>{scoreLine}</Text>
        </FadeIn>
        <FadeIn delay={460} fromY={16} style={styles.buttons}>
          <Button label={buttonLabel} onPress={onPress} />
          {secondaryLabel && onSecondary && (
            <Button label={secondaryLabel} variant="secondary" onPress={onSecondary} />
          )}
        </FadeIn>
      </Animated.View>
      {celebrate && <Celebration />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: colors.feltDark,
    borderColor: colors.gold,
    borderWidth: 2,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  title: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: 'bold',
  },
  detail: {
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  score: {
    color: colors.textDim,
    fontSize: 15,
    marginBottom: 6,
  },
});
