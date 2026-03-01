'use client';

export default function CTASection() {
  return (
    <section className="cta-section" id="cta">
      <div className="cta-card">
        {/* Mesh gradient decoration */}
        <div className="cta-mesh" aria-hidden="true" />
        <div className="cta-glow" aria-hidden="true" />
        
        <div className="cta-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Try It Now
        </div>
        
        <h2>See the model in action</h2>
        <p>
          Upload a brain MRI scan and view the classification output along with
          an attention heatmap — no setup or account needed.
        </p>
        
        <div className="cta-actions">
          <a href="/upload" className="cta-btn-primary" id="cta-upload-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload a Scan
          </a>
          <a href="#features" className="cta-btn-ghost">
            Learn More
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
