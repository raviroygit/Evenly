import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export const OrganizationSwitcher: React.FC = () => {
  const router = useRouter();
  const { currentOrganization, organizations, switchOrganization } = useAuth();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Don't show anything if no organizations
  if (!currentOrganization || organizations.length === 0) {
    return null;
  }

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrganization.id) {
      setModalVisible(false);
      return;
    }

    try {
      setSwitching(true);
      await switchOrganization(orgId);
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to switch organization:', error);
      // TODO: Show error toast
    } finally {
      setSwitching(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return ['#6366f1', '#8b5cf6'];
      case 'admin':
        return ['#8b5cf6', '#a855f7'];
      case 'member':
        return ['#3b82f6', '#6366f1'];
      case 'guest':
        return ['#64748b', '#475569'];
      default:
        return ['#6366f1', '#8b5cf6'];
    }
  };

  return (
    <>
      {/* Header Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.headerButton}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.orgName, { color: colors.text }]} numberOfLines={1}>
            {currentOrganization.displayName || currentOrganization.name}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.text} />
        </View>
      </TouchableOpacity>

      {/* Organization Switcher Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                {/* Header */}
                <LinearGradient
                  colors={['#6366f1', '#8b5cf6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalHeader}
                >
                  <View style={styles.modalHeaderContent}>
                    <View>
                      <Text style={styles.modalTitle}>Switch Organization</Text>
                      <Text style={styles.modalSubtitle}>
                        {organizations.length} {organizations.length === 1 ? 'workspace' : 'workspaces'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setModalVisible(false)}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>

                {/* Organization List */}
                <ScrollView style={styles.orgList} showsVerticalScrollIndicator={false}>
                  {organizations.map((org) => {
                    const isSelected = org.id === currentOrganization.id;
                    const gradientColors = getRoleBadgeColor(org.role);

                    return (
                      <TouchableOpacity
                        key={org.id}
                        onPress={() => handleSwitch(org.id)}
                        style={[
                          styles.orgItem,
                          {
                            backgroundColor: colors.card,
                            borderColor: isSelected ? '#6366f1' : colors.border,
                          },
                        ]}
                        activeOpacity={0.7}
                        disabled={switching}
                      >
                        <View style={styles.orgItemContent}>
                          {/* Organization Icon */}
                          <View
                            style={[
                              styles.orgIcon,
                              { backgroundColor: isSelected ? '#6366f1' : colors.border },
                            ]}
                          >
                            <Text style={styles.orgIconText}>
                              {(org.displayName || org.name).charAt(0).toUpperCase()}
                            </Text>
                          </View>

                          {/* Organization Info */}
                          <View style={styles.orgInfo}>
                            <Text
                              style={[styles.orgItemName, { color: colors.text }]}
                              numberOfLines={1}
                            >
                              {org.displayName || org.name}
                            </Text>
                            <View style={styles.orgMeta}>
                              <LinearGradient
                                colors={gradientColors}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.roleBadge}
                              >
                                <Text style={styles.roleBadgeText}>
                                  {org.role.toUpperCase()}
                                </Text>
                              </LinearGradient>
                              <Text style={[styles.planText, { color: colors.subtext }]}>
                                {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)} Plan
                              </Text>
                            </View>
                          </View>

                          {/* Selected Indicator or Switching Spinner */}
                          {switching && isSelected ? (
                            <ActivityIndicator size="small" color="#6366f1" />
                          ) : isSelected ? (
                            <View style={styles.selectedActions}>
                              <TouchableOpacity
                                onPress={() => {
                                  setModalVisible(false);
                                  router.push('/organizations/settings');
                                }}
                                style={styles.iconButton}
                              >
                                <Ionicons name="settings-outline" size={20} color="#6366f1" />
                              </TouchableOpacity>
                              <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                            </View>
                          ) : (
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color={colors.subtext}
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Footer */}
                <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.footerButton}
                    onPress={() => {
                      setModalVisible(false);
                      router.push('/organizations/create');
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
                    <Text style={styles.footerButtonText}>Create New Organization</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Header Button Styles
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    maxWidth: 200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    maxWidth: 150,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    padding: 20,
    paddingBottom: 16,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    padding: 4,
  },

  // Organization List Styles
  orgList: {
    maxHeight: 400,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  orgItem: {
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  orgItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  orgIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orgIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  orgInfo: {
    flex: 1,
    gap: 6,
  },
  orgItemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  orgMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  planText: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },

  // Footer Styles
  modalFooter: {
    borderTopWidth: 1,
    padding: 16,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366f1',
  },
});
