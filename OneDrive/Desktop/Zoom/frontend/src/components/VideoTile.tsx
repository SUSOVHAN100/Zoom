import { useEffect, useRef } from 'react';

interface VideoTileProps {
  participantName: string;
  isLocal?: boolean;
  isHost?: boolean;
  stream?: MediaStream | null;
  muted?: boolean;
  videoOff?: boolean;
}

export default function VideoTile({
  participantName,
  isLocal = false,
  isHost = false,
  stream = null,
  muted = false,
  videoOff = false
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      minHeight: '200px',
      borderRadius: '12px',
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #161c2d 0%, #0d111a 100%)',
      border: '1px solid var(--border-glass)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'var(--shadow-glass)'
    }}>
      {/* Video display */}
      {!videoOff && stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal || muted} // Local participant video element must always be muted to prevent local audio feedback loop
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isLocal ? 'scaleX(-1)' : 'none' // Mirror local video
          }}
        />
      ) : (
        /* Video off/avatar state */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: isLocal 
              ? 'linear-gradient(135deg, #00DFD8 0%, #0070F3 100%)' 
              : 'linear-gradient(135deg, #FF007A 0%, #7928CA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            fontWeight: 700,
            color: '#FFFFFF',
            boxShadow: isLocal ? 'var(--shadow-neon-primary)' : 'var(--shadow-neon-secondary)',
            fontFamily: 'var(--font-display)'
          }}>
            {getInitials(participantName)}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Camera Off</span>
        </div>
      )}

      {/* Participant overlay tags */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        right: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pointerEvents: 'none'
      }}>
        {/* Name tag */}
        <div style={{
          padding: '6px 12px',
          background: 'rgba(9, 11, 17, 0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-main)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{participantName}</span>
          {isLocal && <span style={{ fontSize: '10px', color: 'var(--primary)' }}>(You)</span>}
          {isHost && (
            <span style={{
              fontSize: '9px',
              padding: '2px 4px',
              background: 'rgba(121, 40, 202, 0.2)',
              border: '1px solid rgba(121, 40, 202, 0.4)',
              borderRadius: '4px',
              color: '#D7A3FF',
              fontWeight: 700
            }}>
              HOST
            </span>
          )}
        </div>

        {/* Audio status indicator */}
        {muted && (
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'rgba(255, 0, 85, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 0, 85, 0.4)'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"></line>
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
              <line x1="12" y1="19" x2="12" y2="23"></line>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
