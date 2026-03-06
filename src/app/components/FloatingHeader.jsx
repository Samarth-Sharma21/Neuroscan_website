'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function FloatingHeader() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest('.mobile-menu-btn')
      ) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    setMobileMenuOpen(false);
    await supabase.auth.signOut();
    router.push('/');
  };

  const initials = user
    ? (user.user_metadata?.full_name || user.email || 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Features', href: isHome ? '#features' : '/#features' },
    {
      label: 'How It Works',
      href: isHome ? '#how-it-works' : '/#how-it-works',
    },
    { label: 'Doctors', href: loaded && user ? '/doctors' : '/auth' },
  ];

  if (loaded && user) {
    navLinks.push({ label: 'Upload', href: '/upload' });
  }

  return (
    <>
      <header className='floating-header' id='floating-header'>
        {/* Logo */}
        <Link
          href='/'
          className='header-logo'
          style={{ textDecoration: 'none' }}>
          <Image
            src='/neuroscan-logo4.png'
            alt='NeuroScan Logo'
            className='header-logo-mark'
            width={32}
            height={32}
          />
          <span className='header-logo-text'>Neuro<span>scan</span></span>
        </Link>

        {/* Desktop Navigation */}
        <nav className='header-nav-desktop'>
          <ul className='header-nav'>
            {navLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Desktop CTA / Auth */}
        <div className='header-right-desktop'>
          {!loaded ? (
            <div
              className='header-cta'
              style={{ opacity: 0, pointerEvents: 'none' }}>
              &nbsp;
            </div>
          ) : user ? (
            <div className='header-user-menu' ref={menuRef}>
              <button
                className='header-avatar-btn'
                onClick={() => setMenuOpen((o) => !o)}
                aria-label='User menu'
                type='button'>
                {initials}
              </button>
              {menuOpen && (
                <div className='header-dropdown'>
                  <a
                    href='/upload'
                    className='header-dd-item'
                    onClick={() => setMenuOpen(false)}>
                    <svg
                      width='15'
                      height='15'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      aria-hidden='true'>
                      <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
                      <polyline points='17 8 12 3 7 8' />
                      <line x1='12' y1='3' x2='12' y2='15' />
                    </svg>
                    Upload MRI
                  </a>
                  <a
                    href='/doctors'
                    className='header-dd-item'
                    onClick={() => setMenuOpen(false)}>
                    <svg
                      width='15'
                      height='15'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      aria-hidden='true'>
                      <path d='M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
                      <circle cx='8.5' cy='7' r='4' />
                      <line x1='20' y1='8' x2='20' y2='14' />
                      <line x1='23' y1='11' x2='17' y2='11' />
                    </svg>
                    Doctors
                  </a>
                  <a
                    href='/profile'
                    className='header-dd-item'
                    onClick={() => setMenuOpen(false)}>
                    <svg
                      width='15'
                      height='15'
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
                    Profile
                  </a>
                  <div className='header-dd-divider' />
                  <button
                    className='header-dd-item danger'
                    onClick={handleSignOut}
                    type='button'>
                    <svg
                      width='15'
                      height='15'
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
              )}
            </div>
          ) : (
            <a href='/auth' className='header-cta'>
              Sign In
            </a>
          )}
        </div>

        {/* Mobile: hamburger button */}
        <button
          className='mobile-menu-btn'
          onClick={() => setMobileMenuOpen((o) => !o)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          type='button'>
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} />
          <span className={`hamburger-line ${mobileMenuOpen ? 'open' : ''}`} />
        </button>
      </header>

      {/* Mobile overlay menu */}
      {mobileMenuOpen && (
        <div
          className='mobile-menu-backdrop'
          onClick={() => setMobileMenuOpen(false)}>
          <nav
            className='mobile-menu-panel'
            ref={mobileMenuRef}
            onClick={(e) => e.stopPropagation()}>
            <div className='mobile-menu-header'>
              <Link
                href='/'
                className='header-logo'
                style={{ textDecoration: 'none' }}>
                <Image
                  src='/neuroscan-logo4.png'
                  alt='NeuroScan Logo'
                  className='header-logo-mark'
                  width={32}
                  height={32}
                />
                <span className='header-logo-text'>Neuro<span>scan</span></span>
              </Link>
              <button
                className='mobile-menu-close'
                onClick={() => setMobileMenuOpen(false)}
                aria-label='Close menu'
                type='button'>
                <svg
                  width='20'
                  height='20'
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
            </div>

            <ul className='mobile-nav-list'>
              {navLinks.map((link, i) => (
                <li key={link.label} style={{ animationDelay: `${i * 50}ms` }}>
                  <a href={link.href} onClick={() => setMobileMenuOpen(false)}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className='mobile-menu-footer'>
              {loaded && user ? (
                <>
                  <a
                    href='/profile'
                    className='mobile-menu-profile'
                    onClick={() => setMobileMenuOpen(false)}>
                    <div className='mobile-avatar'>{initials}</div>
                    <div>
                      <div className='mobile-user-name'>
                        {user.user_metadata?.full_name ||
                          user.email?.split('@')[0]}
                      </div>
                      <div className='mobile-user-email'>{user.email}</div>
                    </div>
                  </a>
                  <button
                    onClick={handleSignOut}
                    className='mobile-signout-btn'
                    type='button'>
                    <svg
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'>
                      <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
                      <polyline points='16 17 21 12 16 7' />
                      <line x1='21' y1='12' x2='9' y2='12' />
                    </svg>
                    Sign Out
                  </button>
                </>
              ) : (
                <a
                  href='/auth'
                  className='mobile-signin-btn'
                  onClick={() => setMobileMenuOpen(false)}>
                  Sign In
                </a>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
