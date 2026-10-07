// A card in your hand. It is dealt in (flying down from the table with a
// spin), and lifts up when it is one you are allowed to play right now.

import { ReactNode, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface Props {
  children: ReactNode;
  // Wait this long before dealing this card in (staggers the deal).
  delay: number;
  lifted: boolean;
}

export function DealtCard({ children, delay, lifted }: Props) {
  const deal = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(deal, { toValue: 1, delay, speed: 11, bounciness: 6, useNativeDriver: true }).start();
  }, [deal, delay]);

  useEffect(() => {
    Animated.spring(lift, { toValue: lifted ? 1 : 0, speed: 20, bounciness: 9, useNativeDriver: true }).start();
  }, [lift, lifted]);

  const motion = {
    opacity: deal.interpolate({ inputRange: [0, 0.3], outputRange: [0, 1], extrapolate: 'clamp' }),
    transform: [
      {
        translateY: Animated.add(
          deal.interpolate({ inputRange: [0, 1], outputRange: [-380, 0] }),
          lift.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }),
        ),
      },
      { rotate: deal.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] }) },
      { scale: deal.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) },
    ],
  };

  return <Animated.View style={motion}>{children}</Animated.View>;
}
