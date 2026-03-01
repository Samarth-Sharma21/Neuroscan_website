'use client';

import { useEffect, useRef, useState } from 'react';

function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();
          const isDecimal = String(target).includes('.');
          
          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            
            setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
            
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(target);
            }
          };
          
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration, hasAnimated]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function ModelSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('model-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    const items = sectionRef.current?.querySelectorAll('.model-animate');
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const stats = [
    { value: 97.9, suffix: '%', label: 'Classification\nAccuracy' },
    { value: 4, suffix: '', label: 'Dementia\nStages' },
    { value: 5, suffix: '', label: 'Repeated\nHoldout Runs' },
    { value: 0.98, suffix: '', label: 'Average\nAUC Score' },
  ];

  return (
    <section className="model-section" id="model" ref={sectionRef}>
      <div className="model-inner">
        {/* Background decoration */}
        <div className="model-bg-pattern" aria-hidden="true" />
        
        <div className="model-content model-animate">
          <div className="section-eyebrow model-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
              <path d="M10 21h4" />
            </svg>
            HUFA-Net Architecture
          </div>
          <h2 className="model-title">
            Hybrid Unified Feature<br />Attention Network
          </h2>
          <p className="model-description">
            HUFA-Net is a custom deep learning architecture that combines convolutional feature 
            extraction with a unified attention mechanism. The model processes brain MRI scans through 
            parallel spatial and channel attention pathways, enabling it to focus on the most 
            diagnostically relevant regions while maintaining high classification accuracy across 
            all four dementia stages.
          </p>

          <div className="model-architecture-tags">
            <span className="arch-tag">CNN Feature Extractor</span>
            <span className="arch-tag">Spatial Attention</span>
            <span className="arch-tag">Channel Attention</span>
            <span className="arch-tag">Hybrid Fusion</span>
            <span className="arch-tag">Multi-Class Classifier</span>
          </div>
        </div>

        <div className="model-stats-grid model-animate">
          {stats.map((stat, i) => (
            <div className="model-stat-card" key={i} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="model-stat-value">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="model-stat-label">
                {stat.label.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j === 0 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
