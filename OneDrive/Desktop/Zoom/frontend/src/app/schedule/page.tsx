'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiService, Meeting } from '../../services/api';
import MeetingActionButton from '../../components/MeetingActionButton';

export default function SchedulePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  
  const [loading, setLoading] = useState(false);
  const [successMeeting, setSuccessMeeting] = useState<Meeting | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please enter a meeting title.');
      return;
    }
    if (!date || !time) {
      setError('Please select a scheduled date and time.');
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError('Please enter a valid positive duration in minutes.');
      return;
    }

    // Check if scheduled time is in the past
    const scheduledDate = new Date(`${date}T${time}`);
    if (isNaN(scheduledDate.getTime())) {
      setError('Please enter a valid date and time values.');
      return;
    }

    if (scheduledDate < new Date()) {
      setError('Scheduled time must be in the future.');
      return;
    }

    setLoading(true);
    try {
      // Send parameters to backend schedule API
      const response = await apiService.scheduleMeeting(
        cleanTitle,
        description.trim() || undefined,
        scheduledDate.toISOString(),
        durationNum
      );
      setSuccessMeeting(response);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to schedule meeting.');
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!successMeeting) return;
    const url = successMeeting.meeting_link?.invite_url || `${window.location.origin}/meeting/${successMeeting.meeting_id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      maxWidth: '600px',
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
        {!successMeeting ? (
          <>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.5px'
              }}>
                Schedule a Meeting
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Fill out the details below to schedule a future conference.
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

            <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Meeting Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="title" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Meeting Title
                </label>
                <input
                  id="title"
                  type="text"
                  placeholder="e.g. Weekly Design Standup"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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

              {/* Description */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="description" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  placeholder="Provide details about the meeting agenda..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    outline: 'none',
                    fontSize: '14px',
                    resize: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
                />
              </div>

              {/* Date & Time Pickers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="date" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label htmlFor="time" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Time
                  </label>
                  <input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
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
              </div>

              {/* Duration */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="duration" style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Duration (Minutes)
                </label>
                <input
                  id="duration"
                  type="number"
                  placeholder="30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={loading}
                  min="1"
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
                label={loading ? "Scheduling..." : "Schedule Meeting"}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </form>
          </>
        ) : (
          /* Success Screen */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 223, 137, 0.15)',
              border: '1px solid rgba(0, 223, 137, 0.3)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700 }}>
                Meeting Scheduled!
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Your meeting "{successMeeting.title}" has been scheduled successfully.
              </p>
            </div>

            {/* Link details box */}
            <div style={{
              width: '100%',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-glass)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'left'
            }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Meeting ID</span>
                <p style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  marginTop: '4px',
                  color: 'var(--primary)'
                }}>
                  {successMeeting.meeting_id}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scheduled Time</span>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 500 }}>
                  {new Date(successMeeting.scheduled_at).toLocaleString()}
                </p>
              </div>
              
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Invite URL</span>
                <p style={{
                  fontSize: '14px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '4px',
                  color: 'var(--text-secondary)'
                }}>
                  {successMeeting.meeting_link?.invite_url || `${window.location.origin}/meeting/${successMeeting.meeting_id}`}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <MeetingActionButton
                label={copied ? "Link Copied!" : "Copy Invitation"}
                onClick={handleCopyLink}
                style={{ flexGrow: 1 }}
              />
              <MeetingActionButton
                label="Go Dashboard"
                href="/"
                variant="secondary"
                style={{ flexGrow: 1 }}
              />
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
