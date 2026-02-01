/**
 * Verification script for Activities screen navigation fix
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Activities Screen Navigation Fix...\n');

let allPassed = true;

// Test 1: Check route file location
const correctPath = path.join(__dirname, 'app/activities.tsx');
const wrongPath = path.join(__dirname, 'app/tabs/activities.tsx');

if (fs.existsSync(correctPath)) {
  console.log('✅ Test 1: Route file exists at /app/activities.tsx');
} else {
  console.log('❌ Test 1: FAILED - Route file missing at /app/activities.tsx');
  allPassed = false;
}

// Test 2: Ensure no duplicate in tabs folder
if (!fs.existsSync(wrongPath)) {
  console.log('✅ Test 2: No duplicate file in /app/tabs/activities.tsx');
} else {
  console.log('❌ Test 2: FAILED - Duplicate file exists in /app/tabs/');
  allPassed = false;
}

// Test 3: Check ActivitiesScreen component exists
const screenPath = path.join(__dirname, 'src/features/activities/ActivitiesScreen.tsx');
if (fs.existsSync(screenPath)) {
  console.log('✅ Test 3: ActivitiesScreen component exists');
} else {
  console.log('❌ Test 3: FAILED - ActivitiesScreen.tsx missing');
  allPassed = false;
}

// Test 4: Check navigation path in HomeScreen
const homeScreenPath = path.join(__dirname, 'src/features/home/HomeScreen.tsx');
if (fs.existsSync(homeScreenPath)) {
  const homeContent = fs.readFileSync(homeScreenPath, 'utf-8');
  
  const hasCorrectPath = homeContent.includes("router.push('/activities'");
  const hasWrongPath = homeContent.includes("router.push('/tabs/activities'");
  
  if (hasCorrectPath && !hasWrongPath) {
    console.log('✅ Test 4: HomeScreen uses correct path: /activities');
  } else if (hasWrongPath) {
    console.log('❌ Test 4: FAILED - HomeScreen still uses wrong path: /tabs/activities');
    allPassed = false;
  } else {
    console.log('❌ Test 4: FAILED - Navigation path not found in HomeScreen');
    allPassed = false;
  }
}

// Test 5: Check RecentActivity component has onViewAll
const recentActivityPath = path.join(__dirname, 'src/components/features/dashboard/RecentActivity.tsx');
if (fs.existsSync(recentActivityPath)) {
  const content = fs.readFileSync(recentActivityPath, 'utf-8');
  
  if (content.includes('onPress={onViewAll}')) {
    console.log('✅ Test 5: RecentActivity button wired to onViewAll');
  } else {
    console.log('❌ Test 5: FAILED - onViewAll not wired in RecentActivity');
    allPassed = false;
  }
}

// Test 6: Check route file imports ActivitiesScreen
if (fs.existsSync(correctPath)) {
  const routeContent = fs.readFileSync(correctPath, 'utf-8');
  
  if (routeContent.includes('ActivitiesScreen')) {
    console.log('✅ Test 6: Route file imports ActivitiesScreen correctly');
  } else {
    console.log('❌ Test 6: FAILED - Route file missing ActivitiesScreen import');
    allPassed = false;
  }
}

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('✅ ALL TESTS PASSED!');
  console.log('\n🎯 Navigation should work now!');
  console.log('\n📱 To test manually:');
  console.log('1. npm start');
  console.log('2. Open app on device/simulator');
  console.log('3. Go to Home screen');
  console.log('4. Tap "View All X Activities" button');
  console.log('5. Activities screen should open ✅');
} else {
  console.log('❌ SOME TESTS FAILED');
  console.log('\nPlease review the failed tests above.');
}

console.log('='.repeat(50));
