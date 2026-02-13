import { useState, useMemo } from 'react';
import { SearchItem } from '../components/modals/SearchModal';
import { usePreferredCurrency } from './usePreferredCurrency';

export type SearchScreenType = 'expenses' | 'groups' | 'activities' | 'home';

interface UseSearchProps {
  screenType: SearchScreenType;
  expenses?: any[];
  groups?: any[];
  activities?: any[];
  users?: any[];
}

export const useSearch = ({
  screenType,
  expenses = [],
  groups = [],
  activities = [],
  users = [],
}: UseSearchProps) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const { formatAmount } = usePreferredCurrency();

  const searchItems = useMemo(() => {
    const items: SearchItem[] = [];

    switch (screenType) {
      case 'expenses':
        expenses.forEach((expense) => {
          const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount || '0') || 0;
          items.push({
            id: expense.id,
            title: expense.description || expense.title || 'Untitled Expense',
            subtitle: `${formatAmount(amt)} • ${expense.groupName || 'No Group'}`,
            type: 'expense',
            data: expense,
          });
        });
        break;

      case 'groups':
        groups.forEach((group) => {
          items.push({
            id: group.id,
            title: group.name,
            subtitle: `${group.memberCount || 0} members • ${group.description || 'No description'}`,
            type: 'group',
            data: group,
          });
        });
        break;

      case 'activities':
        activities.forEach((activity) => {
          items.push({
            id: activity.id,
            title: activity.title,
            subtitle: `${activity.date} • ${activity.type}`,
            type: 'activity',
            data: activity,
          });
        });
        break;

      case 'home':
        // Combine all data for home screen search
        expenses.forEach((expense) => {
          const amt = typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount || '0') || 0;
          items.push({
            id: `expense-${expense.id}`,
            title: expense.description || expense.title || 'Untitled Expense',
            subtitle: `Expense • ${formatAmount(amt)}`,
            type: 'expense',
            data: expense,
          });
        });

        groups.forEach((group) => {
          items.push({
            id: `group-${group.id}`,
            title: group.name,
            subtitle: `Group • ${group.memberCount || 0} members`,
            type: 'group',
            data: group,
          });
        });

        activities.forEach((activity) => {
          items.push({
            id: `activity-${activity.id}`,
            title: activity.title,
            subtitle: `Activity • ${activity.date}`,
            type: 'activity',
            data: activity,
          });
        });
        break;
    }

    return items;
  }, [screenType, expenses, groups, activities, users, formatAmount]);

  const openSearch = () => setIsSearchVisible(true);
  const closeSearch = () => setIsSearchVisible(false);

  const handleItemSelect = (item: SearchItem) => {
    // Handle item selection based on screen type
    
    // You can add navigation logic here based on the item type and screen
    switch (item.type) {
      case 'expense':
        // Navigate to expense details
        break;
      case 'group':
        // Navigate to group details
        break;
      case 'activity':
        // Navigate to activity details
        break;
      default:
        break;
    }
  };

  const getSearchPlaceholder = () => {
    switch (screenType) {
      case 'expenses':
        return 'Search expenses...';
      case 'groups':
        return 'Search groups...';
      case 'activities':
        return 'Search activities...';
      case 'home':
        return 'Search everything...';
      default:
        return 'Search...';
    }
  };

  const getSearchTitle = () => {
    switch (screenType) {
      case 'expenses':
        return 'Search Expenses';
      case 'groups':
        return 'Search Groups';
      case 'activities':
        return 'Search Activities';
      case 'home':
        return 'Search All';
      default:
        return 'Search';
    }
  };

  return {
    isSearchVisible,
    searchItems,
    openSearch,
    closeSearch,
    handleItemSelect,
    getSearchPlaceholder,
    getSearchTitle,
  };
};
