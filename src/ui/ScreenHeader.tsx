// A simple title bar with a back button, for the Rules and Settings pages.

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function goBackOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function ScreenHeader({ title }: { title: string }) {
  return (
    <View style={styles.bar}>
      <Pressable onPress={goBackOrHome} hitSlop={12} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      {/* Keeps the title centred opposite the back button. */}
      <View style={styles.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  back: {
    width: 70,
  },
  pressed: {
    opacity: 0.6,
  },
  backText: {
    color: colors.gold,
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
});
