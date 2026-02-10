import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export type FilterType = 'all' | 'get' | 'give' | 'settled';
export type SortType = 'most-recent' | 'oldest' | 'highest-amount' | 'least-amount' | 'name-az';

interface CustomerFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filterType: FilterType, sortType: SortType) => void;
  currentFilter: FilterType;
  currentSort: SortType;
}

export const CustomerFilterModal: React.FC<CustomerFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  currentFilter,
  currentSort,
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const [selectedFilter, setSelectedFilter] = useState<FilterType>(currentFilter);
  const [selectedSort, setSelectedSort] = useState<SortType>(currentSort);

  const handleApply = () => {
    onApply(selectedFilter, selectedSort);
    onClose();
  };

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: t('common.all'), value: 'all' },
    { label: t('khata.youWillGet'), value: 'give' },
    { label: t('khata.youWillGive'), value: 'get' },
    { label: t('khata.settled'), value: 'settled' },
  ];

  const sortOptions: { label: string; value: SortType }[] = [
    { label: t('modals.mostRecent'), value: 'most-recent' },
    { label: t('modals.oldest'), value: 'oldest' },
    { label: t('modals.highestAmount'), value: 'highest-amount' },
    { label: t('modals.leastAmount'), value: 'least-amount' },
    { label: t('modals.byNameAZ'), value: 'name-az' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          },
        ]}
      >
        <View style={styles.overlayTouchable}>
          <TouchableOpacity
            style={styles.overlayBackground}
            activeOpacity={1}
            onPress={onClose}
          />
          <View style={styles.modalWrapper}>
            <View
              style={[
                styles.modalContainer,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {t('modals.filterAndSort')}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              {/* Filter BY TYPE Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {t('modals.filterByType')}
                </Text>
                <View style={styles.filterButtonsContainer}>
                  {filterOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.filterButton,
                        {
                          backgroundColor:
                            selectedFilter === option.value
                              ? colors.primary
                              : theme === 'dark'
                              ? '#1A1A1A'
                              : '#F8F8F8',
                        },
                      ]}
                      onPress={() => setSelectedFilter(option.value)}
                    >
                      <Text
                        style={[
                          styles.filterButtonText,
                          {
                            color:
                              selectedFilter === option.value
                                ? '#FFFFFF'
                                : colors.foreground,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* SORT BY Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {t('modals.sortBy')}
                </Text>
                <View style={styles.sortOptionsContainer}>
                  {sortOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.sortOption}
                      onPress={() => setSelectedSort(option.value)}
                    >
                      <View
                        style={[
                          styles.radioButton,
                          {
                            borderColor:
                              selectedSort === option.value
                                ? colors.primary
                                : colors.mutedForeground,
                          },
                        ]}
                      >
                        {selectedSort === option.value && (
                          <View
                            style={[
                              styles.radioButtonInner,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <Text style={[styles.sortOptionText, { color: colors.foreground }]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* View Result Button */}
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.primary }]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>{t('modals.viewResult')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlayBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sortOptionsContainer: {
    gap: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sortOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    marginHorizontal: 20,
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});


