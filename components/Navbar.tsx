'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useAppConfig } from '@/components/AuthProvider';

export default function Navbar() {
  const auth = useAuth();
  const { issuer, basePath } = useAppConfig();
  const user = auth.user?.profile;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.name ?? user?.preferred_username ?? user?.email ?? 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    const logoutUrl = `${issuer}/protocol/openid-connect/logout`;
    const idToken = auth.user?.id_token;
    const redirectUri = `${window.location.origin}${basePath}`;
    auth.removeUser().then(() => {
      window.location.href = `${logoutUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(redirectUri)}`;
    });
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
          <span>Task Manager</span>
        </div>

        <div className="navbar-user" ref={menuRef}>
          <button
            className="navbar-user-btn"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="navbar-avatar">{initials}</span>
            <span className="navbar-username">{displayName}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`navbar-caret ${menuOpen ? 'navbar-caret-open' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {menuOpen && (
            <div className="navbar-dropdown">
              <div className="navbar-dropdown-header">
                <span className="navbar-dropdown-name">{displayName}</span>
                {user?.email && (
                  <span className="navbar-dropdown-email">{user.email}</span>
                )}
              </div>
              <div className="navbar-dropdown-divider" />
              <button
                className="navbar-dropdown-item"
                onClick={handleSignOut}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
