import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from './theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  selected?: boolean;
  // Bigger, full-width buttons for menus like the home screen.
  large?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', selected = false, large = false, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        large && styles.large,
        variant === 'secondary' && styles.secondary,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          large && styles.largeLabel,
          variant === 'secondary' && !selected && styles.secondaryLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.button,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.button,
    alignItems: 'center',
  },
  large: {
    paddingVertical: 14,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  secondary: {
    backgroundColor: colors.buttonSecondary,
    borderColor: colors.textDim,
  },
  selected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  label: {
    color: colors.buttonText,
    fontWeight: 'bold',
    fontSize: 15,
  },
  largeLabel: {
    fontSize: 18,
  },
  secondaryLabel: {
    color: colors.text,
  },
});
