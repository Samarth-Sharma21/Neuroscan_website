'use client';

import { useEffect, useRef } from 'react';

export default function FeaturesSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('feature-visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    const cards = sectionRef.current?.querySelectorAll('.feature-card');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
          <path d="M10 21h4" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
          <path d="M12 13a2 2 0 0 0 2-2" />
        </svg>
      ),
      title: 'Multi-Class Classification',
      description:
        'Classifies brain MRI images into four dementia stages — Non-Demented, Very Mild, Mild, and Moderate — using our hybrid feature extraction architecture.',
      accent: 'var(--accent)',
      accentBg: 'rgba(44, 102, 110, 0.1)',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="3" />
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
        </svg>
      ),
      title: 'Attention Heatmaps',
      description:
        "Generates attention overlays on the original MRI scan, revealing which spatial regions the HUFA module attends to during prediction.",
      accent: '#059669',
      accentBg: 'rgba(5, 150, 105, 0.1)',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      ),
      title: 'Structured Reporting',
      description:
        "Outputs the predicted class alongside per-class confidence scores, so users can review the model's certainty across all dementia stages.",
      accent: '#7c3aed',
      accentBg: 'rgba(124, 58, 237, 0.1)',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      ),
      title: 'Instant Analysis',
      description:
        'Upload any brain MRI and receive classification results in seconds through our cloud-hosted HUFA-Net inference pipeline.',
      accent: '#d97706',
      accentBg: 'rgba(217, 119, 6, 0.1)',
    },
  ];

  return (
    <section className="features-section" id="features" ref={sectionRef}>
      <div className="features-header">
        <div className="section-eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          Capabilities
        </div>
        <h2 className="section-title">
          Classification, visualization,
          <br />
          and confidence scoring
        </h2>
        <p className="section-subtitle">
          Neuroscan combines a trained deep learning model with attention-based
          interpretability to make the classification process transparent.
        </p>
      </div>

      <div className="features-grid">
        {features.map((f, i) => (
          <div
            className="feature-card"
            key={i}
            id={`feature-card-${i}`}
            style={{
              '--card-accent': f.accent,
              '--card-accent-bg': f.accentBg,
              animationDelay: `${i * 100}ms`,
            }}
          >
            <div className="feature-icon-wrap">
              <div className="feature-icon">{f.icon}</div>
            </div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            <div className="feature-accent-line" />
          </div>
        ))}
      </div>
    </section>
  );
}
