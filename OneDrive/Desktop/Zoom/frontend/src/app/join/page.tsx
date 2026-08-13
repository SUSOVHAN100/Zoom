'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService } from '../../services/api';
import MeetingActionButton from '../../components/MeetingActionButton';

export default function JoinPage() {
  const router = useRouter();
  const [meetingIdOrToken, setMeetingIdOrToken] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractMeetingIdOrToken = (input: string): string => {
    const trimmed = input.trim();
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const match = url.pathname.match(/\/meeting\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          return match[1];
        }
        const token = url.searchParams.get('token');
        if (token) return token;
      }
    } catch (e) {
      // Ignore URL parsing errors and fallback
    }
    const pathMatch = trimmed.match(/\/meeting\/([a-zA-Z0-9-]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }
    return trimmed;
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = extractMeetingIdOrToken(meetingIdOrToken);
    const cleanName = displayName.trim();

    if (!cleanId) {
      setError('Please enter a Meeting ID or Invite URL.');
      return;
    }
    if (!cleanName) {
      setError('Please enter your display name.');
      return;
    }

    setLoading(true);
    try {
      // Connect to backend API to validate meeting and create participant row
      const response = await apiService.joinMeeting(cleanId, cleanName);
      
      // Store participant's display name and participant_id in sessionStorage
      // to let the meeting room know their identity and local database row
      sessionStorage.setItem('display_name', cleanName);
      sessionStorage.setItem('participant_id', response.participant.id.toString());
      
      // Redirect to the meeting room route
      router.push(`/meeting/${response.meeting.meeting_id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Unable to join meeting. Please verify the ID/token.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '60px auto',
      padding: '0 24px',
      width: '100%'
    }}>
      <div className="glass-panel" style={{
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.5px'
          }}>
            Join a Meeting
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Enter your details below to connect to the video call.
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: 'rgba(255, 0, 85, 0.05)',
            border: '1px solid rgba(255, 0, 85, 0.1)',
            borderRadius: '8px',
            color: '#FF3366',
            fontSize: '13px',
            lineHeight: 1.5
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Meeting ID/Token input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="meetingId" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Meeting ID or Invite Link URL
            </label>
            <input
              id="meetingId"
              type="text"
              placeholder="e.g. abc-defg-hij or paste complete link"
              value={meetingIdOrToken}
              onChange={(e) => setMeetingIdOrToken(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                color: '#FFFFFF',
                outline: 'none',
                fontSize: '14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
            />
          </div>

          {/* Display Name Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="displayName" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Your Display Name
            </label>
            <input
              id="displayName"
              type="text"
              placeholder="e.g. Alice Smith"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                color: '#FFFFFF',
                outline: 'none',
                fontSize: '14px',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
            />
          </div>

          <MeetingActionButton
            label={loading ? "Connecting..." : "Join Meeting Room"}
            style={{ width: '100%', marginTop: '8px' }}
          />
        </form>

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
