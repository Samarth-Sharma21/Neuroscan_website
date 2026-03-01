'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function FloatingHeader() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
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

  // Close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
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

  return (
    <header className='floating-header' id='floating-header'>
      {/* Logo */}
      <a href='/' className='header-logo' style={{ textDecoration: 'none' }}>
        Neuro<span>scan</span>
      </a>

      {/* Navigation */}
      <nav>
        <ul className='header-nav'>
          <li>
            <a href='/'>Home</a>
          </li>
          <li>
            <a href={isHome ? '#features' : '/#features'}>Features</a>
          </li>
          <li>
            <a href={isHome ? '#how-it-works' : '/#how-it-works'}>
              How It Works
            </a>
          </li>
          <li>
            <a href='/doctors'>Doctors</a>
          </li>
          {loaded && user && (
            <li>
              <a href='/upload' className='header-nav-upload'>
                Upload
              </a>
            </li>
          )}
        </ul>
      </nav>

      {/* CTA / Auth */}
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
    </header>
  );
}
