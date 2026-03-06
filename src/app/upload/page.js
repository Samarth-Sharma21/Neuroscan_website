'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import FloatingHeader from '../components/FloatingHeader';
import Footer from '../components/Footer';
import NeuroLoader from '../components/NeuroLoader';

const API_URL = '/api';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [profileName, setProfileName] = useState('');
  const [profileDetails, setProfileDetails] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  const [authChecked, setAuthChecked] = useState(false);

  // Check auth — redirect to /auth if not signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        // Not signed in — redirect to auth page
        window.location.href = '/auth';
        return;
      }
      setUser(session.user);
      setAuthChecked(true);

      const metadataName = session.user.user_metadata?.full_name || '';
      const emailName = (session.user.email || '').split('@')[0] || '';
      const initialName = metadataName || emailName;
      setProfileName(initialName);
      setPatientName(initialName);

      // Pre-fill patient name from profile
      supabase
        .from('neuroscan_profiles')
        .select(
          'full_name, age, sex, date_of_birth, blood_group, known_conditions, current_medications, allergies, family_history, clinical_notes',
        )
        .eq('id', session.user.id)
        .single()
        .then(({ data: prof }) => {
          if (!prof) return;
          const resolvedName = prof.full_name || metadataName || emailName;
          setProfileName(resolvedName);
          setPatientName(resolvedName);
          setProfileDetails({
            age: prof.age,
            sex: prof.sex,
            date_of_birth: prof.date_of_birth,
            blood_group: prof.blood_group,
            known_conditions: prof.known_conditions,
            current_medications: prof.current_medications,
            allergies: prof.allergies,
            family_history: prof.family_history,
            clinical_notes: prof.clinical_notes,
          });
        });

      // Fetch timeline
      fetch(`${API_URL}/timeline/${session.user.id}`)
        .then((r) => r.json())
        .then((d) => setTimeline(d.timeline || []))
        .catch(() => {});
    });
  }, []);

  // Close zoom modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && zoomImage) {
        setZoomImage(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoomImage]);

  /* ── file handling ── */
  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.).');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10 MB.');
      return;
    }
    setFile(f);
    setError(null);
    setResult(null);
    setSaveStatus(null);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      handleFile(dropped);
    },
    [handleFile],
  );

  const openFilePicker = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.click();
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setSaveStatus(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  /* ── Save report to Supabase ── */
  const saveReport = async (data) => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const { error: err } = await supabase.from('neuroscan_reports').insert({
        user_id: user.id,
        prediction_id: data.prediction_id,
        predicted_class: data.predicted_class,
        confidence: data.confidence,
        severity_level: data.severity_level,
        severity_label: data.severity_label,
        class_description: data.class_description,
        probabilities: data.probabilities,
        input_filename: data.input_filename || file?.name,
        model_version: data.model_version,
        attention_heatmap: data.attention_heatmap || null,
        attention_overlay: data.attention_overlay || null,
        hufa_stats: data.hufa_stats || null,
        brain_regions: data.brain_regions || null,
        risk_score: data.risk_score ?? null,
        risk_level: data.risk_level || null,
        attention_coverage_percent: data.attention_coverage_percent ?? null,
        confidence_reliability: data.confidence_reliability || null,
        clinical_explanation: data.clinical_explanation || null,
        recommendation: data.recommendation || null,
        normal_comparison_score: data.normal_comparison_score ?? null,
      });
      if (err) throw err;
      setSaveStatus('saved');
      // Refresh timeline
      fetch(`${API_URL}/timeline/${user.id}`)
        .then((r) => r.json())
        .then((d) => setTimeline(d.timeline || []))
        .catch(() => {});
    } catch {
      setSaveStatus('error');
    }
  };

  /* ── API call ── */
  const analyzeImage = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaveStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (res.status === 429) {
        setError('Rate limit reached. Please wait a moment and try again.');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Server error (${res.status})`);
      }

      const data = await res.json();
      setResult(data);

      // Auto-save to Supabase if logged in
      if (user) {
        saveReport(data);
      }

      // scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    } catch (err) {
      setError(
        err.message || 'Could not reach the analysis server. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  /* ── helpers ── */
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const severityClass = (level) => `severity-${level ?? 0}`;

  const riskColorClass = (level) => {
    if (!level) return '';
    if (level.includes('Low')) return 'risk-low';
    if (level.includes('Moderate')) return 'risk-moderate';
    return 'risk-high';
  };

  const downloadPdf = async () => {
    if (!result) return;
    setPdfLoading(true);
    try {
      const fallbackName =
        profileName ||
        user?.user_metadata?.full_name ||
        (user?.email ? user.email.split('@')[0] : '') ||
        'anonymous';
      const resolvedPatientName = patientName.trim() || fallbackName;

      // Build payload with patient name and original image
      const pdfPayload = {
        ...result,
        patient_name: resolvedPatientName,
        patient_details: {
          age: profileDetails?.age ?? null,
          sex: profileDetails?.sex ?? null,
          date_of_birth: profileDetails?.date_of_birth ?? null,
          blood_group: profileDetails?.blood_group ?? null,
          known_conditions: profileDetails?.known_conditions ?? null,
          current_medications: profileDetails?.current_medications ?? null,
          allergies: profileDetails?.allergies ?? null,
          family_history: profileDetails?.family_history ?? null,
          clinical_notes: profileDetails?.clinical_notes ?? null,
        },
      };
      // Add the original uploaded image as base64 (strip data URI prefix)
      if (preview) {
        const b64 = preview.split(',')[1] || preview;
        pdfPayload.original_image = b64;
      }
      const res = await fetch(`${API_URL}/report/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use patient name in filename
      const safeName = resolvedPatientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `neuroscan_report_${safeName}_${ts}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not generate PDF report. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  /* ── Image download helper ── */
  const downloadImage = (b64Data, filenamePrefix) => {
    try {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${b64Data}`;
      const safeName = (patientName || 'scan').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `${filenamePrefix}_${safeName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setError('Could not download image.');
    }
  };

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <>
        <FloatingHeader />
        <main className='upload-page' id='upload-page'>
          <div className='profile-loading' style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <NeuroLoader size={52} color='var(--accent)' />
            <p style={{ marginTop: 16, color: 'var(--gray-400)', fontSize: '0.9rem' }}>Checking authentication…</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <FloatingHeader />

      {/* Hidden file input — outside the upload zone so it never intercepts clicks */}
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        onChange={(e) => {
          handleFile(e.target.files[0]);
          e.target.value = '';
        }}
        style={{ display: 'none' }}
        aria-label='Select MRI image file'
        id='mri-file-input'
      />

      <main className='upload-page' id='upload-page'>
        <div className='upload-container'>
          {/* Back button */}
          <div style={{ marginBottom: 24 }}>
            <Link href='/' className='upload-back-btn'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'>
                <polyline points='15 18 9 12 15 6' />
              </svg>
              Back to Home
            </Link>
          </div>

          {/* Header */}
          <div className='upload-header'>
            <div className='section-eyebrow'>Analysis Tool</div>
            <h1>Upload Brain MRI</h1>
            <p>
              Upload a brain MRI scan to receive a dementia stage
              classification, confidence scores, and attention visualizations
              from the HUFA-Net model.
            </p>
          </div>

          {/* Upload Zone */}
          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}${
              file ? ' has-file' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (!file) openFilePicker();
            }}
            role='button'
            tabIndex={0}
            aria-label='Upload MRI image'
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !file) {
                e.preventDefault();
                openFilePicker();
              }
            }}>
            {!file ? (
              <>
                <div className='upload-zone-icon' aria-hidden='true'>
                  <svg
                    width='28'
                    height='28'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                    <polyline points='17 8 12 3 7 8' />
                    <line x1='12' y1='3' x2='12' y2='15' />
                  </svg>
                </div>
                <h3>Drag &amp; drop your MRI scan here</h3>
                <p>
                  or click to browse &middot; JPG, PNG &middot; Max 10&nbsp;MB
                </p>
              </>
            ) : (
              <div className='file-preview'>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview}
                  alt='MRI preview'
                  className='file-preview-thumb'
                  width='56'
                  height='56'
                />
                <div className='file-preview-info'>
                  <p className='file-preview-name'>{file.name}</p>
                  <p className='file-preview-size'>{formatSize(file.size)}</p>
                </div>
                <button
                  className='file-preview-remove'
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    removeFile();
                  }}
                  aria-label='Remove file'
                  type='button'>
                  <svg
                    width='14'
                    height='14'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'>
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Patient Name Input */}
          {file && (
            <div className='patient-name-field'>
              <label htmlFor='patient-name' className='patient-name-label'>
                Patient Name{' '}
                <span style={{ color: 'var(--gray-400)', fontWeight: 400 }}>
                  (optional, defaults to your account name)
                </span>
              </label>
              <input
                id='patient-name'
                type='text'
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder='Enter patient name'
                className='patient-name-input'
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className='error-banner' role='alert'>
              <svg
                width='18'
                height='18'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                aria-hidden='true'>
                <circle cx='12' cy='12' r='10' />
                <line x1='15' y1='9' x2='9' y2='15' />
                <line x1='9' y1='9' x2='15' y2='15' />
              </svg>
              {error}
            </div>
          )}

          {/* Analyze Button */}
          <button
            className='analyze-btn'
            onClick={analyzeImage}
            disabled={!file || loading}
            type='button'
            id='analyze-btn'>
            {loading ? (
              <>
                <NeuroLoader size={28} color='#ffffff' />
                Analysing…
              </>
            ) : (
              <>
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  aria-hidden='true'>
                  <circle cx='11' cy='11' r='8' />
                  <line x1='21' y1='21' x2='16.65' y2='16.65' />
                </svg>
                Analyse Scan
              </>
            )}
          </button>

          {/* ─── Results ─── */}
          {result && (
            <section
              className='results-section'
              ref={resultsRef}
              aria-label='Analysis results'>
              {/* Save status indicator */}
              {user && saveStatus && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 16,
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    background:
                      saveStatus === 'saved'
                        ? '#f0fdf4'
                        : saveStatus === 'error'
                          ? '#fef2f2'
                          : 'var(--accent-subtle)',
                    color:
                      saveStatus === 'saved'
                        ? '#166534'
                        : saveStatus === 'error'
                          ? '#991b1b'
                          : 'var(--accent)',
                    border: `1px solid ${
                      saveStatus === 'saved'
                        ? '#bbf7d0'
                        : saveStatus === 'error'
                          ? '#fecaca'
                          : 'rgba(44,102,110,0.15)'
                    }`,
                  }}
                  role='status'>
                  {saveStatus === 'saving' && 'Saving report…'}
                  {saveStatus === 'saved' && '✓ Report saved to your dashboard'}
                  {saveStatus === 'error' &&
                    'Could not save report — you can try again from the dashboard'}
                </div>
              )}

              {/* Download PDF Button */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  marginBottom: 20,
                }}>
                <button
                  className='pdf-download-btn'
                  onClick={downloadPdf}
                  disabled={pdfLoading}
                  type='button'>
                  {pdfLoading ? (
                    <>
                      <NeuroLoader size={18} color='#ffffff' />
                      Generating PDF…
                    </>
                  ) : (
                    <>
                      <svg
                        width='16'
                        height='16'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        aria-hidden='true'>
                        <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                        <polyline points='7 10 12 15 17 10' />
                        <line x1='12' y1='15' x2='12' y2='3' />
                      </svg>
                      Download PDF Report
                    </>
                  )}
                </button>
              </div>

              <div className='results-grid'>
                {/* Prediction Card */}
                <div className='result-card'>
                  <h3>Prediction</h3>
                  <div className='prediction-badge'>
                    <p className='prediction-class'>{result.predicted_class}</p>
                    <span
                      className={`prediction-confidence ${severityClass(
                        result.severity_level,
                      )}`}>
                      {result.confidence}%
                    </span>
                  </div>
                  <p className='prediction-desc'>{result.class_description}</p>
                  {result.severity_label && (
                    <p
                      style={{
                        marginTop: 12,
                        fontSize: '0.82rem',
                        color: 'var(--gray-400)',
                      }}>
                      Severity: {result.severity_label} (Level{' '}
                      {result.severity_level})
                    </p>
                  )}
                  {result.confidence_reliability && (
                    <p
                      style={{
                        marginTop: 6,
                        fontSize: '0.82rem',
                        color: 'var(--gray-400)',
                      }}>
                      Confidence Reliability:{' '}
                      <strong
                        style={{
                          color:
                            result.confidence_reliability === 'High'
                              ? '#059669'
                              : result.confidence_reliability === 'Moderate'
                                ? '#d97706'
                                : '#dc2626',
                        }}>
                        {result.confidence_reliability}
                      </strong>
                    </p>
                  )}
                </div>

                {/* Risk Assessment Card */}
                <div className='result-card'>
                  <h3>Risk Assessment</h3>
                  {result.risk_level ? (
                    <>
                      <div
                        className={`risk-badge ${riskColorClass(result.risk_level)}`}>
                        {result.risk_level}
                      </div>
                      {result.risk_score != null && (
                        <div className='risk-meter'>
                          <div className='risk-meter-header'>
                            <span className='risk-meter-label'>Risk Score</span>
                            <span className='risk-meter-value'>
                              {result.risk_score}%
                            </span>
                          </div>
                          <div className='risk-meter-bar'>
                            <div
                              className={`risk-meter-fill ${riskColorClass(result.risk_level)}`}
                              style={{
                                width: `${Math.min(result.risk_score, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {result.attention_coverage_percent != null && (
                        <div className='risk-meter'>
                          <div className='risk-meter-header'>
                            <span className='risk-meter-label'>
                              Attention Coverage
                            </span>
                            <span className='risk-meter-value'>
                              {result.attention_coverage_percent}%
                            </span>
                          </div>
                          <div className='risk-meter-bar'>
                            <div
                              className='risk-meter-fill risk-coverage'
                              style={{
                                width: `${Math.min(result.attention_coverage_percent, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {result.normal_comparison_score != null && (
                        <div className='risk-meter'>
                          <div className='risk-meter-header'>
                            <span className='risk-meter-label'>
                              Normal Comparison
                            </span>
                            <span className='risk-meter-value'>
                              {result.normal_comparison_score}%
                            </span>
                          </div>
                          <div className='risk-meter-bar'>
                            <div
                              className='risk-meter-fill risk-normal'
                              style={{
                                width: `${Math.min(result.normal_comparison_score, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--gray-400)',
                        margin: '12px 0 0',
                        lineHeight: 1.5,
                      }}>
                      Risk metrics are being computed. If this persists, the
                      backend may still be deploying.
                    </p>
                  )}
                </div>

                {/* Probabilities Card */}
                <div className='result-card'>
                  <h3>Class Probabilities</h3>
                  {result.probabilities &&
                    Object.entries(result.probabilities).map(([cls, prob]) => (
                      <div className='prob-item' key={cls}>
                        <div className='prob-header'>
                          <span className='prob-name'>{cls}</span>
                          <span className='prob-value'>{prob}%</span>
                        </div>
                        <div className='prob-bar'>
                          <div
                            className='prob-fill'
                            style={{ width: `${prob}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>

                {/* Clinical Explanation & Recommendation */}
                <div className='result-card'>
                  <h3>Clinical Analysis</h3>
                  {result.clinical_explanation ? (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <p
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--gray-400)',
                            margin: '0 0 6px 0',
                          }}>
                          Explanation
                        </p>
                        <p
                          style={{
                            fontSize: '0.9rem',
                            color: 'var(--gray-600)',
                            lineHeight: 1.6,
                            margin: 0,
                          }}>
                          {result.clinical_explanation}
                        </p>
                      </div>
                      {result.recommendation && (
                        <div
                          className={`recommendation-box ${riskColorClass(result.risk_level)}`}>
                          <p
                            style={{
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              color: 'inherit',
                              margin: '0 0 6px 0',
                              opacity: 0.8,
                            }}>
                            Recommendation
                          </p>
                          <p
                            style={{
                              fontSize: '0.9rem',
                              lineHeight: 1.6,
                              margin: 0,
                            }}>
                            {result.recommendation}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: 'var(--gray-400)',
                        margin: '12px 0 0',
                        lineHeight: 1.5,
                      }}>
                      Clinical analysis is being generated. If this persists,
                      the backend may still be deploying.
                    </p>
                  )}
                </div>

                {/* Brain Regions */}
                {result.brain_regions && result.brain_regions.length > 0 && (
                  <div className='result-card result-card-full'>
                    <h3>Affected Brain Regions</h3>
                    <p
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--gray-400)',
                        margin: '0 0 12px 0',
                        lineHeight: 1.5,
                        fontStyle: 'italic',
                        padding: '8px 12px',
                        background: 'var(--accent-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '2px solid var(--gray-300)',
                      }}>
                      Note: Region identification is approximate, based on atlas
                      mapping of 2D attention patterns. These regions indicate
                      where the model focused and should be clinically
                      correlated by a specialist.
                    </p>
                    <p className='brain-regions-summary'>
                      Primary attention detected in{' '}
                      <strong>{result.brain_regions[0].region_name}</strong> (
                      {result.brain_regions[0].attention_percent}%)
                    </p>
                    <div className='brain-regions-list'>
                      {result.brain_regions.map((region, idx) => (
                        <div
                          className='brain-region-item'
                          key={region.region_name}>
                          <div className='brain-region-header'>
                            <span className='brain-region-rank'>{idx + 1}</span>
                            <span className='brain-region-name'>
                              {region.region_name}
                            </span>
                            <span className='brain-region-pct'>
                              {region.attention_percent}%
                            </span>
                          </div>
                          <div className='prob-bar'>
                            <div
                              className='prob-fill brain-region-fill'
                              style={{ width: `${region.attention_percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attention Heatmap */}
                {result.attention_heatmap && (
                  <div className='result-card'>
                    <h3>Attention Heatmap</h3>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.attention_heatmap}`}
                      alt='HUFA-Net attention heatmap showing regions the model focused on'
                      className='attention-img zoomable-img'
                      loading='lazy'
                      onClick={() =>
                        setZoomImage(
                          `data:image/png;base64,${result.attention_heatmap}`,
                        )
                      }
                      title='Click to zoom'
                    />
                    <div className='img-actions'>
                      <button
                        type='button'
                        className='img-action-btn'
                        onClick={() =>
                          downloadImage(
                            result.attention_heatmap,
                            'attention_heatmap',
                          )
                        }>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                          <polyline points='7 10 12 15 17 10' />
                          <line x1='12' y1='15' x2='12' y2='3' />
                        </svg>
                        Download
                      </button>
                      <button
                        type='button'
                        className='img-action-btn'
                        onClick={() =>
                          setZoomImage(
                            `data:image/png;base64,${result.attention_heatmap}`,
                          )
                        }>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <circle cx='11' cy='11' r='8' />
                          <line x1='21' y1='21' x2='16.65' y2='16.65' />
                          <line x1='11' y1='8' x2='11' y2='14' />
                          <line x1='8' y1='11' x2='14' y2='11' />
                        </svg>
                        Zoom
                      </button>
                    </div>
                  </div>
                )}

                {/* Attention Overlay */}
                {result.attention_overlay && (
                  <div className='result-card'>
                    <h3>Attention Overlay</h3>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.attention_overlay}`}
                      alt='Side-by-side comparison: original MRI, attention map, and overlay'
                      className='attention-img zoomable-img'
                      loading='lazy'
                      onClick={() =>
                        setZoomImage(
                          `data:image/png;base64,${result.attention_overlay}`,
                        )
                      }
                      title='Click to zoom'
                    />
                    <div className='img-actions'>
                      <button
                        type='button'
                        className='img-action-btn'
                        onClick={() =>
                          downloadImage(
                            result.attention_overlay,
                            'attention_overlay',
                          )
                        }>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                          <polyline points='7 10 12 15 17 10' />
                          <line x1='12' y1='15' x2='12' y2='3' />
                        </svg>
                        Download
                      </button>
                      <button
                        type='button'
                        className='img-action-btn'
                        onClick={() =>
                          setZoomImage(
                            `data:image/png;base64,${result.attention_overlay}`,
                          )
                        }>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <circle cx='11' cy='11' r='8' />
                          <line x1='21' y1='21' x2='16.65' y2='16.65' />
                          <line x1='11' y1='8' x2='11' y2='14' />
                          <line x1='8' y1='11' x2='14' y2='11' />
                        </svg>
                        Zoom
                      </button>
                    </div>
                  </div>
                )}

                {/* Multi-scale Attention */}
                {(result.multiscale_attention || result.hufa_stats) && (
                  <div className='model-stats-divider result-card-full'>
                    <div className='model-stats-header'>
                      <svg
                        width='20'
                        height='20'
                        viewBox='0 0 24 24'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'>
                        <path d='M12 20V10' />
                        <path d='M18 20V4' />
                        <path d='M6 20v-4' />
                      </svg>
                      <h2>Model Statistics &amp; Technical Details</h2>
                    </div>
                    <p className='model-stats-subtitle'>
                      The following sections display internal model parameters
                      and attention visualizations from the HUFA-Net
                      architecture. These are intended for technical or research
                      reference.
                    </p>
                  </div>
                )}
                {result.multiscale_attention && (
                  <div className='result-card result-card-full'>
                    <h3>Multi-Scale Attention (Per HUFA Block)</h3>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${result.multiscale_attention}`}
                      alt='Multi-scale attention maps from each HUFA block at different spatial resolutions'
                      className='attention-img zoomable-img'
                      loading='lazy'
                      onClick={() =>
                        setZoomImage(
                          `data:image/png;base64,${result.multiscale_attention}`,
                        )
                      }
                      title='Click to zoom'
                    />
                    <div className='img-actions'>
                      <button
                        type='button'
                        className='img-action-btn'
                        onClick={() =>
                          downloadImage(
                            result.multiscale_attention,
                            'multiscale_attention',
                          )
                        }>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                          <polyline points='7 10 12 15 17 10' />
                          <line x1='12' y1='15' x2='12' y2='3' />
                        </svg>
                        Download
                      </button>
                      <button
                        type='button'
                        className='img-action-btn'
                        onClick={() =>
                          setZoomImage(
                            `data:image/png;base64,${result.multiscale_attention}`,
                          )
                        }>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <circle cx='11' cy='11' r='8' />
                          <line x1='21' y1='21' x2='16.65' y2='16.65' />
                          <line x1='11' y1='8' x2='11' y2='14' />
                          <line x1='8' y1='11' x2='14' y2='11' />
                        </svg>
                        Zoom
                      </button>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {timeline.length > 1 && (
                  <div className='result-card result-card-full'>
                    <h3>Scan Timeline</h3>
                    <div className='timeline-chart'>
                      {timeline.map((entry, idx) => {
                        const isLatest = idx === timeline.length - 1;
                        const riskVal = entry.risk_score ?? 0;
                        const barH = Math.max(riskVal, 5);
                        return (
                          <div
                            className={`timeline-bar-group ${isLatest ? 'timeline-latest' : ''}`}
                            key={entry.id || idx}
                            title={`${entry.predicted_class} — Risk: ${riskVal}%\n${new Date(entry.date).toLocaleDateString()}`}>
                            <div className='timeline-bar-wrapper'>
                              <div
                                className={`timeline-bar ${entry.risk_level ? riskColorClass(entry.risk_level) : ''}`}
                                style={{ height: `${barH}%` }}
                              />
                            </div>
                            <span className='timeline-label'>
                              {new Date(entry.date).toLocaleDateString(
                                undefined,
                                { month: 'short', day: 'numeric' },
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className='timeline-legend'>
                      <span className='timeline-legend-item'>
                        <span className='timeline-dot risk-low' /> Low
                      </span>
                      <span className='timeline-legend-item'>
                        <span className='timeline-dot risk-moderate' /> Moderate
                      </span>
                      <span className='timeline-legend-item'>
                        <span className='timeline-dot risk-high' /> High
                      </span>
                    </div>
                  </div>
                )}

                {/* HUFA Stats */}
                {result.hufa_stats && (
                  <div className='result-card result-card-full'>
                    <h3>HUFA Model Statistics</h3>
                    <div className='hufa-stats-grid'>
                      {Object.entries(result.hufa_stats).map(
                        ([block, stats]) => (
                          <div className='hufa-stat-card' key={block}>
                            <h4>{block.replace('_', ' ')}</h4>
                            <div className='hufa-stat-row'>
                              <span className='hufa-stat-label'>Alpha</span>
                              <span className='hufa-stat-value'>
                                {stats.alpha}
                              </span>
                            </div>
                            <div className='hufa-stat-row'>
                              <span className='hufa-stat-label'>Lambda U</span>
                              <span className='hufa-stat-value'>
                                {stats.lambda_u}
                              </span>
                            </div>
                            {stats.scale_weights && (
                              <div className='hufa-stat-row'>
                                <span className='hufa-stat-label'>
                                  Scale Weights
                                </span>
                                <span className='hufa-stat-value'>
                                  [{stats.scale_weights.join(', ')}]
                                </span>
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                {result.prediction_id && (
                  <div className='result-card result-card-full'>
                    <h3>Metadata</h3>
                    <div className='hufa-stats-grid'>
                      <div className='hufa-stat-card'>
                        <h4>Prediction ID</h4>
                        <p
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--gray-500)',
                            margin: 0,
                            wordBreak: 'break-all',
                          }}>
                          {result.prediction_id}
                        </p>
                      </div>
                      <div className='hufa-stat-card'>
                        <h4>Timestamp</h4>
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--gray-500)',
                            margin: 0,
                          }}>
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className='hufa-stat-card'>
                        <h4>Model Version</h4>
                        <p
                          style={{
                            fontSize: '0.82rem',
                            color: 'var(--gray-500)',
                            margin: 0,
                          }}>
                          {result.model_version}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Disclaimer */}
                <div
                  className='result-card result-card-full'
                  style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: '#991b1b',
                      margin: 0,
                      lineHeight: 1.5,
                      textAlign: 'center',
                    }}>
                    <strong>Disclaimer:</strong> This report is generated by an
                    AI model and is not a medical diagnosis. Always consult a
                    qualified healthcare professional for clinical decisions.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ─── Image Zoom Modal ─── */}
      {zoomImage && (
        <div
          className='zoom-overlay'
          onClick={() => setZoomImage(null)}
          role='dialog'
          aria-label='Zoomed image view'
          aria-modal='true'>
          <div className='zoom-content' onClick={(e) => e.stopPropagation()}>
            <button
              className='zoom-close'
              onClick={() => setZoomImage(null)}
              aria-label='Close zoom'
              type='button'>
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2.5'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <line x1='18' y1='6' x2='6' y2='18' />
                <line x1='6' y1='6' x2='18' y2='18' />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomImage} alt='Zoomed view' className='zoom-img' />
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
