'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import NeuroLoader from '../components/NeuroLoader';

export default function AuthPage() {
  const [mode, setMode] = useState('signin'); // "signin" | "signup"
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/upload');
    });
  }, [router]);

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signup') {
        const { data: signUpData, error: signUpErr } =
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, app_source: 'neuroscan' },
            },
          });

        // Handle "User already registered" — guide them to sign in
        if (signUpErr && signUpErr.message?.toLowerCase().includes('already')) {
          setError(
            'An account with this email already exists. Please sign in instead.',
          );
          setMode('signin');
          return;
        }
        if (signUpErr) throw signUpErr;

        // For fresh signups — create neuroscan profile
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('neuroscan_profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: fullName,
          });
        }
        setSuccess(
          'Account created! Check your email for a confirmation link.',
        );
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;

        // Ensure Neuroscan profile exists on sign-in
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('neuroscan_profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
          });
        }
        router.push('/upload');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='auth-page'>
      {/* Animated mesh background */}
      <div className='auth-bg' aria-hidden='true'>
        <div className='auth-orb auth-orb-1' />
        <div className='auth-orb auth-orb-2' />
        <div className='auth-orb auth-orb-3' />
        <div className='auth-grid-overlay' />
      </div>

      <div className='auth-container'>
        {/* ─── LEFT: Brand panel ─── */}
        <div className='auth-brand'>
          <div className='auth-brand-inner'>
            <a href='/' className='auth-brand-logo'>
              Neuro<span>scan</span>
            </a>

            <div className='auth-brand-headline-wrapper'>
              <h2 className='auth-brand-headline' key={mode}>
                {mode === 'signin' ? 'Welcome back' : 'Join Neuroscan'}
              </h2>
            </div>

            <p className='auth-brand-desc'>
              {mode === 'signin'
                ? 'Sign in to access your MRI analysis dashboard, view past reports, and track results over time.'
                : 'Create your free account to save analyses, build a history of results, and access detailed medical visualizations.'}
            </p>

            {/* Feature cards */}
            <div className='auth-features'>
              <div className='auth-feature-card'>
                <div className='auth-feature-icon'>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <circle cx='12' cy='12' r='10' />
                    <path d='M12 6v6l4 2' />
                  </svg>
                </div>
                <div>
                  <strong>Instant Analysis</strong>
                  <span>Results in seconds with HUFA-Net AI</span>
                </div>
              </div>
              <div className='auth-feature-card'>
                <div className='auth-feature-icon'>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'>
                    <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
                  </svg>
                </div>
                <div>
                  <strong>Private &amp; Secure</strong>
                  <span>Your data stays protected</span>
                </div>
              </div>
              <div className='auth-feature-card'>
                <div className='auth-feature-icon'>
                  <svg
                    width='20'
                    height='20'
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
                </div>
                <div>
                  <strong>Saved Reports</strong>
                  <span>Access history anytime</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative brain scan visual */}
          <div className='auth-brand-visual' aria-hidden='true'>
            <div className='auth-scan-ring auth-scan-ring-1' />
            <div className='auth-scan-ring auth-scan-ring-2' />
            <div className='auth-scan-ring auth-scan-ring-3' />
            <div className='auth-scan-dot' />
          </div>
        </div>

        {/* ─── RIGHT: Form ─── */}
        <div className='auth-card'>
          <div className='auth-card-inner'>
            {/* Tab switcher with animated indicator */}
            <div className='auth-tabs'>
              <button
                className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccess(null);
                }}
                type='button'>
                Sign In
              </button>
              <button
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccess(null);
                }}
                type='button'>
                Sign Up
              </button>
              <div
                className='auth-tab-indicator'
                style={{
                  transform:
                    mode === 'signup' ? 'translateX(100%)' : 'translateX(0)',
                }}
              />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className='auth-form'>
              {/* Name — animated expand for signup */}
              <div
                className='auth-field-animate'
                style={{
                  maxHeight: mode === 'signup' ? 90 : 0,
                  opacity: mode === 'signup' ? 1 : 0,
                  marginBottom: mode === 'signup' ? 18 : 0,
                }}>
                <label htmlFor='auth-name' className='auth-label'>
                  Full Name
                </label>
                <div className='auth-input-wrap'>
                  <svg
                    className='auth-input-icon'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'>
                    <path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' />
                    <circle cx='12' cy='7' r='4' />
                  </svg>
                  <input
                    id='auth-name'
                    type='text'
                    className='auth-input'
                    placeholder='Your full name…'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete='name'
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className='auth-field'>
                <label htmlFor='auth-email' className='auth-label'>
                  Email Address
                </label>
                <div className='auth-input-wrap'>
                  <svg
                    className='auth-input-icon'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'>
                    <rect x='2' y='4' width='20' height='16' rx='2' />
                    <path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' />
                  </svg>
                  <input
                    id='auth-email'
                    type='email'
                    className='auth-input'
                    placeholder='you@example.com…'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete='email'
                    spellCheck={false}
                  />
                </div>
              </div>

              <div className='auth-field'>
                <label htmlFor='auth-password' className='auth-label'>
                  Password
                </label>
                <div className='auth-input-wrap'>
                  <svg
                    className='auth-input-icon'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    aria-hidden='true'>
                    <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
                    <path d='M7 11V7a5 5 0 0 1 10 0v4' />
                  </svg>
                  <input
                    id='auth-password'
                    type='password'
                    className='auth-input'
                    placeholder='Min 6 characters…'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete={
                      mode === 'signup' ? 'new-password' : 'current-password'
                    }
                  />
                </div>
              </div>

              {error && (
                <div className='auth-error' role='alert'>
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
                    <line x1='15' y1='9' x2='9' y2='15' />
                    <line x1='9' y1='9' x2='15' y2='15' />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className='auth-success' role='status'>
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
                    <path d='M22 11.08V12a10 10 0 1 1-5.93-9.14' />
                    <polyline points='22 4 12 14.01 9 11.01' />
                  </svg>
                  {success}
                </div>
              )}

              <button type='submit' className='auth-submit' disabled={loading}>
                {loading ? (
                  <>
                    <NeuroLoader size={22} color='#ffffff' />
                    {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </>
                ) : (
                  <>
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      aria-hidden='true'
                      style={{ transition: 'transform 0.3s' }}>
                      <line x1='5' y1='12' x2='19' y2='12' />
                      <polyline points='12 5 19 12 12 19' />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Mode switch */}
            <p className='auth-switch'>
              {mode === 'signin'
                ? "Don't have an account? "
                : 'Already have an account? '}
              <button
                type='button'
                onClick={toggleMode}
                className='auth-switch-btn'>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </button>
            </p>

            {/* Divider */}
            <div className='auth-footer-line' />
            <p className='auth-legal'>
              By continuing, you agree that this is a research tool and not a
              medical diagnostic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
