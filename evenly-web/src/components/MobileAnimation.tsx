'use client';

import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Mesh, Group, BoxGeometry, CylinderGeometry, SphereGeometry } from 'three';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Screen Components
function SplashScreen() {
  return (
    <>
      {/* Screen Background - Splash Theme */}
      <mesh position={[0, 0, 0.175]}>
        <boxGeometry args={[1.6, 3.3, 0.001]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      
      {/* Evenly Logo */}
      <Text
        position={[0, 0.5, 0.177]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        Evenly
      </Text>
      
      <Text
        position={[0, 0.1, 0.177]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        Split expenses easily
      </Text>
      
      {/* Loading indicator */}
      <mesh position={[0, -0.8, 0.176]}>
        <boxGeometry args={[0.6, 0.08, 0.001]} />
        <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
      </mesh>
    </>
  );
}

function MainAppScreen() {
  return (
    <>
      {/* Screen Background - Evenly App Theme */}
      <mesh position={[0, 0, 0.175]}>
        <boxGeometry args={[1.6, 3.3, 0.001]} />
        <meshStandardMaterial color="#e0f2fe" />
      </mesh>
      
      {/* Header Card */}
      <mesh position={[0, 0.8, 0.176]}>
        <boxGeometry args={[1.4, 0.6, 0.001]} />
        <meshStandardMaterial color="#f5f5f4" />
      </mesh>
      
      {/* Welcome Text */}
      <Text
        position={[-0.5, 1.0, 0.177]}
        fontSize={0.08}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        Welcome back, User!
      </Text>
      
      <Text
        position={[-0.5, 0.9, 0.177]}
        fontSize={0.05}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        Here's your expense overview
      </Text>
      
      {/* Stats Cards */}
      {/* Total Groups Card */}
      <mesh position={[-0.5, 0.3, 0.176]}>
        <boxGeometry args={[0.6, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, 0.4, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Total Groups
      </Text>
      
      <Text
        position={[-0.5, 0.25, 0.177]}
        fontSize={0.12}
        color="#2196F3"
        anchorX="center"
        anchorY="middle"
      >
        3
      </Text>
      
      {/* Net Balance Card */}
      <mesh position={[0.5, 0.3, 0.176]}>
        <boxGeometry args={[0.6, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[0.5, 0.4, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Net Balance
      </Text>
      
      <Text
        position={[0.5, 0.25, 0.177]}
        fontSize={0.12}
        color="#4CAF50"
        anchorX="center"
        anchorY="middle"
      >
        ₹245.50
      </Text>
      
      {/* You Owe Card */}
      <mesh position={[-0.5, -0.2, 0.176]}>
        <boxGeometry args={[0.6, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, -0.1, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        You Owe
      </Text>
      
      <Text
        position={[-0.5, -0.25, 0.177]}
        fontSize={0.12}
        color="#F44336"
        anchorX="center"
        anchorY="middle"
      >
        ₹156.75
      </Text>
      
      {/* You're Owed Card */}
      <mesh position={[0.5, -0.2, 0.176]}>
        <boxGeometry args={[0.6, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[0.5, -0.1, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        You're Owed
      </Text>
      
      <Text
        position={[0.5, -0.25, 0.177]}
        fontSize={0.12}
        color="#4CAF50"
        anchorX="center"
        anchorY="middle"
      >
        ₹402.25
      </Text>
      
      {/* Recent Activity Section */}
      <mesh position={[0, -0.8, 0.176]}>
        <boxGeometry args={[1.4, 0.5, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, -0.7, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        Recent Activity
      </Text>
      
      <Text
        position={[-0.5, -0.85, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        Dinner at Restaurant
      </Text>
      
      <Text
        position={[0.5, -0.85, 0.177]}
        fontSize={0.04}
        color="#F44336"
        anchorX="right"
        anchorY="middle"
      >
        ₹450.00
      </Text>
    </>
  );
}

function ExpensesScreen() {
  return (
    <>
      {/* Screen Background */}
      <mesh position={[0, 0, 0.175]}>
        <boxGeometry args={[1.6, 3.3, 0.001]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      
      {/* Header */}
      <Text
        position={[0, 1.3, 0.177]}
        fontSize={0.12}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        Recent Expenses
      </Text>
      
      {/* Expense Cards */}
      <mesh position={[0, 0.8, 0.176]}>
        <boxGeometry args={[1.4, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, 0.9, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        🍕 Dinner at Pizza Palace
      </Text>
      
      <Text
        position={[-0.5, 0.7, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        Today • Weekend Trip
      </Text>
      
      <Text
        position={[0.5, 0.8, 0.177]}
        fontSize={0.08}
        color="#F44336"
        anchorX="right"
        anchorY="middle"
      >
        ₹450.00
      </Text>
      
      {/* Second Expense */}
      <mesh position={[0, 0.2, 0.176]}>
        <boxGeometry args={[1.4, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, 0.3, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        ⛽ Fuel Station
      </Text>
      
      <Text
        position={[-0.5, 0.1, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        Yesterday • Personal
      </Text>
      
      <Text
        position={[0.5, 0.2, 0.177]}
        fontSize={0.08}
        color="#F44336"
        anchorX="right"
        anchorY="middle"
      >
        ₹1,200.00
      </Text>
      
      {/* Third Expense */}
      <mesh position={[0, -0.4, 0.176]}>
        <boxGeometry args={[1.4, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, -0.3, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        🛒 Grocery Shopping
      </Text>
      
      <Text
        position={[-0.5, -0.5, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        2 days ago • Grocery Group
      </Text>
      
      <Text
        position={[0.5, -0.4, 0.177]}
        fontSize={0.08}
        color="#F44336"
        anchorX="right"
        anchorY="middle"
      >
        ₹800.00
      </Text>
      
      {/* Fourth Expense */}
      <mesh position={[0, -1.0, 0.176]}>
        <boxGeometry args={[1.4, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, -0.9, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        ☕ Coffee Break
      </Text>
      
      <Text
        position={[-0.5, -1.1, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        3 days ago • Office Lunch
      </Text>
      
      <Text
        position={[0.5, -1.0, 0.177]}
        fontSize={0.08}
        color="#F44336"
        anchorX="right"
        anchorY="middle"
      >
        ₹150.00
      </Text>
    </>
  );
}

function GroupsScreen() {
  return (
    <>
      {/* Screen Background */}
      <mesh position={[0, 0, 0.175]}>
        <boxGeometry args={[1.6, 3.3, 0.001]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      
      {/* Header */}
      <Text
        position={[0, 1.3, 0.177]}
        fontSize={0.12}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        My Groups
      </Text>
      
      {/* Group Cards */}
      <mesh position={[0, 0.6, 0.176]}>
        <boxGeometry args={[1.4, 0.5, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, 0.7, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        🏖️ Weekend Trip
      </Text>
      
      <Text
        position={[-0.5, 0.5, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        4 members • ₹2,450 total
      </Text>
      
      <Text
        position={[0.5, 0.6, 0.177]}
        fontSize={0.08}
        color="#4CAF50"
        anchorX="right"
        anchorY="middle"
      >
        ₹245.50
      </Text>
      
      {/* Second Group */}
      <mesh position={[0, 0.0, 0.176]}>
        <boxGeometry args={[1.4, 0.5, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, 0.1, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        🍽️ Office Lunch
      </Text>
      
      <Text
        position={[-0.5, -0.1, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        6 members • ₹1,200 total
      </Text>
      
      <Text
        position={[0.5, 0.0, 0.177]}
        fontSize={0.08}
        color="#F44336"
        anchorX="right"
        anchorY="middle"
      >
        ₹200.00
      </Text>
      
      {/* Third Group */}
      <mesh position={[0, -0.6, 0.176]}>
        <boxGeometry args={[1.4, 0.5, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, -0.5, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        🛒 Grocery Shopping
      </Text>
      
      <Text
        position={[-0.5, -0.7, 0.177]}
        fontSize={0.04}
        color="#6b7280"
        anchorX="left"
        anchorY="middle"
      >
        2 members • ₹800 total
      </Text>
      
      <Text
        position={[0.5, -0.6, 0.177]}
        fontSize={0.08}
        color="#4CAF50"
        anchorX="right"
        anchorY="middle"
      >
        ₹400.00
      </Text>
    </>
  );
}

function ProfileScreen() {
  return (
    <>
      {/* Screen Background */}
      <mesh position={[0, 0, 0.175]}>
        <boxGeometry args={[1.6, 3.3, 0.001]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      
      {/* Profile Header */}
      <mesh position={[0, 1.0, 0.176]}>
        <boxGeometry args={[1.4, 0.8, 0.001]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>
      
      {/* Profile Avatar */}
      <mesh position={[0, 1.2, 0.177]}>
        <boxGeometry args={[0.3, 0.3, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[0, 1.2, 0.178]}
        fontSize={0.12}
        color="#6366f1"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        👤
      </Text>
      
      {/* User Name */}
      <Text
        position={[0, 0.8, 0.177]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        John Doe
      </Text>
      
      <Text
        position={[0, 0.7, 0.177]}
        fontSize={0.05}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        john.doe@email.com
      </Text>
      
      {/* Stats Section */}
      <mesh position={[0, 0.2, 0.176]}>
        <boxGeometry args={[1.4, 0.6, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[0, 0.4, 0.177]}
        fontSize={0.06}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        Your Stats
      </Text>
      
      {/* Stats Row 1 */}
      <Text
        position={[-0.4, 0.2, 0.177]}
        fontSize={0.05}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Groups Joined
      </Text>
      
      <Text
        position={[-0.4, 0.1, 0.177]}
        fontSize={0.08}
        color="#6366f1"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        3
      </Text>
      
      <Text
        position={[0.4, 0.2, 0.177]}
        fontSize={0.05}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Total Expenses
      </Text>
      
      <Text
        position={[0.4, 0.1, 0.177]}
        fontSize={0.08}
        color="#F44336"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        ₹2,600
      </Text>
      
      {/* Settings Section */}
      <mesh position={[0, -0.4, 0.176]}>
        <boxGeometry args={[1.4, 0.4, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[-0.5, -0.3, 0.177]}
        fontSize={0.05}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        ⚙️ Settings
      </Text>
      
      <Text
        position={[-0.5, -0.5, 0.177]}
        fontSize={0.05}
        color="#1e293b"
        anchorX="left"
        anchorY="middle"
      >
        🔔 Notifications
      </Text>
      
      {/* Logout Section */}
      <mesh position={[0, -0.9, 0.176]}>
        <boxGeometry args={[1.4, 0.3, 0.001]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      
      <Text
        position={[0, -0.9, 0.177]}
        fontSize={0.05}
        color="#F44336"
        anchorX="center"
        anchorY="middle"
      >
        🚪 Logout
      </Text>
    </>
  );
}

// 3D iPhone Model Component with realistic proportions and Evenly app screen
function PhoneModel() {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);
  const [currentScreen, setCurrentScreen] = useState(0);
  
  const screens = ['splash', 'main', 'expenses', 'groups', 'profile'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 3000); // Change screen every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  useFrame((state) => {
    // Gentle floating animation instead of rotation
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const renderCurrentScreen = () => {
    switch (screens[currentScreen]) {
      case 'splash':
        return <SplashScreen />;
      case 'main':
        return <MainAppScreen />;
      case 'expenses':
        return <ExpensesScreen />;
      case 'groups':
        return <GroupsScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <SplashScreen />;
    }
  };

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* iPhone Body - More realistic proportions (iPhone 15 Pro) */}
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <boxGeometry args={[1.9, 3.8, 0.3]} />
          <meshStandardMaterial 
            color="#1d1d1f" 
            metalness={0.95} 
            roughness={0.05}
            envMapIntensity={1.2}
          />
        </mesh>
        
        {/* Screen Bezel */}
        <mesh position={[0, 0, 0.16]}>
          <boxGeometry args={[1.75, 3.6, 0.01]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Screen */}
        <mesh position={[0, 0, 0.17]}>
          <boxGeometry args={[1.65, 3.4, 0.005]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Dynamic Screen Content */}
        {renderCurrentScreen()}
        
        {/* Dynamic Island - Pill Shape */}
        <group position={[0, 1.4, 0.18]}>
          {/* Main Dynamic Island Body - Pill Shape */}
          <mesh>
            <cylinderGeometry args={[0.11, 0.11, 0.015, 16]} />
            <meshStandardMaterial 
              color="#000000" 
              metalness={0.9} 
              roughness={0.05}
              envMapIntensity={0.8}
            />
          </mesh>
          
          {/* Dynamic Island Content */}
          <group position={[0, 0, 0.008]}>
            {/* Time Display */}
            <Text
              position={[-0.15, 0, 0]}
              fontSize={0.05}
              color="#ffffff"
              anchorX="center"
              anchorY="middle"
              fontWeight="600"
            >
              5:53
            </Text>
            
            {/* Battery Indicator */}
            <mesh position={[0.15, 0, 0]}>
              <boxGeometry args={[0.06, 0.03, 0.001]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
            
            {/* Signal/WiFi Indicators */}
            <mesh position={[0.08, 0, 0]}>
              <boxGeometry args={[0.04, 0.02, 0.001]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          </group>
          
          {/* Dynamic Island Glow Effect */}
          <mesh position={[0, 0, -0.002]}>
            <cylinderGeometry args={[0.12, 0.12, 0.005, 16]} />
            <meshStandardMaterial 
              color="#000000" 
              opacity={0.2} 
              transparent 
              emissive="#000000"
              emissiveIntensity={0.1}
            />
          </mesh>
        </group>
        
        {/* Home Indicator */}
        <mesh position={[0, -1.5, 0.18]}>
          <boxGeometry args={[0.9, 0.06, 0.01]} />
          <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>
        
        {/* Side Buttons - Volume */}
        <mesh position={[1.0, 0.9, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.08]} />
          <meshStandardMaterial color="#2c2c2e" />
        </mesh>
        
        <mesh position={[1.0, -0.9, 0]}>
          <boxGeometry args={[0.06, 0.4, 0.08]} />
          <meshStandardMaterial color="#2c2c2e" />
        </mesh>
        
        {/* Power Button */}
        <mesh position={[1.0, 0, 0]}>
          <boxGeometry args={[0.06, 0.15, 0.08]} />
          <meshStandardMaterial color="#2c2c2e" />
        </mesh>
        
        {/* Floating Elements */}
        <Float speed={1} rotationIntensity={1} floatIntensity={0.5}>
          <mesh position={[2.5, 1.2, 0]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.3} />
          </mesh>
        </Float>
        
        <Float speed={1.5} rotationIntensity={1} floatIntensity={0.3}>
          <mesh position={[-2.5, -1.2, 0]}>
            <sphereGeometry args={[0.06]} />
            <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.3} />
          </mesh>
        </Float>
        
        <Float speed={0.8} rotationIntensity={1} floatIntensity={0.4}>
          <mesh position={[2.0, -1.8, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#4f46e5" emissive="#4f46e5" emissiveIntensity={0.3} />
          </mesh>
        </Float>
        
        <Float speed={1.2} rotationIntensity={1} floatIntensity={0.3}>
          <mesh position={[-2.0, 1.8, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.06]} />
            <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
          </mesh>
        </Float>
      </group>
    </Float>
  );
}

// Main 3D Scene Component
export function Phone3DScene() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#818cf8" />
        
        <PhoneModel />
        
        <Environment preset="city" />
        <ContactShadows 
          position={[0, -2, 0]} 
          opacity={0.3} 
          scale={10} 
          blur={2} 
          far={4.5} 
        />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}

// Mobile Animation Container
export function MobileAnimation() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="relative w-full h-[500px] md:h-[600px] lg:h-[700px]"
    >
      <Phone3DScene />
      
      {/* Floating UI Elements - Evenly App Data */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-10 bg-primary/20 backdrop-blur-sm rounded-lg p-3 border border-primary/30"
      >
        <div className="text-xs text-primary font-medium">Net Balance</div>
        <div className="text-lg font-bold text-white">₹245.50</div>
      </motion.div>
      
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-10 bg-secondary/20 backdrop-blur-sm rounded-lg p-3 border border-secondary/30"
      >
        <div className="text-xs text-secondary-foreground font-medium">You're Owed</div>
        <div className="text-lg font-bold text-white">₹402.25</div>
      </motion.div>
      
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-5 bg-accent/20 backdrop-blur-sm rounded-lg p-3 border border-accent/30"
      >
        <div className="text-xs text-accent-foreground font-medium">You Owe</div>
        <div className="text-lg font-bold text-white">₹156.75</div>
      </motion.div>
    </motion.div>
  );
}
