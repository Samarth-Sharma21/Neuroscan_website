import FloatingHeader from "./components/FloatingHeader";
import HeroSection from "./components/HeroSection";
import FeaturesSection from "./components/FeaturesSection";
import ModelSection from "./components/ModelSection";
import StagesShowcase from "./components/StagesShowcase";
import HowItWorksSection from "./components/HowItWorksSection";
import MobileAppSection from "./components/MobileAppSection";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      {/* Floating Glass Header */}
      <FloatingHeader />

      {/* Scrollytelling Hero — 300vh scroll-driven canvas animation */}
      <HeroSection />

      {/* Content sections */}
      <FeaturesSection />
      <ModelSection />
      <StagesShowcase />
      <HowItWorksSection />
      <MobileAppSection />
      <CTASection />

      {/* Footer */}
      <Footer />
    </>
  );
}
