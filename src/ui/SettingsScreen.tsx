// Settings: bot speed (saved between launches) and resetting your record.

import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppState } from './AppState';
import { Button } from './Button';
import { ScreenHeader } from './ScreenHeader';
import { colors } from './theme';
import { Speed } from './useEuchre';

const SPEEDS: { value: Speed; label: string; hint: string }[] = [
  { value: 'normal', label: 'Normal', hint: 'Easy to follow every card' },
  { value: 'fast', label: 'Fast', hint: 'For when you know the game' },
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, stats, resetStats } = useAppState();

  const confirmReset = () =>
    Alert.alert('Reset your record?', 'Games played, won and streaks will go back to zero.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: resetStats },
    ]);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <ScreenHeader title="Settings" />

      <View style={styles.section}>
        <Text style={styles.heading}>Bot speed</Text>
        <Text style={styles.hint}>How quickly the other players act.</Text>
        <View style={styles.options}>
          {SPEEDS.map((speed) => (
            <View key={speed.value} style={styles.option}>
              <Button
                label={speed.label}
                variant="secondary"
                selected={settings.speed === speed.value}
                onPress={() => updateSettings({ speed: speed.value })}
              />
              <Text style={styles.optionHint}>{speed.hint}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Your record</Text>
        <Text style={styles.hint}>
          {stats.played === 0
            ? 'No games finished yet.'
            : `${stats.played} played, ${stats.won} won, best streak ${stats.bestStreak}.`}
        </Text>
        {stats.played > 0 && <Button label="Reset record" variant="secondary" onPress={confirmReset} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.felt,
    paddingHorizontal: 16,
    gap: 14,
  },
  section: {
    backgroundColor: colors.feltDark,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  heading: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    color: colors.textDim,
    fontSize: 14,
  },
  options: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  option: {
    flex: 1,
    gap: 6,
  },
  optionHint: {
    color: colors.textDim,
    fontSize: 12,
    textAlign: 'center',
  },
});
