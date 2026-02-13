import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { ReusableModal } from '../ui/ReusableModal';
import { useTheme } from '../../contexts/ThemeContext';
import { EvenlyBackendService } from '../../services/EvenlyBackendService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupportedCurrencies, DEFAULT_CURRENCY } from '../../utils/currency';

interface CurrencySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  currentCurrency?: string;
  onCurrencyChange?: (currency: string) => void | Promise<void>;
}

export const CurrencySelectionModal: React.FC<CurrencySelectionModalProps> = ({
  visible,
  onClose,
  currentCurrency,
  onCurrencyChange,
}) => {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency || DEFAULT_CURRENCY);
  const [isChanging, setIsChanging] = useState(false);

  const handleCurrencyChange = async (currencyCode: string) => {
    if (isChanging) return;
    setIsChanging(true);
    try {
      setSelectedCurrency(currencyCode);

      // Save to AsyncStorage
      await AsyncStorage.setItem('userCurrency', currencyCode);

      // Update in backend database
      try {
        await EvenlyBackendService.updateUserCurrency(currencyCode);
      } catch (backendError) {
        // Log error but don't block currency change if backend fails
        console.error('Failed to update currency in backend:', backendError);
      }

      // Notify parent so it can refresh user and persist; await so context + storage are updated before closing
      if (onCurrencyChange) {
        await Promise.resolve(onCurrencyChange(currencyCode));
      }

      Alert.alert(
        t('common.success'),
        t('profile.currencyChanged')
      );
      onClose();
    } catch {
      Alert.alert(
        t('common.error'),
        t('errors.tryAgain')
      );
    } finally {
      setIsChanging(false);
    }
  };

  const currencies = getSupportedCurrencies();

  return (
    <ReusableModal
      visible={visible}
      onClose={onClose}
      title={t('profile.selectCurrency')}
    >
      <View style={styles.wrapper}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {currencies.map((currency) => (
          <TouchableOpacity
            key={currency.code}
            style={[
              styles.currencyOption,
              {
                backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                borderColor: selectedCurrency === currency.code ? colors.primary : 'transparent',
                borderWidth: selectedCurrency === currency.code ? 2 : 0,
              },
            ]}
            onPress={() => handleCurrencyChange(currency.code)}
            disabled={isChanging}
          >
            <View style={styles.currencyLeft}>
              <Text style={styles.currencyFlag}>{currency.flag}</Text>
              <View style={styles.currencyInfo}>
                <Text style={[styles.currencyName, { color: colors.foreground }]}>
                  {currency.name}
                </Text>
                <Text style={[styles.currencySubtext, { color: colors.mutedForeground }]}>
                  {currency.nativeName} ({currency.symbol})
                </Text>
              </View>
            </View>
            {selectedCurrency === currency.code && !isChanging && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {t('profile.currencyInfo')}
          </Text>
        </View>

        </ScrollView>
        {isChanging && (
          <View style={[styles.loadingOverlay, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.foreground }]}>
              {t('profile.updating')}
            </Text>
          </View>
        )}
      </View>
    </ReusableModal>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    maxHeight: 500,
  },
  container: {
    maxHeight: 500,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currencySubtext: {
    fontSize: 13,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
