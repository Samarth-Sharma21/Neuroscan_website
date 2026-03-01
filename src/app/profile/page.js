'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import FloatingHeader from '../components/FloatingHeader';
import Footer from '../components/Footer';
import NeuroLoader from '../components/NeuroLoader';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    avatar_url: '',
    age: null,
    sex: '',
    date_of_birth: '',
    blood_group: '',
    known_conditions: '',
    current_medications: '',
    allergies: '',
    family_history: '',
    clinical_notes: '',
  });
  const [clinicalForm, setClinicalForm] = useState({
    age: '',
    sex: '',
    date_of_birth: '',
    blood_group: '',
    known_conditions: '',
    current_medications: '',
    allergies: '',
    family_history: '',
    clinical_notes: '',
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('history');
  const [selectedReport, setSelectedReport] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const avatarInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);

      const { data: prof } = await supabase
        .from('neuroscan_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const metadataName = session.user.user_metadata?.full_name || '';
      const emailName = (session.user.email || '').split('@')[0] || '';
      const fallbackName = metadataName || emailName;

      if (prof) {
        const normalizedProfile = {
          ...prof,
          full_name: prof.full_name || fallbackName,
          age: prof.age ?? null,
          sex: prof.sex || '',
          date_of_birth: prof.date_of_birth || '',
          blood_group: prof.blood_group || '',
          known_conditions: prof.known_conditions || '',
          current_medications: prof.current_medications || '',
          allergies: prof.allergies || '',
          family_history: prof.family_history || '',
          clinical_notes: prof.clinical_notes || '',
        };

        setProfile(normalizedProfile);
        setEditName(normalizedProfile.full_name || '');
        setClinicalForm({
          age: normalizedProfile.age ?? '',
          sex: normalizedProfile.sex,
          date_of_birth: normalizedProfile.date_of_birth || '',
          blood_group: normalizedProfile.blood_group,
          known_conditions: normalizedProfile.known_conditions,
          current_medications: normalizedProfile.current_medications,
          allergies: normalizedProfile.allergies,
          family_history: normalizedProfile.family_history,
          clinical_notes: normalizedProfile.clinical_notes,
        });

        if (!prof.full_name && fallbackName) {
          await supabase.from('neuroscan_profiles').upsert({
            id: session.user.id,
            email: session.user.email,
            full_name: fallbackName,
            updated_at: new Date().toISOString(),
          });
        }
      } else {
        setProfile((prev) => ({
          ...prev,
          email: session.user.email || '',
          full_name: fallbackName,
        }));
        setEditName(fallbackName);
      }

      const { data: reps } = await supabase
        .from('neuroscan_reports')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      setReports(reps || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);

    const normalizedName = editName.trim();

    const { error: err } = await supabase.from('neuroscan_profiles').upsert({
      id: user.id,
      full_name: normalizedName,
      email: user.email,
      updated_at: new Date().toISOString(),
    });

    if (err) {
      setError(err.message);
    } else {
      setProfile((p) => ({ ...p, full_name: normalizedName }));
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const handleClinicalFieldChange = (field, value) => {
    setClinicalForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClinicalSave = async () => {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);

    const ageNumber =
      clinicalForm.age === '' ? null : Number.parseInt(clinicalForm.age, 10);
    if (
      ageNumber !== null &&
      (Number.isNaN(ageNumber) || ageNumber < 0 || ageNumber > 130)
    ) {
      setSaving(false);
      setError('Age must be between 0 and 130.');
      return;
    }

    const payload = {
      id: user.id,
      email: user.email,
      age: ageNumber,
      sex: clinicalForm.sex || null,
      date_of_birth: clinicalForm.date_of_birth || null,
      blood_group: clinicalForm.blood_group || null,
      known_conditions: clinicalForm.known_conditions || null,
      current_medications: clinicalForm.current_medications || null,
      allergies: clinicalForm.allergies || null,
      family_history: clinicalForm.family_history || null,
      clinical_notes: clinicalForm.clinical_notes || null,
      updated_at: new Date().toISOString(),
    };

    const { error: err } = await supabase
      .from('neuroscan_profiles')
      .upsert(payload);

    if (err) {
      setError(err.message);
    } else {
      setProfile((prev) => ({
        ...prev,
        ...payload,
      }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  /* ── Delete report ── */
  const handleDeleteReport = async (reportId) => {
    setDeletingId(reportId);
    const { error: err } = await supabase
      .from('neuroscan_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id);

    if (!err) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
    setDeletingId(null);
    setDeleteConfirmId(null);
  };

  /* ── Download PDF for a saved report ── */
  const downloadReportPdf = async (report) => {
    if (!report) return;
    setPdfLoading(true);
    try {
      const patientName =
        profile.full_name ||
        user?.user_metadata?.full_name ||
        (user?.email ? user.email.split('@')[0] : '') ||
        'anonymous';

      const pdfPayload = {
        prediction_id: report.prediction_id,
        predicted_class: report.predicted_class,
        confidence: report.confidence,
        severity_level: report.severity_level,
        severity_label: report.severity_label,
        class_description: report.class_description,
        probabilities: report.probabilities,
        input_filename: report.input_filename,
        model_version: report.model_version,
        attention_heatmap: report.attention_heatmap || null,
        attention_overlay: report.attention_overlay || null,
        hufa_stats: report.hufa_stats || null,
        brain_regions: report.brain_regions || null,
        risk_score: report.risk_score ?? null,
        risk_level: report.risk_level || null,
        attention_coverage_percent: report.attention_coverage_percent ?? null,
        confidence_reliability: report.confidence_reliability || null,
        clinical_explanation: report.clinical_explanation || null,
        recommendation: report.recommendation || null,
        normal_comparison_score: report.normal_comparison_score ?? null,
        patient_name: patientName,
        patient_details: {
          age: profile.age ?? null,
          sex: profile.sex ?? null,
          date_of_birth: profile.date_of_birth ?? null,
          blood_group: profile.blood_group ?? null,
          known_conditions: profile.known_conditions ?? null,
          current_medications: profile.current_medications ?? null,
          allergies: profile.allergies ?? null,
          family_history: profile.family_history ?? null,
          clinical_notes: profile.clinical_notes ?? null,
        },
      };

      const res = await fetch('/api/report/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pdfPayload),
      });
      if (!res.ok) throw new Error('PDF generation failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = patientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const ts = report.created_at
        ? new Date(report.created_at).toISOString().replace(/[:.]/g, '-').slice(0, 19)
        : new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
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

  /* ── Avatar upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image must be under 2 MB.');
      return;
    }

    setAvatarUploading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const avatarDataUrl = ev.target.result;

        const { error: err } = await supabase
          .from('neuroscan_profiles')
          .upsert({
            id: user.id,
            avatar_url: avatarDataUrl,
            updated_at: new Date().toISOString(),
          });

        if (err) {
          setError('Could not update avatar: ' + err.message);
        } else {
          setProfile((p) => ({ ...p, avatar_url: avatarDataUrl }));
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
        setAvatarUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Failed to upload avatar.');
      setAvatarUploading(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarUploading(true);
    const { error: err } = await supabase.from('neuroscan_profiles').upsert({
      id: user.id,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    });
    if (!err) {
      setProfile((p) => ({ ...p, avatar_url: null }));
    }
    setAvatarUploading(false);
  };

  /* ── Helpers ── */
  const displayName =
    profile.full_name ||
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Unnamed User';

  const initials = (displayName || user?.email || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : '';

  const totalScans = reports.length;
  const latestResult = reports[0];
  const uniqueClasses = [...new Set(reports.map((r) => r.predicted_class))];

  const severityColor = (level) =>
    ({
      0: '#059669',
      1: '#d97706',
      2: '#ea580c',
      3: '#dc2626',
    })[level] || '#64748b';

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) {
    return (
      <>
        <FloatingHeader />
        <main className='profile-page'>
          <div className='profile-loading'>
            <NeuroLoader size={52} color='var(--accent)' />
            <p>Loading profile…</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <FloatingHeader />

      {/* Hidden avatar input */}
      <input
        ref={avatarInputRef}
        type='file'
        accept='image/*'
        onChange={handleAvatarChange}
        style={{ display: 'none' }}
        aria-label='Upload avatar'
      />

      <main className='profile-page' id='profile-page'>
        {/* ─── Hero banner ─── */}
        <div className='profile-hero'>
          <div className='profile-hero-bg' aria-hidden='true'>
            <div className='profile-hero-orb profile-hero-orb-1' />
            <div className='profile-hero-orb profile-hero-orb-2' />
            <div className='profile-hero-grid' />
          </div>
        </div>

        {/* ─── Profile card (overlapping hero) ─── */}
        <div className='profile-content'>
          <div className='profile-card-wrap'>
            {/* Avatar with upload */}
            <div className='profile-avatar-wrapper'>
              <div
                className='profile-avatar-large clickable'
                onClick={() => avatarInputRef.current?.click()}
                role='button'
                tabIndex={0}
                aria-label='Change avatar'
                onKeyDown={(e) => {
                  if (e.key === 'Enter') avatarInputRef.current?.click();
                }}>
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url}
                    alt='Avatar'
                    className='profile-avatar-img'
                  />
                ) : (
                  initials
                )}
                <div className='profile-avatar-overlay'>
                  {avatarUploading ? (
                    <NeuroLoader size={20} color='#ffffff' />
                  ) : (
                    <svg
                      width='20'
                      height='20'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'>
                      <path d='M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' />
                      <circle cx='12' cy='13' r='4' />
                    </svg>
                  )}
                </div>
              </div>
              {profile.avatar_url && (
                <button
                  className='profile-avatar-remove'
                  onClick={removeAvatar}
                  type='button'
                  aria-label='Remove avatar'
                  title='Remove avatar'>
                  <svg
                    width='12'
                    height='12'
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
              )}
            </div>

            <div className='profile-info-card'>
              <div className='profile-info-header'>
                <div>
                  {editing ? (
                    <div className='profile-edit-row'>
                      <input
                        type='text'
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className='profile-edit-input'
                        placeholder='Your name…'
                        autoFocus
                      />
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className='profile-save-btn'
                        type='button'>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditName(profile.full_name || '');
                        }}
                        className='profile-cancel-btn'
                        type='button'>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h1 className='profile-name-display'>
                      {displayName}
                      <button
                        onClick={() => setEditing(true)}
                        className='profile-edit-trigger'
                        type='button'
                        aria-label='Edit name'>
                        <svg
                          width='14'
                          height='14'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <path d='M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' />
                          <path d='M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' />
                        </svg>
                      </button>
                    </h1>
                  )}
                  <p className='profile-email-display'>{user?.email}</p>
                  <p className='profile-member-since'>
                    Member since {memberSince}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className='profile-signout-btn'
                  type='button'>
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
                    <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
                    <polyline points='16 17 21 12 16 7' />
                    <line x1='21' y1='12' x2='9' y2='12' />
                  </svg>
                  Sign Out
                </button>
              </div>

              {error && (
                <div className='auth-error' role='alert'>
                  {error}
                </div>
              )}
              {saved && (
                <div className='auth-success' role='status'>
                  Profile updated!
                </div>
              )}
            </div>
          </div>

          {/* ─── Stats cards ─── */}
          <div className='profile-stats'>
            <div className='profile-stat'>
              <div className='profile-stat-icon' aria-hidden='true'>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'>
                  <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                  <polyline points='14 2 14 8 20 8' />
                  <line x1='16' y1='13' x2='8' y2='13' />
                  <line x1='16' y1='17' x2='8' y2='17' />
                </svg>
              </div>
              <div className='profile-stat-num'>{totalScans}</div>
              <div className='profile-stat-label'>Total Scans</div>
            </div>
            <div className='profile-stat'>
              <div className='profile-stat-icon' aria-hidden='true'>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'>
                  <circle cx='12' cy='12' r='10' />
                  <polyline points='12 6 12 12 16 14' />
                </svg>
              </div>
              <div className='profile-stat-num'>
                {latestResult ? latestResult.predicted_class : '—'}
              </div>
              <div className='profile-stat-label'>Latest Result</div>
            </div>
            <div className='profile-stat'>
              <div className='profile-stat-icon' aria-hidden='true'>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'>
                  <path d='M22 12h-4l-3 9L9 3l-3 9H2' />
                </svg>
              </div>
              <div className='profile-stat-num'>
                {latestResult ? `${latestResult.confidence}%` : '—'}
              </div>
              <div className='profile-stat-label'>Confidence</div>
            </div>
            <div className='profile-stat'>
              <div className='profile-stat-icon' aria-hidden='true'>
                <svg
                  width='22'
                  height='22'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'>
                  <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
                  <line x1='3' y1='9' x2='21' y2='9' />
                  <line x1='9' y1='21' x2='9' y2='9' />
                </svg>
              </div>
              <div className='profile-stat-num'>{uniqueClasses.length}</div>
              <div className='profile-stat-label'>Unique Classes</div>
            </div>
          </div>

          {/* ─── Tab navigation ─── */}
          <div className='profile-tabs'>
            <button
              className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
              type='button'>
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
                <circle cx='12' cy='12' r='10' />
                <polyline points='12 6 12 12 16 14' />
              </svg>
              Scan History
            </button>
            <button
              className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
              type='button'>
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
                <circle cx='12' cy='12' r='3' />
                <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' />
              </svg>
              Settings
            </button>
          </div>

          {/* ─── Tab content ─── */}
          {activeTab === 'history' && (
            <div className='profile-history'>
              {reports.length === 0 ? (
                <div className='profile-empty'>
                  <div className='profile-empty-icon' aria-hidden='true'>
                    <svg
                      width='40'
                      height='40'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'>
                      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
                      <polyline points='14 2 14 8 20 8' />
                    </svg>
                  </div>
                  <h3>No scans yet</h3>
                  <p>Upload your first MRI to see results here.</p>
                  <a href='/upload' className='profile-cta-btn'>
                    Upload MRI
                  </a>
                </div>
              ) : (
                <div className='profile-reports-grid'>
                  {reports.map((r) => (
                    <div
                      className='profile-report-card clickable'
                      key={r.id}
                      onClick={() => setSelectedReport(r)}
                      role='button'
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setSelectedReport(r);
                      }}>
                      <div className='profile-report-top'>
                        <div className='profile-report-actions'>
                          <div
                            className='profile-report-severity'
                            style={{
                              background: `${severityColor(r.severity_level)}14`,
                              borderColor: `${severityColor(r.severity_level)}30`,
                              color: severityColor(r.severity_level),
                            }}>
                            L{r.severity_level}
                          </div>
                        </div>
                        <div className='profile-report-actions'>
                          <span className='profile-report-date'>
                            {formatDate(r.created_at)}
                          </span>
                          <button
                            className='profile-report-delete'
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(r.id);
                            }}
                            type='button'
                            aria-label='Delete scan'
                            title='Delete this scan'>
                            <svg
                              width='14'
                              height='14'
                              viewBox='0 0 24 24'
                              fill='none'
                              stroke='currentColor'
                              strokeWidth='2'
                              strokeLinecap='round'
                              strokeLinejoin='round'>
                              <polyline points='3 6 5 6 21 6' />
                              <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <h4 className='profile-report-class'>
                        {r.predicted_class}
                      </h4>
                      <div className='profile-report-meta'>
                        <div className='profile-report-conf-bar'>
                          <div
                            className='profile-report-conf-fill'
                            style={{ width: `${r.confidence}%` }}
                          />
                        </div>
                        <span className='profile-report-conf-val'>
                          {r.confidence}%
                        </span>
                      </div>
                      {r.input_filename && (
                        <p className='profile-report-filename'>
                          {r.input_filename}
                        </p>
                      )}
                      <div className='profile-report-view-hint'>
                        View Full Report
                        <svg
                          width='12'
                          height='12'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2.5'
                          strokeLinecap='round'
                          strokeLinejoin='round'>
                          <polyline points='9 18 15 12 9 6' />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className='profile-settings'>
              {/* Avatar Settings */}
              <div className='profile-settings-card'>
                <h3>Profile Picture</h3>
                <div className='profile-avatar-settings'>
                  <div className='profile-avatar-preview'>
                    {profile.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profile.avatar_url}
                        alt='Avatar'
                        className='profile-avatar-settings-img'
                      />
                    ) : (
                      <div className='profile-avatar-settings-placeholder'>
                        {initials}
                      </div>
                    )}
                  </div>
                  <div className='profile-avatar-settings-actions'>
                    <button
                      className='profile-save-btn'
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      type='button'>
                      {avatarUploading ? 'Uploading…' : 'Upload Photo'}
                    </button>
                    {profile.avatar_url && (
                      <button
                        className='profile-cancel-btn'
                        onClick={removeAvatar}
                        disabled={avatarUploading}
                        type='button'>
                        Remove
                      </button>
                    )}
                    <p className='profile-avatar-hint'>
                      JPG, PNG or GIF. Max 2 MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className='profile-settings-card'>
                <h3>Account Information</h3>
                <div className='profile-settings-row'>
                  <label>Email</label>
                  <p>{user?.email}</p>
                </div>
                <div className='profile-settings-row'>
                  <label>Name</label>
                  <p>{displayName || '—'}</p>
                </div>
                <div className='profile-settings-row'>
                  <label>Member Since</label>
                  <p>{memberSince}</p>
                </div>
                <div className='profile-settings-row'>
                  <label>Total Analyses</label>
                  <p>{totalScans}</p>
                </div>
              </div>

              <div className='profile-settings-card'>
                <h3>Clinical Profile</h3>
                <p className='profile-clinical-hint'>
                  These optional details are used in generated PDF reports.
                  Leave any field blank if unavailable.
                </p>

                <div className='profile-clinical-grid'>
                  <div className='profile-field'>
                    <label htmlFor='profile-age'>Age</label>
                    <input
                      id='profile-age'
                      type='number'
                      min='0'
                      max='130'
                      value={clinicalForm.age}
                      onChange={(e) =>
                        handleClinicalFieldChange('age', e.target.value)
                      }
                      placeholder='e.g. 68'
                    />
                  </div>
                  <div className='profile-field'>
                    <label htmlFor='profile-sex'>Sex</label>
                    <select
                      id='profile-sex'
                      value={clinicalForm.sex}
                      onChange={(e) =>
                        handleClinicalFieldChange('sex', e.target.value)
                      }>
                      <option value=''>Select</option>
                      <option value='Male'>Male</option>
                      <option value='Female'>Female</option>
                      <option value='Other'>Other</option>
                    </select>
                  </div>
                  <div className='profile-field'>
                    <label htmlFor='profile-dob'>Date of Birth</label>
                    <input
                      id='profile-dob'
                      type='date'
                      value={clinicalForm.date_of_birth}
                      onChange={(e) =>
                        handleClinicalFieldChange(
                          'date_of_birth',
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className='profile-field'>
                    <label htmlFor='profile-blood'>Blood Group</label>
                    <input
                      id='profile-blood'
                      type='text'
                      value={clinicalForm.blood_group}
                      onChange={(e) =>
                        handleClinicalFieldChange('blood_group', e.target.value)
                      }
                      placeholder='e.g. B+'
                    />
                  </div>
                  <div className='profile-field profile-field-full'>
                    <label htmlFor='profile-conditions'>Known Conditions</label>
                    <textarea
                      id='profile-conditions'
                      value={clinicalForm.known_conditions}
                      onChange={(e) =>
                        handleClinicalFieldChange(
                          'known_conditions',
                          e.target.value,
                        )
                      }
                      placeholder='Diabetes, hypertension, etc.'
                      rows={2}
                    />
                  </div>
                  <div className='profile-field profile-field-full'>
                    <label htmlFor='profile-meds'>Current Medications</label>
                    <textarea
                      id='profile-meds'
                      value={clinicalForm.current_medications}
                      onChange={(e) =>
                        handleClinicalFieldChange(
                          'current_medications',
                          e.target.value,
                        )
                      }
                      placeholder='List active medications'
                      rows={2}
                    />
                  </div>
                  <div className='profile-field profile-field-full'>
                    <label htmlFor='profile-allergies'>Allergies</label>
                    <textarea
                      id='profile-allergies'
                      value={clinicalForm.allergies}
                      onChange={(e) =>
                        handleClinicalFieldChange('allergies', e.target.value)
                      }
                      placeholder='Drug/food/environment allergies'
                      rows={2}
                    />
                  </div>
                  <div className='profile-field profile-field-full'>
                    <label htmlFor='profile-family-history'>
                      Family History
                    </label>
                    <textarea
                      id='profile-family-history'
                      value={clinicalForm.family_history}
                      onChange={(e) =>
                        handleClinicalFieldChange(
                          'family_history',
                          e.target.value,
                        )
                      }
                      placeholder='Family neurological history'
                      rows={2}
                    />
                  </div>
                  <div className='profile-field profile-field-full'>
                    <label htmlFor='profile-notes'>
                      General Clinical Notes
                    </label>
                    <textarea
                      id='profile-notes'
                      value={clinicalForm.clinical_notes}
                      onChange={(e) =>
                        handleClinicalFieldChange(
                          'clinical_notes',
                          e.target.value,
                        )
                      }
                      placeholder='Additional notes'
                      rows={3}
                    />
                  </div>
                </div>

                <div className='profile-clinical-actions'>
                  <button
                    onClick={handleClinicalSave}
                    disabled={saving}
                    className='profile-save-btn'
                    type='button'>
                    {saving ? 'Saving…' : 'Save Clinical Details'}
                  </button>
                </div>
              </div>

              <div className='profile-settings-card danger-zone'>
                <h3>Danger Zone</h3>
                <p>Sign out of your account on this device.</p>
                <button
                  onClick={handleSignOut}
                  className='profile-danger-btn'
                  type='button'>
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
                    <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
                    <polyline points='16 17 21 12 16 7' />
                    <line x1='21' y1='12' x2='9' y2='12' />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── Full Report Modal ─── */}
      {selectedReport && (
        <div
          className='report-modal-backdrop'
          onClick={() => setSelectedReport(null)}>
          <div className='report-modal' onClick={(e) => e.stopPropagation()}>
            <div className='report-modal-header'>
              <h3>Scan Report — {formatDate(selectedReport.created_at)}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className='report-pdf-download-btn'
                  onClick={() => downloadReportPdf(selectedReport)}
                  disabled={pdfLoading}
                  type='button'
                  aria-label='Download PDF report'
                  title='Download PDF Report'>
                  {pdfLoading ? (
                    <NeuroLoader size={16} color='var(--accent)' />
                  ) : (
                    <svg
                      width='16'
                      height='16'
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
                  )}
                  <span>{pdfLoading ? 'Generating...' : 'Download PDF'}</span>
                </button>
                <button
                  className='report-modal-close'
                  onClick={() => setSelectedReport(null)}
                  type='button'
                  aria-label='Close'>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                </button>
              </div>
            </div>
            <div className='report-modal-content'>
              {/* Summary */}
              <div className='report-summary'>
                <div
                  className='report-badge-lg'
                  style={{
                    background: `${severityColor(selectedReport.severity_level)}14`,
                    borderColor: `${severityColor(selectedReport.severity_level)}30`,
                    color: severityColor(selectedReport.severity_level),
                  }}>
                  {selectedReport.predicted_class} — L
                  {selectedReport.severity_level}
                </div>
                <div className='report-stat-grid'>
                  <div>
                    <label>Confidence</label>
                    <span>{selectedReport.confidence}%</span>
                  </div>
                  <div>
                    <label>Severity</label>
                    <span>
                      {selectedReport.severity_label ||
                        `Level ${selectedReport.severity_level}`}
                    </span>
                  </div>
                  <div>
                    <label>Filename</label>
                    <span>{selectedReport.input_filename || '—'}</span>
                  </div>
                  <div>
                    <label>Model</label>
                    <span>{selectedReport.model_version || 'HUFA-Net'}</span>
                  </div>
                </div>
                {selectedReport.class_description && (
                  <p className='report-description'>
                    {selectedReport.class_description}
                  </p>
                )}
              </div>

              {/* Probabilities */}
              {selectedReport.probabilities && (
                <div>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: 16,
                      color: 'var(--foreground)',
                    }}>
                    Class Probabilities
                  </h4>
                  {Object.entries(selectedReport.probabilities).map(
                    ([cls, prob]) => (
                      <div
                        className='prob-item'
                        key={cls}
                        style={{ marginBottom: 10 }}>
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
                    ),
                  )}
                </div>
              )}

              {/* Visuals */}
              <div className='report-visuals'>
                {selectedReport.attention_heatmap ? (
                  <div className='visual-block'>
                    <h4>Attention Heatmap</h4>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${selectedReport.attention_heatmap}`}
                      alt='Attention heatmap showing regions the model focused on'
                      className='report-full-img'
                    />
                  </div>
                ) : (
                  <div className='visual-block empty'>
                    <p>Attention heatmap not available for this scan</p>
                  </div>
                )}

                {selectedReport.attention_overlay ? (
                  <div className='visual-block'>
                    <h4>Attention Overlay</h4>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${selectedReport.attention_overlay}`}
                      alt='MRI with attention overlay'
                      className='report-full-img'
                    />
                  </div>
                ) : (
                  <div className='visual-block empty'>
                    <p>Attention overlay not available for this scan</p>
                  </div>
                )}
              </div>

              {/* HUFA Stats */}
              {selectedReport.hufa_stats && (
                <div>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: 16,
                      color: 'var(--foreground)',
                    }}>
                    HUFA Model Statistics
                  </h4>
                  <div className='hufa-stats-grid'>
                    {Object.entries(selectedReport.hufa_stats).map(
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

              {/* Risk Assessment */}
              {selectedReport.risk_score != null && (
                <div>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: 16,
                      color: 'var(--foreground)',
                    }}>
                    Risk Assessment
                  </h4>
                  {selectedReport.risk_level && (
                    <span
                      className={`risk-badge risk-${(selectedReport.risk_level || '').toLowerCase()}`}>
                      {selectedReport.risk_level} Risk
                    </span>
                  )}
                  <div className='risk-meter'>
                    <div className='risk-meter-header'>
                      <span className='risk-meter-label'>Risk Score</span>
                      <span className='risk-meter-value'>
                        {Number(selectedReport.risk_score).toFixed(1)}%
                      </span>
                    </div>
                    <div className='risk-meter-bar'>
                      <div
                        className={`risk-meter-fill risk-${(selectedReport.risk_level || '').toLowerCase()}`}
                        style={{ width: `${selectedReport.risk_score}%` }}
                      />
                    </div>
                  </div>
                  {selectedReport.attention_coverage_percent != null && (
                    <div className='risk-meter'>
                      <div className='risk-meter-header'>
                        <span className='risk-meter-label'>
                          Attention Coverage
                        </span>
                        <span className='risk-meter-value'>
                          {Number(
                            selectedReport.attention_coverage_percent,
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className='risk-meter-bar'>
                        <div
                          className='risk-meter-fill risk-coverage'
                          style={{
                            width: `${selectedReport.attention_coverage_percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {selectedReport.normal_comparison_score != null && (
                    <div className='risk-meter'>
                      <div className='risk-meter-header'>
                        <span className='risk-meter-label'>
                          Normal Comparison
                        </span>
                        <span className='risk-meter-value'>
                          {Number(
                            selectedReport.normal_comparison_score,
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                      <div className='risk-meter-bar'>
                        <div
                          className='risk-meter-fill risk-normal'
                          style={{
                            width: `${selectedReport.normal_comparison_score}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  {selectedReport.confidence_reliability && (
                    <p
                      style={{
                        fontSize: '0.82rem',
                        color: 'var(--gray-500)',
                        marginTop: 10,
                      }}>
                      Confidence Reliability:{' '}
                      <strong>{selectedReport.confidence_reliability}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* Clinical Analysis */}
              {(selectedReport.clinical_explanation ||
                selectedReport.recommendation) && (
                <div>
                  <h4
                    style={{
                      fontSize: '1rem',
                      fontWeight: 700,
                      marginBottom: 16,
                      color: 'var(--foreground)',
                    }}>
                    Clinical Analysis
                  </h4>
                  {selectedReport.clinical_explanation && (
                    <p
                      style={{
                        fontSize: '0.88rem',
                        lineHeight: 1.6,
                        color: 'var(--gray-600)',
                        marginBottom: 14,
                      }}>
                      {selectedReport.clinical_explanation}
                    </p>
                  )}
                  {selectedReport.recommendation && (
                    <div
                      className={`recommendation-box risk-${(selectedReport.risk_level || '').toLowerCase()}`}>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          lineHeight: 1.6,
                          margin: 0,
                        }}>
                        <strong>Recommendation:</strong>{' '}
                        {selectedReport.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Brain Regions */}
              {selectedReport.brain_regions &&
                selectedReport.brain_regions.length > 0 && (
                  <div>
                    <h4
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        marginBottom: 16,
                        color: 'var(--foreground)',
                      }}>
                      Affected Brain Regions
                    </h4>
                    <p className='brain-regions-summary'>
                      Primary attention detected in{' '}
                      <strong>
                        {selectedReport.brain_regions[0].region_name}
                      </strong>{' '}
                      ({selectedReport.brain_regions[0].attention_percent}%)
                    </p>
                    <div className='brain-regions-list'>
                      {selectedReport.brain_regions.map((region, idx) => (
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

              {/* Metadata footer */}
              <div className='report-footer'>
                <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>
                  Report ID: {selectedReport.prediction_id || selectedReport.id}{' '}
                  • {new Date(selectedReport.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Popup Modal ─── */}
      {deleteConfirmId && (
        <div
          className='delete-modal-backdrop'
          onClick={() => setDeleteConfirmId(null)}>
          <div className='delete-modal' onClick={(e) => e.stopPropagation()}>
            <div className='delete-modal-icon'>
              <svg
                width='32'
                height='32'
                viewBox='0 0 24 24'
                fill='none'
                stroke='#dc2626'
                strokeWidth='1.8'
                strokeLinecap='round'
                strokeLinejoin='round'>
                <polyline points='3 6 5 6 21 6' />
                <path d='M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' />
                <line x1='10' y1='11' x2='10' y2='17' />
                <line x1='14' y1='11' x2='14' y2='17' />
              </svg>
            </div>
            <h3>Delete Scan Report?</h3>
            <p>
              This action cannot be undone. The scan report and all associated
              data will be permanently removed.
            </p>
            <div className='delete-modal-actions'>
              <button
                className='delete-modal-cancel'
                onClick={() => setDeleteConfirmId(null)}
                type='button'>
                Cancel
              </button>
              <button
                className='delete-modal-confirm'
                onClick={() => handleDeleteReport(deleteConfirmId)}
                disabled={deletingId === deleteConfirmId}
                type='button'>
                {deletingId === deleteConfirmId ? (
                  <>
                    <NeuroLoader size={16} color='#ffffff' /> Deleting…
                  </>
                ) : (
                  'Yes, Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
