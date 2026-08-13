import { useEffect, useState } from 'react';
import { apiService, Meeting } from '../services/api';
import MeetingCard from './MeetingCard';

export default function UpcomingMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getUpcomingMeetings()
      .then(data => {
        setMeetings(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load upcoming meetings from SQLite:", err);
        setError(err.message || 'Failed to load upcoming meetings.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        Loading upcoming schedule...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '24px',
        background: 'rgba(255, 0, 85, 0.05)',
        border: '1px solid rgba(255, 0, 85, 0.1)',
        borderRadius: '12px',
        color: '#FF3366',
        fontSize: '14px',
        lineHeight: 1.5
      }}>
        Error: {error}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="glass-panel" style={{
        padding: '48px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>No Upcoming Meetings</span>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: 1.5 }}>
          You don't have any scheduled sessions coming up. Click "Schedule" to set one up.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
      gap: '20px',
      width: '100%'
    }}>
      {meetings.map(meeting => (
        <MeetingCard key={meeting.id} meeting={meeting} />
      ))}
    </div>
  );
}
