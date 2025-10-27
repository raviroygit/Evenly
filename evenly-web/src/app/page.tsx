import { HeroSection } from '@/components/HeroSection';
import { FeaturesSection } from '@/components/FeaturesSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-background pt-16">
      <HeroSection />
      <FeaturesSection />
    </main>
  );
}