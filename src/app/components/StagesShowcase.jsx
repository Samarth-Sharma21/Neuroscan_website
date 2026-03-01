'use client';
import { useState, useEffect, useRef } from 'react';

const STAGES = [
  {
    num: '01',
    name: 'Non Demented',
    shortName: ['Non', 'Demented'],
    description: 'Normal cognitive function with no signs of neurodegeneration. Brain structure appears healthy with preserved cortical volume.',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #065F46 0%, #059669 50%, #34D399 100%)',
    stats: [
      { label: 'Risk Level', value: 'Minimal' },
      { label: 'Brain Volume', value: 'Normal' },
    ],
  },
  {
    num: '02',
    name: 'Very Mild',
    shortName: ['Very', 'Mild'],
    description: 'Earliest detectable changes — subtle hippocampal volume reduction that our HUFA attention module identifies before clinical symptoms appear.',
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #92400E 0%, #D97706 50%, #FBBF24 100%)',
    stats: [
      { label: 'Risk Level', value: 'Low' },
      { label: 'Attention', value: 'Hippocampus' },
    ],
  },
  {
    num: '03',
    name: 'Mild Dementia',
    shortName: ['Mild', 'Dementia'],
    description: 'Noticeable cognitive decline with measurable temporal lobe atrophy. The model detects expanded ventricles and thinning cortex in attention heatmaps.',
    color: '#ea580c',
    gradient: 'linear-gradient(135deg, #9A3412 0%, #EA580C 50%, #FB923C 100%)',
    stats: [
      { label: 'Risk Level', value: 'Moderate' },
      { label: 'Atrophy', value: 'Temporal' },
    ],
  },
  {
    num: '04',
    name: 'Moderate Dementia',
    shortName: ['Moderate', 'Dementia'],
    description: 'Significant neurodegeneration with widespread cortical thinning. The attention overlay shows diffuse activation across multiple brain regions.',
    color: '#dc2626',
    gradient: 'linear-gradient(135deg, #991B1B 0%, #DC2626 50%, #F87171 100%)',
    stats: [
      { label: 'Risk Level', value: 'High' },
      { label: 'Regions', value: 'Multiple' },
    ],
  },
];

export default function StagesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const active = STAGES[activeIndex];

  return (
    <section
      className={`stages-section ${isVisible ? 'stages-visible' : ''}`}
      id="stages"
      ref={sectionRef}
    >
      <div className="stages-inner">
        {/* LEFT: Interactive Menu */}
        <div className="stages-menu">
          <div className="section-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            Classification Stages
          </div>
          <nav className="stages-nav">
            {STAGES.map((stage, i) => (
              <button
                key={stage.num}
                className={`stages-item ${i === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => setActiveIndex(i)}
                type="button"
                style={{ '--stage-color': stage.color }}
              >
                <span className={`stages-num ${i === activeIndex ? 'active' : ''}`}>
                  {stage.num}
                </span>
                <div className="stages-text">
                  <h3 className="stages-name">
                    {stage.shortName[0]}<br />{stage.shortName[1]}
                  </h3>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* RIGHT: Animated Visual Card */}
        <div className="stages-visual">
          <div
            className="stages-card"
            key={activeIndex}
            style={{ '--stage-gradient': active.gradient, '--stage-color': active.color }}
          >
            {/* Background decorative brain grid */}
            <div className="stages-card-bg" aria-hidden="true">
              <svg viewBox="0 0 400 400" className="stages-grid-svg">
                {/* Animated circles grid */}
                {Array.from({ length: 36 }, (_, i) => {
                  const col = i % 6;
                  const row = Math.floor(i / 6);
                  const cx = col * 72 + 20;
                  const cy = row * 72 + 20;
                  const delay = (col + row) * 0.06;
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r="4"
                      fill="rgba(255,255,255,0.08)"
                      style={{
                        animation: `stageDotPulse 3s ease-in-out ${delay}s infinite`,
                      }}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="stages-card-content">
              <div className="stages-badge" style={{ background: `${active.color}20`, color: active.color, borderColor: `${active.color}40` }}>
                Stage {active.num}
              </div>
              <h3 className="stages-card-title">{active.name}</h3>
              <p className="stages-card-desc">{active.description}</p>

              <div className="stages-card-stats">
                {active.stats.map((stat) => (
                  <div className="stages-stat" key={stat.label}>
                    <span className="stages-stat-label">{stat.label}</span>
                    <span className="stages-stat-value" style={{ color: active.color }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Severity indicator bar */}
              <div className="stages-severity-bar">
                <div className="stages-severity-track">
                  <div
                    className="stages-severity-fill"
                    style={{
                      width: `${((activeIndex + 1) / STAGES.length) * 100}%`,
                      background: active.gradient,
                    }}
                  />
                </div>
                <div className="stages-severity-labels">
                  <span>Minimal</span>
                  <span>Severe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
