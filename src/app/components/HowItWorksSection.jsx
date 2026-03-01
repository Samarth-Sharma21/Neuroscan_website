'use client';

import { useEffect, useRef } from 'react';

export default function HowItWorksSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('step-visible');
          }
        });
      },
      { threshold: 0.2, rootMargin: '0px 0px -30px 0px' }
    );

    const steps = sectionRef.current?.querySelectorAll('.hiw-step');
    steps?.forEach((step) => observer.observe(step));

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: '01',
      title: 'Upload a Brain MRI',
      description:
        'Select a brain MRI image from your local files. The interface accepts standard image formats commonly used in neuroimaging datasets.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'HUFA-Net Processes the Scan',
      description:
        'The scan is passed through our hybrid attention-based deep learning network that extracts spatial features and classifies the dementia stage with 97.9% accuracy.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Review Results & Heatmap',
      description:
        'View the predicted dementia stage with per-class confidence scores and an attention heatmap showing which brain regions the model focused on.',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
  ];

  return (
    <section className="hiw-section" id="how-it-works" ref={sectionRef}>
      <div className="hiw-header">
        <div className="section-eyebrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Workflow
        </div>
        <h2 className="section-title">How it works</h2>
        <p className="section-subtitle">
          A straightforward three-step process — upload, classify, and interpret.
        </p>
      </div>

      <div className="hiw-steps-grid">
        {steps.map((s, i) => (
          <div
            className="hiw-step"
            key={i}
            id={`step-${i}`}
            style={{ animationDelay: `${i * 150}ms` }}
          >
            <div className="hiw-step-header">
              <span className="hiw-step-number">{s.number}</span>
              <div className="hiw-step-icon">{s.icon}</div>
            </div>
            <h3>{s.title}</h3>
            <p>{s.description}</p>
            {i < steps.length - 1 && (
              <div className="hiw-connector" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
