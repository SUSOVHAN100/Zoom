import { useState } from 'react';

interface MeetingControlsProps {
  onLeave: () => void;
  onToggleAudio?: (muted: boolean) => void;
  onToggleVideo?: (cameraOff: boolean) => void;
  onToggleParticipants?: () => void;
  onToggleScreenShare?: (active: boolean) => void;
  showParticipants?: boolean;
  screenSharing?: boolean;
}

export default function MeetingControls({
  onLeave,
  onToggleAudio,
  onToggleVideo,
  onToggleParticipants,
  onToggleScreenShare,
  showParticipants = false,
  screenSharing = false
}: MeetingControlsProps) {
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);

  const handleAudioClick = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (onToggleAudio) onToggleAudio(nextMuted);
  };

  const handleVideoClick = () => {
    const nextCam = !cameraOff;
    setCameraOff(nextCam);
    if (onToggleVideo) onToggleVideo(nextCam);
  };

  const handleScreenShareClick = () => {
    if (onToggleScreenShare) {
      onToggleScreenShare(!screenSharing);
    }
  };

  const controlButtonStyle = (isActive: boolean, isDanger: boolean = false): React.CSSProperties => ({
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isDanger 
      ? 'var(--danger)' 
      : isActive 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(255, 255, 255, 0.05)',
    border: `1px solid ${isDanger ? 'transparent' : 'var(--border-glass)'}`,
    color: '#FFFFFF',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  });

  const buttonHoverEffect = (e: React.MouseEvent<HTMLButtonElement>, isDanger: boolean = false) => {
    e.currentTarget.style.transform = 'scale(1.08)';
    if (!isDanger) {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
    } else {
      e.currentTarget.style.background = '#FF1A66';
    }
  };

  const buttonLeaveEffect = (e: React.MouseEvent<HTMLButtonElement>, isActive: boolean, isDanger: boolean = false) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.background = isDanger 
      ? 'var(--danger)' 
      : isActive 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(255, 255, 255, 0.05)';
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '12px 24px',
      background: 'rgba(18, 22, 34, 0.85)',
      backdropFilter: 'blur(20px)',
      border: '1px solid var(--border-glass)',
      borderRadius: '40px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: 'var(--shadow-glass)',
      zIndex: 10
    }}>
      {/* Audio toggle button */}
      <button
        style={controlButtonStyle(muted)}
        onClick={handleAudioClick}
        onMouseEnter={(e) => buttonHoverEffect(e)}
        onMouseLeave={(e) => buttonLeaveEffect(e, muted)}
        title={muted ? "Unmute Microphone" : "Mute Microphone"}
      >
        {muted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        )}
      </button>

      {/* Video toggle button */}
      <button
        style={controlButtonStyle(cameraOff)}
        onClick={handleVideoClick}
        onMouseEnter={(e) => buttonHoverEffect(e)}
        onMouseLeave={(e) => buttonLeaveEffect(e, cameraOff)}
        title={cameraOff ? "Turn On Camera" : "Turn Off Camera"}
      >
        {cameraOff ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10l-2.5-2"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 7l-7 5 7 5V7z"></path>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        )}
      </button>

      {/* Screen Share button */}
      <button
        style={controlButtonStyle(screenSharing)}
        onClick={handleScreenShareClick}
        onMouseEnter={(e) => buttonHoverEffect(e)}
        onMouseLeave={(e) => buttonLeaveEffect(e, screenSharing)}
        title={screenSharing ? "Stop Sharing Screen" : "Share Screen"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={screenSharing ? "var(--success)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      </button>

      {/* Toggle Participant Panel */}
      {onToggleParticipants && (
        <button
          style={controlButtonStyle(showParticipants)}
          onClick={onToggleParticipants}
          onMouseEnter={(e) => buttonHoverEffect(e)}
          onMouseLeave={(e) => buttonLeaveEffect(e, showParticipants)}
          title="Toggle Participants Panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={showParticipants ? "var(--primary)" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </button>
      )}

      {/* Separator */}
      <div style={{ width: '1px', height: '32px', background: 'var(--border-glass)' }} />

      {/* Leave meeting button */}
      <button
        style={controlButtonStyle(false, true)}
        onClick={onLeave}
        onMouseEnter={(e) => buttonHoverEffect(e, true)}
        onMouseLeave={(e) => buttonLeaveEffect(e, false, true)}
        title="Leave Meeting"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.68 2.22a2 2 0 0 0-2.82 0l-5.64 5.64a2 2 0 0 0 0 2.82l13.43 13.43a2 2 0 0 0 2.82 0l5.64-5.64a2 2 0 0 0 0-2.82L10.68 2.22z"></path>
          <line x1="9.88" y1="14.12" x2="14.12" y2="9.88"></line>
        </svg>
      </button>
    </div>
  );
}
