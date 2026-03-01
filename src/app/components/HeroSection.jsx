"use client";

import { useRef } from "react";
import CanvasSequence from "./CanvasSequence";
import HeroContent from "./HeroContent";

export default function HeroSection() {
  const heroRef = useRef(null);

  return (
    <section className="hero-section" id="hero" ref={heroRef}>
      <div className="sticky-scene">
        {/* Background canvas animation layer */}
        <CanvasSequence heroRef={heroRef} />

        {/* Foreground hero content layer */}
        <HeroContent />
      </div>
    </section>
  );
}
