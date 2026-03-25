import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AboutSection from "@/components/landing/AboutSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import MapSection from "@/components/landing/MapSection";
import ListSection from "@/components/landing/ListSection";
import ARSection from "@/components/landing/ARSection";
import AlumniSection from "@/components/landing/AlumniSection";
import PrivacySection from "@/components/landing/PrivacySection";
import SchoolShowcase from "@/components/landing/SchoolShowcase";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import BusinessSection from "@/components/landing/BusinessSection";
import FAQSection from "@/components/landing/FAQSection";
import FooterCTA from "@/components/landing/FooterCTA";

export default function Home() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <MapSection />
      <ListSection />
      <ARSection />
      <AlumniSection />
      <PrivacySection />
      <SchoolShowcase />
      <TestimonialsSection />
      <BusinessSection />
      <FAQSection />
      <FooterCTA />
    </main>
  );
}
