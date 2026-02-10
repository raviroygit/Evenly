import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'expense' | 'group' | 'activity' | 'user' | 'payment';
  data?: any;
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  onItemSelect: (item: SearchItem) => void;
  searchItems: SearchItem[];
  placeholder?: string;
  title?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  visible,
  onClose,
  onItemSelect,
  searchItems,
  placeholder = "Search...",
  title = "Search",
}) => {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<SearchItem[]>([]);
  const searchInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      // Set initial values immediately
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      
      // Focus input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      setSearchQuery('');
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems([]);
    } else {
      const filtered = searchItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery, searchItems]);

  const handleItemPress = (item: SearchItem) => {
    onItemSelect(item);
    onClose();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const getItemIcon = (type: SearchItem['type']) => {
    switch (type) {
      case 'expense':
        return '💰';
      case 'group':
        return '👥';
      case 'activity':
        return '📊';
      case 'user':
        return '👤';
      case 'payment':
        return '💳';
      default:
        return '📄';
    }
  };

  const getItemColor = (type: SearchItem['type']) => {
    switch (type) {
      case 'expense':
        return '#FF6B6B';
      case 'group':
        return '#4ECDC4';
      case 'activity':
        return '#45B7D1';
      case 'user':
        return '#96CEB4';
      case 'payment':
        return '#FFEAA7';
      default:
        return colors.mutedForeground;
    }
  };

  const renderSearchItem = ({ item }: { item: SearchItem }) => (
    <TouchableOpacity
      style={[
        styles.searchItem,
        {
          backgroundColor: theme === 'dark' ? '#2C2C2C' : '#FFFFFF',
          borderColor: theme === 'dark' ? '#404040' : '#E0E0E0',
        },
      ]}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View
          style={[
            styles.itemIcon,
            { backgroundColor: getItemColor(item.type) + '20' },
          ]}
        >
          <Text style={styles.iconText}>{getItemIcon(item.type)}</Text>
        </View>
        <View style={styles.itemText}>
          <Text
            style={[
              styles.itemTitle,
              { color: colors.foreground },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.subtitle && (
            <Text
              style={[
                styles.itemSubtitle,
                { color: colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {item.subtitle}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <TouchableOpacity
        style={[
          styles.overlay,
          {
            backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
          },
        ]}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View style={styles.modalWrapper}>
          <TouchableOpacity
            style={[
              styles.modalContainer,
              {
                backgroundColor: colors.background,
              },
            ]}
            activeOpacity={1}
            onPress={() => {}} // Prevent touch from bubbling to overlay
          >
              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  {title}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Text style={[styles.closeButtonText, { color: colors.mutedForeground }]}>
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Input */}
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              >
                <View style={styles.searchContainer}>
                  <TextInput
                    ref={searchInputRef}
                    style={[
                      styles.searchInput,
                      {
                        backgroundColor: theme === 'dark' ? '#1A1A1A' : '#F8F8F8',
                        color: colors.foreground,
                        borderColor: theme === 'dark' ? '#333333' : '#E0E0E0',
                      },
                    ]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.mutedForeground}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                </View>
              </KeyboardAvoidingView>

              {/* Results */}
              <View style={styles.resultsContainer}>
                {searchQuery.trim() === '' ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      {t('modals.startTyping')}
                    </Text>
                  </View>
                ) : filteredItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      {t('modals.noResultsFound', { query: searchQuery })}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredItems}
                    renderItem={renderSearchItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={styles.resultsList}
                  />
                )}
              </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  overlayTouchable: {
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
    maxHeight: '80%',
    minHeight: '50%',
    paddingTop: Platform.OS === 'ios' ? 20 : 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsList: {
    flex: 1,
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
