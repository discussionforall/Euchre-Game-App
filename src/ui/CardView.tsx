// One playing card, face up or face down.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, SUIT_SYMBOLS } from '../engine/cards';
import { suitColor } from '../engine/trump';
import { cardSize, colors } from './theme';

interface Props {
  // Leave out to draw the back of the card.
  card?: Card;
  size?: keyof typeof cardSize;
  // Greyed out and not tappable, e.g. a card that cannot legally be played.
  disabled?: boolean;
  // Gold outline, e.g. the card that won the trick.
  highlight?: boolean;
  onPress?: () => void;
}

export function CardView({ card, size = 'normal', disabled = false, highlight = false, onPress }: Props) {
  const dims = cardSize[size];
  const frame = [styles.card, dims, highlight && styles.highlight, disabled && styles.disabled];

  if (!card) {
    return (
      <View style={[frame, styles.back]}>
        {size !== 'tiny' && <View style={styles.backPattern} />}
      </View>
    );
  }

  const color = suitColor(card.suit) === 'red' ? colors.red : colors.black;
  const symbol = SUIT_SYMBOLS[card.suit];
  const small = size !== 'normal';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [frame, styles.face, pressed && styles.pressed]}
    >
      <Text style={[styles.corner, small && styles.cornerSmall, { color }]}>
        {card.rank}
        {'\n'}
        {symbol}
      </Text>
      <Text style={[styles.center, small && styles.centerSmall, { color }]}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    elevation: 3, // soft Android shadow so cards sit above the felt
  },
  face: {
    backgroundColor: colors.cardFace,
    padding: 4,
  },
  back: {
    backgroundColor: colors.cardBack,
    borderColor: colors.cardFace,
    padding: 3,
  },
  backPattern: {
    flex: 1,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.cardBackPattern,
    backgroundColor: colors.cardBackPattern,
    opacity: 0.6,
  },
  corner: {
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  cornerSmall: {
    fontSize: 12,
    lineHeight: 13,
  },
  center: {
    position: 'absolute',
    right: 5,
    bottom: 2,
    fontSize: 28,
  },
  centerSmall: {
    fontSize: 20,
    right: 3,
  },
  highlight: {
    borderColor: colors.gold,
    borderWidth: 3,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ translateY: -6 }],
  },
});
