import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import * as T from '../../theme/colors';
import { CapsuleIcon } from './MedIcons';

export interface EmptyStateProps {
  /** Custom icon component or element (defaults to CapsuleIcon) */
  icon?: React.ReactNode;
  /** Primary header message */
  title: string;
  /** Explanatory description */
  description?: string;
  /** Optional button label for primary call-to-action */
  actionLabel?: string;
  /** Optional callback when action button is pressed */
  onAction?: () => void;
  /** Optional container style override */
  style?: StyleProp<ViewStyle>;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        {icon ?? <CapsuleIcon color={T.sageGreenSolid} size={36} />}
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {!!actionLabel && !!onAction && (
        <TouchableOpacity style={styles.actionBtn} onPress={onAction} activeOpacity={0.8} accessibilityRole="button">
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    backgroundColor: T.surfaceElevated,
    borderRadius: T.radius.large,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    borderWidth: 1,
    borderColor: T.border,
    ...T.subtleShadow,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: T.sageGreen + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.sageGreen + '33',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: T.textColor,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: T.fontSize.caption,
    color: T.midSlate,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  actionBtn: {
    backgroundColor: T.sageGreenSolid,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: T.radius.pill,
    ...T.subtleShadow,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
