'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import UpcomingMeetings from '../components/UpcomingMeetings';
import RecentMeetings from '../components/RecentMeetings';
import { usePresence } from '../hooks/usePresence';

export default function Home() {
  const { stats } = usePresence();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('user_id', '1');
    }
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '32px 24px',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      {/* Split main dashboard layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
        gap: '32px',
        width: '100%',
      }} className="dashboard-grid">
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 968px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}} />

        {/* Left column: Quick Actions & Call History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Quick Actions grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px'
          }}>
            {/* New Meeting action card */}
            <Link href="/new-meeting" style={{
              background: 'linear-gradient(135deg, #FF6B4A 0%, #FF451D 100%)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '180px',
              boxShadow: '0 8px 24px rgba(255, 69, 29, 0.25)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 69, 29, 0.4)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 69, 29, 0.25)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 7l-7 5 7 5V7z"></path>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>New Meeting</h3>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>Start an instant room</span>
              </div>
            </Link>

            {/* Join Room action card */}
            <Link href="/join" style={{
              background: 'linear-gradient(135deg, #1E80F0 0%, #0055D0 100%)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '180px',
              boxShadow: '0 8px 24px rgba(0, 85, 208, 0.25)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 85, 208, 0.4)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 85, 208, 0.25)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="16 11 18 13 22 9"></polyline>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>Join Meeting</h3>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>Enter invitation code</span>
              </div>
            </Link>

            {/* Schedule Room action card */}
            <Link href="/schedule" style={{
              background: 'linear-gradient(135deg, #8E54E9 0%, #4776E6 100%)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '180px',
              boxShadow: '0 8px 24px rgba(142, 84, 233, 0.25)',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }} onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(142, 84, 233, 0.4)';
            }} onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(142, 84, 233, 0.25)';
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', marginBottom: '4px' }}>Schedule</h3>
                <span style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.75)' }}>Plan future meetings</span>
              </div>
            </Link>
          </div>

          {/* Recent Meetings call history */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Recent Meetings
            </h2>
            <RecentMeetings />
          </div>

        </div>

        {/* Right column: Time Clock Widget & Schedule Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Calendar Wall Clock widget */}
          <div style={{
            background: 'linear-gradient(135deg, #1A2135 0%, #0F1322 100%)',
            border: '1px solid var(--border-glass)',
            borderRadius: '24px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '180px',
            boxShadow: 'var(--shadow-glass)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Blurry gradient light */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: 'rgba(0, 112, 243, 0.15)',
              filter: 'blur(30px)'
            }} />
            
            <h1 style={{
              fontSize: '44px',
              fontWeight: 800,
              color: '#FFFFFF',
              letterSpacing: '-1px',
              lineHeight: 1.1,
              fontFamily: 'var(--font-display)',
              zIndex: 2
            }}>
              {time || '00:00 AM'}
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--primary)',
              fontWeight: 600,
              marginTop: '4px',
              zIndex: 2
            }}>
              {date || 'Loading date...'}
            </p>
          </div>

          {/* Real-time Presence Stats widget */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
          }}>
            <div className="glass-panel" style={{ padding: '16px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                {stats.total_users}
              </span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Total Users</p>
            </div>
            <div className="glass-panel" style={{ padding: '16px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success)', fontFamily: 'var(--font-display)' }}>
                {stats.online_users}
              </span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Online Now</p>
            </div>
            <div className="glass-panel" style={{ padding: '16px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                {stats.in_meeting_users}
              </span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>In Meeting</p>
            </div>
          </div>

          {/* Upcoming Meetings calendar schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Upcoming Schedule
            </h2>
            <UpcomingMeetings />
          </div>

        </div>
      </div>
    </div>
  );
}
