// "How to play": the rules as this app plays them, short enough to read
// between hands.

import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../engine/cards';
import { CardView } from './CardView';
import { ScreenHeader } from './ScreenHeader';
import { colors } from './theme';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {children}
    </View>
  );
}

function P({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

function B({ children }: { children: ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

function CardRow({ cards, labels }: { cards: Card[]; labels: string[] }) {
  return (
    <View style={styles.cardRow}>
      {cards.map((card, i) => (
        <View key={i} style={styles.cardWithLabel}>
          <CardView card={card} size="small" />
          <Text style={styles.cardLabel}>{labels[i]}</Text>
        </View>
      ))}
    </View>
  );
}

export function RulesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader title="How to play" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Section title="The goal">
          <P>
            Four players in two teams. Your partner sits <B>opposite</B> you. The first team to <B>10 points</B> wins.
          </P>
          <P>Only 24 cards are used: 9, 10, J, Q, K and A of each suit. Everyone gets 5 cards.</P>
        </Section>

        <Section title="Trump and the bowers">
          <P>
            Each hand one suit becomes <B>trump</B>. Any trump card beats any card of another suit. The two Jacks of
            trump's colour become the best cards in the game:
          </P>
          <CardRow
            cards={[
              { rank: 'J', suit: 'hearts' },
              { rank: 'J', suit: 'diamonds' },
              { rank: 'A', suit: 'hearts' },
              { rank: 'K', suit: 'hearts' },
            ]}
            labels={['Right bower', 'Left bower', 'Ace', 'King']}
          />
          <P>
            With ♥ as trump: the <B>right bower</B> (J♥) is highest, then the <B>left bower</B> (J♦). The left
            bower counts as a <B>heart</B> for the whole hand, not a diamond.
          </P>
        </Section>

        <Section title="Choosing trump">
          <P>
            One card is turned face up. Going round the table, each player may <B>order up</B> that card, making its
            suit trump. The dealer then picks it up and discards a card.
          </P>
          <P>
            If everyone passes, the card is turned down and each player may <B>name any other suit</B>. If it
            comes back to the dealer, they <B>must</B> choose (stick the dealer).
          </P>
        </Section>

        <Section title="Going alone">
          <P>
            After choosing trump you can <B>go alone</B>: your partner sits the hand out. It is harder, but taking
            all 5 tricks alone scores <B>4 points</B>.
          </P>
        </Section>

        <Section title="Playing tricks">
          <P>
            The player left of the dealer leads. Everyone must <B>follow suit</B> if they can (remember, the left bower
            is trump). If you can't, play anything, including trump.
          </P>
          <P>The highest trump wins the trick; if no trump was played, the highest card of the suit led wins.</P>
        </Section>

        <Section title="Scoring">
          <View style={styles.table}>
            {[
              ['Makers take 3 or 4 tricks', '1 point'],
              ['Makers take all 5 (a march)', '2 points'],
              ['Alone and take all 5', '4 points'],
              ['Makers take 2 or fewer (euchred)', '2 to the other team'],
            ].map(([what, points]) => (
              <View key={what} style={styles.tableRow}>
                <Text style={styles.tableWhat}>{what}</Text>
                <Text style={styles.tablePoints}>{points}</Text>
              </View>
            ))}
          </View>
          <P>The makers are the team that chose trump.</P>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.felt,
    paddingHorizontal: 16,
  },
  content: {
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
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 4,
  },
  cardWithLabel: {
    alignItems: 'center',
    gap: 4,
  },
  cardLabel: {
    color: colors.textDim,
    fontSize: 11,
  },
  table: {
    gap: 6,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  tableWhat: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  tablePoints: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
