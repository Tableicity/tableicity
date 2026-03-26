import { useEffect, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import slide01 from "@john-assets/beast-01-hash-wall.png";
import slide02 from "@john-assets/beast-02-code-vault.png";
import slide03 from "@john-assets/beast-03-masked-table.png";
import slide04 from "@john-assets/beast-04-reveal-mode.png";
import slide05 from "@john-assets/beast-05-core-value-desk.png";
import slide06 from "@john-assets/beast-06-zk-network.png";
import slide07 from "@john-assets/beast-07-lock-shield.png";

const slides = [
  { src: slide01, alt: "Tableicity Encrypted Hash: Privacy-first cap table platform using SHA-256 encryption for equity ownership protection — a secure alternative to Carta.", duration: 7200, zoom: 1.08 },
  { src: slide02, alt: "Tableicity secure cap table code architecture featuring SHA-256 hashing, GDPR compliance, and Zero-Knowledge Proof stakeholder verification.", duration: 7200, zoom: 1.08 },
  { src: slide03, alt: "Tableicity Cap Table Dashboard showing encrypted stakeholder identities with pseudonymous hash labels like UQSQ-UHA5 and W375-EX65 — ownership data stays private by default.", duration: 14400, zoom: 1.62 },
  { src: slide04, alt: "Tableicity Cap Table Dashboard after auditor reveal showing real stakeholder names like Sarah Mitchell and James Carter — consent-based 30-minute identity access for compliance.", duration: 14400, zoom: 1.62 },
  { src: slide05, alt: "Tableicity Core Value Desk — founder workspace showcasing the privacy-first equity management philosophy behind Tableicity.", duration: 14400, zoom: 1.62 },
  { src: slide06, alt: "Tableicity Cap Table Dashboard showing SHA-256 hashed stakeholder identities, ZK-Proof verification network, and 30-minute auditor reveal access control.", duration: 7200, zoom: 1.08 },
  { src: slide07, alt: "Privacy-first capitalization table management software featuring encrypted stakeholder names and time-boxed auditor access to prevent data leaks.", duration: 7200, zoom: 1.08 },
];
const FADE_DURATION = 1;


export function MarketingSlideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(nextSlide, slides[currentIndex].duration);
    return () => clearTimeout(timeout);
  }, [currentIndex, nextSlide]);

  return (
    <div className="w-full" data-testid="marketing-slideshow">
      <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16/10" }}>
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentIndex}
            src={slides[currentIndex].src}
            alt={slides[currentIndex].alt}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: slides[currentIndex].zoom }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: FADE_DURATION, ease: "easeInOut" },
              scale: { duration: slides[currentIndex].duration / 1000, ease: "linear" },
            }}
            className="absolute inset-0 w-full h-full object-cover"
            data-testid={`slide-image-${currentIndex}`}
          />
        </AnimatePresence>

        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)" }}
        />

      </div>
    </div>
  );
}
