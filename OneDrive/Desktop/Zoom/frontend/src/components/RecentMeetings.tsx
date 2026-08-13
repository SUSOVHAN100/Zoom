import { useEffect, useState } from 'react';
import { apiService, Meeting } from '../services/api';
import MeetingCard from './MeetingCard';

export default function RecentMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiService.getRecentMeetings()
      .then(data => {
        setMeetings(data);
        setError(null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load recent meetings from SQLite:", err);
        setError(err.message || 'Failed to load recent meetings.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
        Loading past meeting logs...
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
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-secondary)' }}>No Recent Meetings</span>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: 1.5 }}>
          You have no recorded past meetings. Instant meetings you host will show up here.
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
