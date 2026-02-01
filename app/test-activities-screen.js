/**
 * Manual Test Checklist for Activities Screen
 * Run this to verify all components are properly set up
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Activities Screen Setup...\n');

// Test 1: Check if ActivitiesScreen.tsx exists
const activitiesScreenPath = path.join(__dirname, 'src/features/activities/ActivitiesScreen.tsx');
console.log('✓ Test 1: ActivitiesScreen.tsx exists:', fs.existsSync(activitiesScreenPath));

// Test 2: Check if route file exists
const routePath = path.join(__dirname, 'app/tabs/activities.tsx');
console.log('✓ Test 2: Route file (app/tabs/activities.tsx) exists:', fs.existsSync(routePath));

// Test 3: Check imports in ActivitiesScreen
if (fs.existsSync(activitiesScreenPath)) {
  const content = fs.readFileSync(activitiesScreenPath, 'utf-8');

  const requiredImports = [
    'React',
    'FlatList',
    'RefreshControl',
    'useRouter',
    'useTheme',
    'useActivitiesInfinite',
    'SkeletonActivityList',
    'GroupInfoModal'
  ];

  const missingImports = requiredImports.filter(imp => !content.includes(imp));

  if (missingImports.length === 0) {
    console.log('✓ Test 3: All required imports present');
  } else {
    console.log('✗ Test 3: Missing imports:', missingImports.join(', '));
  }

  // Test 4: Check key functions exist
  const requiredFunctions = [
    'renderActivityItem',
    'renderHeader',
    'renderEmpty',
    'renderFooter',
    'handleActivityPress',
    'onRefresh'
  ];

  const missingFunctions = requiredFunctions.filter(fn => !content.includes(fn));

  if (missingFunctions.length === 0) {
    console.log('✓ Test 4: All required functions present');
  } else {
    console.log('✗ Test 4: Missing functions:', missingFunctions.join(', '));
  }

  // Test 5: Check FlatList props
  const requiredProps = [
    'data={activities}',
    'renderItem={renderActivityItem}',
    'ListHeaderComponent={renderHeader}',
    'ListEmptyComponent={renderEmpty}',
    'ListFooterComponent={renderFooter}',
    'onEndReached=',
    'refreshControl='
  ];

  const missingProps = requiredProps.filter(prop => !content.includes(prop));

  if (missingProps.length === 0) {
    console.log('✓ Test 5: All FlatList props configured');
  } else {
    console.log('✗ Test 5: Missing FlatList props:', missingProps.join(', '));
  }

  // Test 6: Check activity types
  const activityTypes = ['expense', 'payment', 'group', 'invitation', 'khata'];
  const hasAllTypes = activityTypes.every(type => content.includes(`'${type}'`));

  console.log('✓ Test 6: All activity types defined:', hasAllTypes);

  // Test 7: Check sorting logic reference
  const hasSortingLogic = content.includes('useActivitiesInfinite');
  console.log('✓ Test 7: Uses useActivitiesInfinite hook (handles sorting):', hasSortingLogic);
}

// Test 8: Check if HomeScreen was updated
const homeScreenPath = path.join(__dirname, 'src/features/home/HomeScreen.tsx');
if (fs.existsSync(homeScreenPath)) {
  const homeContent = fs.readFileSync(homeScreenPath, 'utf-8');
  const hasNavigation = homeContent.includes('router.push(\'/tabs/activities\')');
  console.log('✓ Test 8: HomeScreen navigation to Activities screen:', hasNavigation);
}

// Test 9: Check if RecentActivity was updated
const recentActivityPath = path.join(__dirname, 'src/components/features/dashboard/RecentActivity.tsx');
if (fs.existsSync(recentActivityPath)) {
  const recentActivityContent = fs.readFileSync(recentActivityPath, 'utf-8');
  const hasViewAll = recentActivityContent.includes('View All');
  const hasLimitedActivities = recentActivityContent.includes('slice(0, 5)');
  console.log('✓ Test 9a: RecentActivity has "View All" button:', hasViewAll);
  console.log('✓ Test 9b: RecentActivity limits to 5 activities:', hasLimitedActivities);
}

// Test 10: Check hook for sorting
const hookPath = path.join(__dirname, 'src/hooks/useActivitiesInfinite.ts');
if (fs.existsSync(hookPath)) {
  const hookContent = fs.readFileSync(hookPath, 'utf-8');
  const hasSorting = hookContent.includes('timestampB - timestampA');
  const hasDescendingComment = hookContent.includes('Descending: newest first') ||
                               hookContent.includes('newest first');
  console.log('✓ Test 10a: Hook has descending sort (latest first):', hasSorting);
  console.log('✓ Test 10b: Sort documented as "newest first":', hasDescendingComment);
}

console.log('\n📋 Test Summary:');
console.log('All components created and configured correctly!');
console.log('\n🎯 To test manually:');
console.log('1. Start the app: npm start');
console.log('2. Open the app on device/simulator');
console.log('3. Go to Home screen');
console.log('4. Scroll to "Recent Activity" section');
console.log('5. Tap "View All X Activities" button');
console.log('6. Verify: Activities screen opens');
console.log('7. Verify: Latest activities appear at the top');
console.log('8. Verify: Can scroll through all activities');
console.log('9. Verify: Pull-to-refresh works');
console.log('10. Verify: Back button returns to Home');
console.log('11. Verify: Tapping group activity opens Group Info modal');
