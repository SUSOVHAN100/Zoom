'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '../../services/api';
import MeetingActionButton from '../../components/MeetingActionButton';

export default function NewMeetingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Automatically trigger instant meeting creation
    apiService.createInstantMeeting("Instant Meeting Room", "Quick ad-hoc sync room")
      .then(data => {
        // Automatically set display name for the host (the seeded default user)
        sessionStorage.setItem('display_name', 'Default User');
        if (data.host_participant) {
          sessionStorage.setItem(`meeting_participant_${data.meeting_id}`, data.host_participant.id.toString());
        }
        
        // Redirect directly to the meeting room page
        router.push(`/meeting/${data.meeting_id}`);
      })
      .catch(err => {
        console.error("Instant meeting creation failed:", err);
        setError(err.message || 'Failed to create instant meeting. Make sure the FastAPI backend is running.');
        setLoading(false);
      });
  }, [router]);

  return (
    <div style={{
      maxWidth: '500px',
      margin: '100px auto',
      padding: '0 24px',
      width: '100%'
    }}>
      <div className="glass-panel" style={{
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {loading && (
          <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.1)',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}} />
            <span style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
              Provisioning meeting room on SQLite...
            </span>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(255, 0, 85, 0.1)',
              border: '1px solid rgba(255, 0, 85, 0.3)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>
              Provisioning Failed
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
              {error}
            </p>
            
            <MeetingActionButton label="Retry" onClick={() => window.location.reload()} />
            <MeetingActionButton label="Back to Dashboard" href="/" variant="secondary" />
          </div>
        )}
      </div>
    </div>
  );
}
