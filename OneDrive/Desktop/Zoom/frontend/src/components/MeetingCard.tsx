import { useState } from 'react';
import Link from 'next/link';
import { Meeting } from '../services/api';
import MeetingActionButton from './MeetingActionButton';

interface MeetingCardProps {
  meeting: Meeting;
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = meeting.meeting_link?.invite_url || `http://localhost:3000/meeting/${meeting.meeting_id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(meeting.scheduled_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div className="glass-panel" style={{
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: '100%'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: meeting.status === 'live' ? 'var(--success)' : 'var(--text-muted)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '6px'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: meeting.status === 'live' ? 'var(--success)' : 'var(--text-muted)',
              boxShadow: meeting.status === 'live' ? '0 0 8px var(--success)' : 'none'
            }}></span>
            {meeting.status}
          </span>
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--text-main)',
            lineHeight: 1.3
          }}>
            {meeting.title}
          </h3>
        </div>
        
        <div style={{
          padding: '4px 8px',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-glass)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>
          {meeting.duration} min
        </div>
      </div>

      {meeting.description && (
        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          flexGrow: 1
        }}>
          {meeting.description}
        </p>
      )}
      {!meeting.description && <div style={{ flexGrow: 1 }} />}

      <div style={{
        paddingTop: '16px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>Scheduled At:</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formattedDate}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
          <span>Meeting ID:</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontFamily: 'monospace' }}>{meeting.meeting_id}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <MeetingActionButton
          label="Join Room"
          href={`/meeting/${meeting.meeting_id}`}
          style={{ flexGrow: 1 }}
        />
        <MeetingActionButton
          label={copied ? "Copied!" : "Copy Link"}
          variant="secondary"
          onClick={handleCopy}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          }
        />
      </div>
    </div>
  );
}
