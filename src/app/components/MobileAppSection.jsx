'use client';
import { useState, useEffect } from 'react';

const SCREENS = [
  {
    id: 'home',
    badge: 'HUFA-Net AI Model',
    title: ['Detect Dementia', 'From Brain MRI'],
    stats: [
      { value: '4', label: 'Classes' },
      { value: '97.9%', label: 'Accuracy', accent: true },
      { value: 'HUFA', label: 'Module' },
    ],
  },
  {
    id: 'upload',
    badge: 'Upload MRI Scan',
    title: ['Select Brain', 'MRI Image'],
    stats: [
      { value: 'JPG', label: 'Format' },
      { value: '10MB', label: 'Max Size' },
      { value: 'Auto', label: 'Detect' },
    ],
  },
  {
    id: 'results',
    badge: 'Classification Result',
    title: ['Non Demented', '95.2% Confidence'],
    stats: [
      { value: 'L0', label: 'Severity' },
      { value: '95.2%', label: 'Confidence', accent: true },
      { value: 'Low', label: 'Risk' },
    ],
  },
  {
    id: 'history',
    badge: 'Scan History',
    title: ['Your Previous', 'Scan Reports'],
    stats: [
      { value: '12', label: 'Total Scans' },
      { value: 'PDF', label: 'Reports', accent: true },
      { value: '100%', label: 'Saved' },
    ],
  },
];

const SCREEN_LABELS = ['Home', 'Upload', 'Results', 'History'];

export default function MobileAppSection() {
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % SCREENS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const screen = SCREENS[activeScreen];

  return (
    <section className="mobileapp-section" id="mobile-app">
      <div className="mobileapp-inner">
        <div className="mobileapp-content">
          <div className="section-eyebrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            Mobile App
          </div>
          <h2 className="section-title">
            NeuroScan on your phone
          </h2>
          <p className="section-subtitle">
            Scan MRIs on the go with our companion mobile app. Built with Expo
            for a smooth native experience on both Android and iOS.
          </p>

          <div className="mobileapp-features-list">
            <div className="mobileapp-feature-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Instant MRI Classification</span>
            </div>
            <div className="mobileapp-feature-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Attention Heatmap Visualization</span>
            </div>
            <div className="mobileapp-feature-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Confidence Scores & PDF Reports</span>
            </div>
            <div className="mobileapp-feature-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Scan History & Cloud Sync</span>
            </div>
          </div>

          <div className="mobileapp-download-btns">
            <a
              href="https://drive.google.com/file/d/1EqJw8-Oqz4WcWsShk-Uu2QAGl-4IhaPT/view?usp=drive_link"
              className="mobileapp-download-btn android"
              id="download-android-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.523 2.242a.625.625 0 0 0-.858.218l-1.43 2.477A8.022 8.022 0 0 0 12 4.25c-1.14 0-2.227.238-3.234.687L7.335 2.46a.625.625 0 1 0-1.076.64l1.39 2.408A8.028 8.028 0 0 0 4 12.25h16a8.028 8.028 0 0 0-3.649-6.742l1.39-2.408a.625.625 0 0 0-.218-.858zM9 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM4 13.25h1v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6h1a1 1 0 1 1 0 2h-1v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4H4a1 1 0 1 1 0-2z" />
              </svg>
              <div className="mobileapp-btn-text">
                <span className="mobileapp-btn-label">Download</span>
                <span className="mobileapp-btn-platform">Android APK</span>
              </div>
            </a>

            <a
              href="#"
              className="mobileapp-download-btn ios"
              id="download-ios-btn"
              onClick={(e) => {
                e.preventDefault();
                alert('iOS version coming soon!\n\nThe app will be available on TestFlight in a future update.');
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="mobileapp-btn-text">
                <span className="mobileapp-btn-label">Coming Soon</span>
                <span className="mobileapp-btn-platform">For iOS</span>
              </div>
            </a>
          </div>
        </div>

        <div className="mobileapp-visual">
          <div className="mobileapp-phone-frame">
            <div className="mobileapp-phone-screen">
              <div className="mobileapp-phone-status-bar">
                <span>9:41</span>
                <div className="mobileapp-phone-notch" />
                <span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                  </svg>
                </span>
              </div>

              {/* Animated screen content */}
              <div className="mobileapp-phone-content">
                <div className="mobileapp-screen-slide" key={screen.id}>
                  <div className="mobileapp-phone-header">
                    <div className="mobileapp-phone-badge">{screen.badge}</div>
                    <div className="mobileapp-phone-title">
                      {screen.title[0]}<br/>{screen.title[1]}
                    </div>
                  </div>
                  <div className="mobileapp-phone-stats">
                    {screen.stats.map((stat, i) => (
                      <div
                        className={`mobileapp-phone-stat${stat.accent ? ' accent' : ''}`}
                        key={i}
                      >
                        <span className="stat-num">{stat.value}</span>
                        <span className="stat-lbl">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Screen indicator dots */}
              <div className="mobileapp-screen-dots">
                {SCREEN_LABELS.map((label, i) => (
                  <button
                    key={label}
                    className={`mobileapp-screen-dot${i === activeScreen ? ' active' : ''}`}
                    onClick={() => setActiveScreen(i)}
                    aria-label={`Show ${label} screen`}
                    type="button"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
