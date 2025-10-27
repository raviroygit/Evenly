'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Mesh, Group, BoxGeometry, CylinderGeometry, SphereGeometry } from 'three';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// 3D Phone Model Component
function PhoneModel() {
  const meshRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Phone Body - More realistic iPhone proportions */}
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <boxGeometry args={[1.8, 3.6, 0.25]} />
          <meshStandardMaterial 
            color="#1a1a1a" 
            metalness={0.9} 
            roughness={0.1}
            envMapIntensity={1}
          />
        </mesh>
        
        {/* Screen Bezel */}
        <mesh position={[0, 0, 0.13]}>
          <boxGeometry args={[1.7, 3.4, 0.01]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Screen */}
        <mesh position={[0, 0, 0.14]}>
          <boxGeometry args={[1.6, 3.2, 0.005]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Screen Content */}
        <mesh position={[0, 0, 0.145]}>
          <boxGeometry args={[1.5, 3.0, 0.001]} />
          <meshStandardMaterial color="#818cf8" />
        </mesh>
        
        {/* Dynamic Island */}
        <mesh position={[0, 1.3, 0.15]}>
          <boxGeometry args={[0.6, 0.15, 0.01]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Home Indicator */}
        <mesh position={[0, -1.4, 0.15]}>
          <boxGeometry args={[0.8, 0.05, 0.01]} />
          <meshStandardMaterial color="#ffffff" opacity={0.3} transparent />
        </mesh>
        
        {/* Side Buttons */}
        <mesh position={[0.95, 0.8, 0]}>
          <boxGeometry args={[0.05, 0.3, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        
        <mesh position={[0.95, -0.8, 0]}>
          <boxGeometry args={[0.05, 0.3, 0.1]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        
        {/* Evenly Logo on Screen */}
        <Text
          position={[0, 0, 0.146]}
          fontSize={0.2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Evenly
        </Text>
        
        {/* App Icons on Screen */}
        <mesh position={[-0.4, 0.5, 0.146]}>
          <boxGeometry args={[0.15, 0.15, 0.001]} />
          <meshStandardMaterial color="#4f46e5" />
        </mesh>
        
        <mesh position={[0.4, 0.5, 0.146]}>
          <boxGeometry args={[0.15, 0.15, 0.001]} />
          <meshStandardMaterial color="#10b981" />
        </mesh>
        
        <mesh position={[-0.4, 0.2, 0.146]}>
          <boxGeometry args={[0.15, 0.15, 0.001]} />
          <meshStandardMaterial color="#f59e0b" />
        </mesh>
        
        <mesh position={[0.4, 0.2, 0.146]}>
          <boxGeometry args={[0.15, 0.15, 0.001]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
        
        {/* Floating Elements */}
        <Float speed={1} rotationIntensity={1} floatIntensity={0.5}>
          <mesh position={[2.2, 1, 0]}>
            <sphereGeometry args={[0.08]} />
            <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.3} />
          </mesh>
        </Float>
        
        <Float speed={1.5} rotationIntensity={1} floatIntensity={0.3}>
          <mesh position={[-2.2, -1, 0]}>
            <sphereGeometry args={[0.06]} />
            <meshStandardMaterial color="#6366f1" emissive="#6366f1" emissiveIntensity={0.3} />
          </mesh>
        </Float>
        
        <Float speed={0.8} rotationIntensity={1} floatIntensity={0.4}>
          <mesh position={[1.8, -1.5, 0]}>
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial color="#4f46e5" emissive="#4f46e5" emissiveIntensity={0.3} />
          </mesh>
        </Float>
        
        <Float speed={1.2} rotationIntensity={1} floatIntensity={0.3}>
          <mesh position={[-1.8, 1.5, 0]}>
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
          autoRotate 
          autoRotateSpeed={0.5}
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
      
      {/* Floating UI Elements */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 right-10 bg-primary/20 backdrop-blur-sm rounded-lg p-3 border border-primary/30"
      >
        <div className="text-xs text-primary font-medium">Split Bill</div>
        <div className="text-lg font-bold text-white">$24.50</div>
      </motion.div>
      
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-20 left-10 bg-secondary/20 backdrop-blur-sm rounded-lg p-3 border border-secondary/30"
      >
        <div className="text-xs text-secondary-foreground font-medium">Group Expense</div>
        <div className="text-lg font-bold text-white">$156.75</div>
      </motion.div>
      
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-5 bg-accent/20 backdrop-blur-sm rounded-lg p-3 border border-accent/30"
      >
        <div className="text-xs text-accent-foreground font-medium">You Owe</div>
        <div className="text-lg font-bold text-white">$12.25</div>
      </motion.div>
    </motion.div>
  );
}
