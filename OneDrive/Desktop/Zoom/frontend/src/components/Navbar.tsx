'use client';

import Link from 'next/link';
import { usePresence } from '../hooks/usePresence';

export default function Navbar() {
  const { stats } = usePresence();

  return (
    <header style={{
      width: '100%',
      padding: '16px 32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid var(--border-glass)',
      background: 'rgba(9, 11, 17, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#logoGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00DFD8" />
              <stop offset="100%" stopColor="#0070F3" />
            </linearGradient>
          </defs>
          <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l4.55 1.45A2 2 0 0 0 23 17V7z" fill="url(#logoGrad)" fillOpacity="0.15" />
        </svg>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '-0.5px'
        }}>
          ZOOM<span className="gradient-text-primary">SPACE</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <nav style={{ display: 'flex', gap: '20px', fontSize: '14px', fontWeight: 500 }}>
          <Link href="/" className="nav-link">Dashboard</Link>
          <Link href="/join" className="nav-link">Join</Link>
          <Link href="/schedule" className="nav-link">Schedule</Link>
        </nav>
        
        <div style={{
          padding: '6px 12px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-glass)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
          <span>{stats.online_users} Online</span>
        </div>

        {/* Settings button placeholder */}
        <button 
          className="nav-icon-btn"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          title="Settings"
          onClick={() => alert("Settings panel placeholder clicked.")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>

        {/* Profile Avatar placeholder */}
        <div 
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7928CA 0%, #FF0080 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#FFFFFF',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            userSelect: 'none'
          }}
          title="Default User profile"
          onClick={() => alert("Profile panel placeholder clicked.")}
        >
          DU
        </div>
      </div>
    </header>
  );
}
