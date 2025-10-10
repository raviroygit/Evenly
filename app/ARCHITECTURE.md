# Evenly App Architecture

## 📁 Project Structure

```
evenly/
├── app/                          # Expo Router app directory
│   ├── _layout.tsx              # Root layout
│   ├── index.tsx                # Root redirect
│   └── tabs/                    # Tab navigation
│       ├── _layout.tsx          # Tab layout with NativeTabs
│       ├── index.tsx            # Home tab
│       ├── expenses.tsx         # Expenses tab
│       ├── groups.tsx           # Groups tab
│       └── profile.tsx          # Profile tab
├── src/                         # Source code (organized)
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts
│   ├── constants/               # App constants and configuration
│   │   └── index.ts
│   ├── data/                    # Data layer
│   │   └── mockData.ts
│   ├── hooks/                   # Custom React hooks
│   │   ├── useExpenses.ts
│   │   ├── useGroups.ts
│   │   └── useUser.ts
│   ├── components/              # Reusable components
│   │   ├── common/              # Common UI components
│   │   │   ├── ScreenContainer.tsx
│   │   │   └── SectionHeader.tsx
│   │   ├── features/            # Feature-specific components
│   │   │   ├── expenses/
│   │   │   │   ├── ExpenseItem.tsx
│   │   │   │   └── ExpenseSummary.tsx
│   │   │   ├── groups/
│   │   │   │   └── GroupItem.tsx
│   │   │   └── profile/
│   │   │       └── UserProfile.tsx
│   │   ├── layout/              # Layout components
│   │   └── ui/                  # UI components
│   │       ├── GlassButton.tsx
│   │       ├── GlassCard.tsx
│   │       ├── GlassListItem.tsx
│   │       └── ThemeToggle.tsx
│   ├── features/                # Feature modules
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── expenses/
│   │   │   └── ExpensesScreen.tsx
│   │   ├── groups/
│   │   │   └── GroupsScreen.tsx
│   │   └── profile/
│   │       └── ProfileScreen.tsx
│   ├── contexts/                # React contexts
│   │   └── ThemeContext.tsx
│   ├── styles/                  # Theme definitions
│   │   └── theme.ts
│   ├── services/                # API services (future)
│   ├── utils/                   # Utility functions (future)
│   └── index.ts                 # Main export file
└── assets/                      # Static assets
```

## 🏗️ Architecture Principles

### 1. **Feature-Based Organization**
- Each feature has its own directory with screen and components
- Related functionality is grouped together
- Easy to locate and maintain feature-specific code

### 2. **Separation of Concerns**
- **Types**: All TypeScript interfaces and types
- **Constants**: App configuration and constants
- **Data**: Mock data and data layer logic
- **Hooks**: Business logic and state management
- **Components**: Reusable UI components
- **Features**: Screen components and feature logic

### 3. **Component Hierarchy**
```
Screen Components (Features)
├── Common Components (ScreenContainer, SectionHeader)
├── Feature Components (ExpenseItem, GroupItem, UserProfile)
└── UI Components (GlassCard, GlassButton, GlassListItem)
```

### 4. **Custom Hooks Pattern**
- Business logic extracted into custom hooks
- Reusable across components
- Easy to test and maintain
- Examples: `useExpenses`, `useGroups`, `useUser`

## 🎯 Key Benefits

### **Maintainability**
- Clear file organization
- Single responsibility principle
- Easy to find and modify code

### **Scalability**
- Easy to add new features
- Consistent patterns across the app
- Modular architecture

### **Reusability**
- Common components for consistent UI
- Custom hooks for shared logic
- Type definitions for consistency

### **Developer Experience**
- Clear import paths
- Organized code structure
- Easy to onboard new developers

## 🔄 Migration Strategy

### **Phase 1: Core Structure** ✅
- Created organized folder structure
- Extracted types and constants
- Created data layer with mock data

### **Phase 2: Component Extraction** ✅
- Broke down large screen components
- Created reusable feature components
- Implemented custom hooks

### **Phase 3: Integration** ✅
- Updated app files to use new structure
- Maintained existing functionality
- Cleaned up old files

### **Phase 4: Future Enhancements** (Planned)
- Add unit tests
- Implement real data layer
- Add error handling
- Performance optimizations

## 📝 Usage Examples

### **Adding a New Feature**
1. Create feature directory: `src/features/new-feature/`
2. Add screen component: `NewFeatureScreen.tsx`
3. Create feature components in `src/components/features/new-feature/`
4. Add custom hook: `src/hooks/useNewFeature.ts`
5. Update types if needed: `src/types/index.ts`

### **Using Custom Hooks**
```typescript
import { useExpenses } from '../hooks/useExpenses';

const MyComponent = () => {
  const { expenses, totalExpenses, addExpense } = useExpenses();
  // Component logic
};
```

### **Using Feature Components**
```typescript
import { ExpenseItem } from '../components/features/expenses/ExpenseItem';

const MyScreen = () => {
  return (
    <ScreenContainer>
      <ExpenseItem item={expense} onPress={handlePress} />
    </ScreenContainer>
  );
};
```

## 🚀 Next Steps

1. **Testing**: Add unit tests for hooks and components
2. **Data Layer**: Implement real API integration
3. **Error Handling**: Add error boundaries and error states
4. **Performance**: Add memoization and optimization
5. **Documentation**: Add JSDoc comments for better IDE support
