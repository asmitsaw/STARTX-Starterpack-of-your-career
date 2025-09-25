
import React from "react";
import HeroSection from "../components/HeroSection";
import FeaturesSection from "../components/FeaturesSection";
import Testimonialsection from "../components/Testimonialsection";
import Footer from "../components/Footer";

export default function Landing() {
  return (
    <div className="min-h-screen bg-black">
      <HeroSection />
      <FeaturesSection />
      <Testimonialsection />
      <Footer />
    </div>
  );
}
