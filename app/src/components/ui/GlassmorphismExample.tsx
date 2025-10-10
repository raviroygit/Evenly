import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { GlassButton } from './GlassButton';
import { LiquidGlassCard } from './LiquidGlassCard';

/**
 * GlassmorphismExample - Shows the new pill-shaped glassmorphism style
 * 
 * This component demonstrates the heavy blur, transparency, and pill-shaped
 * design that matches the style shown in the user's reference image.
 */
const GlassmorphismExample: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Pill-shaped Button Example */}
      <LiquidGlassCard
        padding={20}
        marginBottom={20}
        borderRadius={30}
        glassEffectStyle="thick"
        isInteractive={false}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          Pill-Shaped Glassmorphism
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Heavy blur effect with transparency
        </Text>
      </LiquidGlassCard>

      {/* Button Examples */}
      <View style={styles.buttonRow}>
        <GlassButton
          title="Add Income"
          onPress={() => console.log('Income pressed')}
          variant="primary"
          size="medium"
        />
        <GlassButton
          title="Add Expense"
          onPress={() => console.log('Expense pressed')}
          variant="secondary"
          size="medium"
        />
      </View>

      {/* Activity Items Example */}
      <LiquidGlassCard
        padding={16}
        borderRadius={24}
        glassEffectStyle="thick"
        isInteractive={true}
      >
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Recent Activity
        </Text>
        
        {[
          { title: 'Coffee Shop', amount: '$4.50', type: 'expense' },
          { title: 'Salary', amount: '$3000.00', type: 'income' },
          { title: 'Grocery Shopping', amount: '$85.50', type: 'expense' },
        ].map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={[
              styles.activityDot, 
              { backgroundColor: activity.type === 'income' ? '#007AFF' : colors.primary }
            ]} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityText, { color: colors.foreground }]}>
                {activity.title}
              </Text>
              <Text style={[styles.activityAmount, { color: colors.mutedForeground }]}>
                {activity.amount}
              </Text>
            </View>
          </View>
        ))}
      </LiquidGlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20, // Pill-shaped like in the image
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Add subtle shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 3,
  },
  activityContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default GlassmorphismExample;
