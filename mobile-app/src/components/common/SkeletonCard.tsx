import React, { useEffect } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import * as T from '../../theme/colors';
import { useReduceMotion } from '../../hooks/useReduceMotion';

export interface SkeletonCardProps {
  /** Layout variant: 'list' (default card), 'compact' (small row), 'grid' (stat box) */
  variant?: 'list' | 'compact' | 'grid';
  /** Number of skeleton items to stack (default: 3) */
  count?: number;
  /** Optional container style override */
  style?: StyleProp<ViewStyle>;
}

const SingleSkeletonItem: React.FC<{ variant: 'list' | 'compact' | 'grid'; isReduceMotion: boolean }> = ({
  variant,
  isReduceMotion,
}) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    if (isReduceMotion) {
      cancelAnimation(opacity);
      opacity.value = 0.5;
    } else {
      opacity.value = withRepeat(
        withTiming(0.75, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    }
    return () => cancelAnimation(opacity);
  }, [isReduceMotion, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (variant === 'compact') {
    return (
      <View style={styles.compactCard}>
        <Animated.View style={[styles.block, styles.avatarBlock, animatedStyle]} />
        <View style={styles.compactTextCol}>
          <Animated.View style={[styles.block, styles.titleLine, animatedStyle]} />
          <Animated.View style={[styles.block, styles.subLine, animatedStyle]} />
        </View>
      </View>
    );
  }

  if (variant === 'grid') {
    return (
      <View style={styles.gridCard}>
        <Animated.View style={[styles.block, styles.gridTitle, animatedStyle]} />
        <Animated.View style={[styles.block, styles.gridValue, animatedStyle]} />
      </View>
    );
  }

  return (
    <View style={styles.listCard}>
      <View style={styles.listCardHeader}>
        <Animated.View style={[styles.block, styles.titleLine, animatedStyle]} />
        <Animated.View style={[styles.block, styles.badgeBlock, animatedStyle]} />
      </View>

      <Animated.View style={[styles.block, styles.subLine, { width: '60%', marginVertical: 8 }, animatedStyle]} />

      <View style={styles.listCardFooter}>
        <Animated.View style={[styles.block, styles.buttonBlock, animatedStyle]} />
      </View>
    </View>
  );
};

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  variant = 'list',
  count = 3,
  style,
}) => {
  const isReduceMotion = useReduceMotion();
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={[styles.container, style]}>
      {items.map(idx => (
        <SingleSkeletonItem key={idx} variant={variant} isReduceMotion={isReduceMotion} />
      ))}
    </View>
  );
};
SkeletonCard.displayName = 'SkeletonCard';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  block: {
    backgroundColor: T.warmCocoa + '55',
    borderRadius: T.radius.small,
  },
  listCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  listCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleLine: {
    height: 16,
    width: '45%',
  },
  subLine: {
    height: 12,
    width: '35%',
  },
  badgeBlock: {
    height: 18,
    width: 60,
    borderRadius: T.radius.pill,
  },
  listCardFooter: {
    marginTop: 12,
    alignItems: 'flex-start',
  },
  buttonBlock: {
    height: 36,
    width: '100%',
    borderRadius: T.radius.pill,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  avatarBlock: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  compactTextCol: {
    flex: 1,
    gap: 6,
  },
  gridCard: {
    backgroundColor: T.surfaceCard,
    borderRadius: T.radius.card,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  gridTitle: {
    height: 14,
    width: '50%',
    marginBottom: 10,
  },
  gridValue: {
    height: 28,
    width: '30%',
  },
});
