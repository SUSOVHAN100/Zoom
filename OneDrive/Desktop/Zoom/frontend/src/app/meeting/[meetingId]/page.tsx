'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiService, Meeting, Participant } from '../../../services/api';
import { useWebRTC } from '../../../hooks/useWebRTC';
import MeetingControls from '../../../components/MeetingControls';
import VideoTile from '../../../components/VideoTile';
import MeetingActionButton from '../../../components/MeetingActionButton';

interface MeetingRoomProps {
  params: Promise<{ meetingId: string }> | { meetingId: string };
}

export default function MeetingRoomPage({ params }: MeetingRoomProps) {
  const router = useRouter();
  
  // Safe resolution of params for compatibility with Next.js 14 & 15+
  const resolvedParams = 'then' in params ? React.use(params as Promise<{ meetingId: string }>) : params;
  const meetingId = resolvedParams.meetingId;

  // Local state
  const [displayName, setDisplayName] = useState('');
  const [joined, setJoined] = useState(false);
  const [participantId, setParticipantId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const url = meeting?.meeting_link?.invite_url || `${window.location.origin}/meeting/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<Participant[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showParticipantsList, setShowParticipantsList] = useState(true);

  // Audio/Video controls state
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  // Initialize WebRTC signaling and media connections
  const { 
    localStream, 
    remotePeers, 
    error: rtcError, 
    isScreenSharing, 
    startScreenShare, 
    stopScreenShare, 
    muteAllRemotePeers,
    cleanupAll 
  } = useWebRTC(
    meetingId,
    joined && participantId ? participantId.toString() : '',
    joined ? displayName : ''
  );

  // Handle host muting signal
  useEffect(() => {
    const handleHostMute = () => {
      handleToggleAudio(true);
    };
    window.addEventListener('host-muted-us', handleHostMute);
    return () => window.removeEventListener('host-muted-us', handleHostMute);
  }, [localStream]);

  // Poll participant list periodically
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Check sessionStorage on mount
  useEffect(() => {
    const storedName = sessionStorage.getItem('display_name');
    const storedPartId = sessionStorage.getItem('participant_id');

    // 1. Fetch meeting details to verify room existence
    apiService.getMeetingDetails(meetingId)
      .then(meetingData => {
        setMeeting(meetingData);
        
        if (storedName && storedPartId) {
          setDisplayName(storedName);
          setParticipantId(parseInt(storedPartId, 10));
          setJoined(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message || 'Meeting not found or database connection failed.');
        setLoading(false);
      });

    return () => {
      cleanupAll();
      stopPolling();
    };
  }, [meetingId]);

  // Start polling participant list when joined
  useEffect(() => {
    if (joined && meetingId) {
      fetchParticipants();
      pollingRef.current = setInterval(fetchParticipants, 3000); // Poll every 3 seconds
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [joined, meetingId]);

  const fetchParticipants = () => {
    apiService.getActiveParticipants(meetingId)
      .then(list => {
        // Verify if we have been removed by the host
        if (joined && participantId) {
          const isStillActive = list.some(p => p.id === participantId);
          if (!isStillActive) {
            console.warn("Participant has been removed by the host.");
            alert("You have been removed from the meeting by the host.");
            handleLeave();
            return;
          }
        }

        // Filter out our own local participant to display others separately
        const others = list.filter(p => p.id !== participantId);
        setActiveParticipants(others);
      })
      .catch(err => console.error('Failed to poll participants:', err));
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const handleJoinFromOverlay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanName = displayName.trim();
    if (!cleanName) {
      setError('Please enter a display name to join.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiService.joinMeeting(meetingId, cleanName);
      
      sessionStorage.setItem('display_name', cleanName);
      sessionStorage.setItem('participant_id', response.participant.id.toString());
      
      setParticipantId(response.participant.id);
      setJoined(true);
      setSubmitting(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to join meeting room.');
      setSubmitting(false);
    }
  };

  const handleLeave = async () => {
    cleanupAll();
    stopPolling();
    
    if (participantId) {
      try {
        // Deregister active participant row in database
        await apiService.removeParticipant(participantId);
      } catch (err) {
        console.error('Error leaving meeting database:', err);
      }
    }
    
    sessionStorage.removeItem('display_name');
    sessionStorage.removeItem('participant_id');
    
    router.push('/');
  };

  const handleToggleAudio = (muted: boolean) => {
    setAudioMuted(muted);
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !muted);
    }
  };

  const handleToggleVideo = (cameraOff: boolean) => {
    setVideoOff(cameraOff);
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !cameraOff);
    }
  };

  const handleToggleScreenShare = (active: boolean) => {
    if (active) {
      startScreenShare();
    } else {
      stopScreenShare();
    }
  };

  if (loading) {
    return (
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
        Loading meeting space...
      </div>
    );
  }

  if (error && !joined) {
    return (
      <div style={{ maxWidth: '500px', margin: '100px auto', padding: '0 24px', width: '100%' }}>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>
            Error Entering Room
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            {error}
          </p>
          <MeetingActionButton label="Back to Join Meeting" href="/join" />
          <MeetingActionButton label="Back to Dashboard" href="/" variant="secondary" />
        </div>
      </div>
    );
  }

  // Pre-join entry overlay if name is not set
  if (!joined) {
    return (
      <div style={{ maxWidth: '500px', margin: '80px auto', padding: '0 24px', width: '100%' }}>
        <div className="glass-panel" style={{
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px' }}>
              Entry Lobby
            </span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700 }}>
              {meeting?.title || "Join Meeting Room"}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Enter your display name to join this conference.
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255, 0, 85, 0.05)',
              border: '1px solid rgba(255, 0, 85, 0.1)',
              borderRadius: '8px',
              color: '#FF3366',
              fontSize: '13px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleJoinFromOverlay} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label htmlFor="lobbyName" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Your Display Name
              </label>
              <input
                id="lobbyName"
                type="text"
                placeholder="e.g. Sarah Connor"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={submitting}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  outline: 'none',
                  fontSize: '14px'
                }}
              />
            </div>
            <MeetingActionButton
              label={submitting ? "Joining Room..." : "Enter Meeting Room"}
              style={{ width: '100%', marginTop: '8px' }}
            />
          </form>

          <div style={{ textAlign: 'center' }}>
            <Link href="/" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'underline' }}>
              Cancel & Exit
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active meeting room interface
  return (
    <div style={{
      flexGrow: 1,
      display: 'flex',
      height: 'calc(100vh - 65px)', /* Subtract Navbar height */
      background: '#090B11',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Video Grid Section */}
      <div style={{
        flexGrow: 1,
        padding: '24px',
        paddingBottom: '96px', /* Buffer for meeting controls */
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Header containing meeting title and participants toggle button */}
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '24px',
          right: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 5
        }}>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(18, 22, 34, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-glass)',
            borderRadius: '10px',
            pointerEvents: 'auto'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF' }}>{meeting?.title}</h2>
          </div>
        </div>

        {/* Video Tile Grid layout */}
        <div style={{
          width: '100%',
          height: '100%',
          maxHeight: '600px',
          maxWidth: '1000px',
          display: 'grid',
          // Adapt column layouts dynamically based on WebRTC connected peer count
          gridTemplateColumns: remotePeers.length === 0 ? '1fr' : remotePeers.length === 1 ? '1fr 1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Local participant video */}
          <VideoTile
            participantName={displayName}
            isLocal={true}
            stream={localStream}
            muted={audioMuted}
            videoOff={videoOff}
          />

          {/* Remote WebRTC signaling active participants */}
          {remotePeers.map(peer => (
            <VideoTile
              key={peer.id}
              participantName={peer.name}
              isLocal={false}
              stream={peer.stream}
              videoOff={!peer.stream || peer.stream.getVideoTracks().filter(t => t.enabled).length === 0}
              muted={false}
            />
          ))}
        </div>

        {/* Controls footer */}
        <MeetingControls
          onLeave={handleLeave}
          onToggleAudio={handleToggleAudio}
          onToggleVideo={handleToggleVideo}
          onToggleParticipants={() => setShowParticipantsList(!showParticipantsList)}
          showParticipants={showParticipantsList}
          screenSharing={isScreenSharing}
          onToggleScreenShare={handleToggleScreenShare}
        />
      </div>

      {/* Participants sidebar list */}
      {showParticipantsList && (
        <aside style={{
          width: '320px',
          borderLeft: '1px solid var(--border-glass)',
          background: '#0D111A',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 5
        }}>
          {/* Invite details panel */}
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700, letterSpacing: '1px' }}>INVITE INFO</span>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Meeting ID</span>
              <p style={{ fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-main)', marginTop: '2px', fontWeight: 600 }}>{meetingId}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Invite Link</span>
              <p style={{ 
                fontSize: '12px', 
                color: 'var(--text-secondary)', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                marginTop: '2px' 
              }}>
                {meeting?.meeting_link?.invite_url || `${window.location.origin}/meeting/${meetingId}`}
              </p>
            </div>
            <button 
              className="btn-action btn-action-secondary"
              style={{ padding: '8px 12px', fontSize: '12px', marginTop: '4px', width: '100%', borderRadius: '6px' }}
              onClick={handleCopyLink}
            >
              {copied ? "Link Copied!" : "Copy Invite Link"}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
              Participants ({activeParticipants.length + 1})
            </h3>
            {displayName === 'Default User' && activeParticipants.length > 0 && (
              <button
                className="btn-action"
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  background: 'rgba(255, 0, 85, 0.1)',
                  border: '1px solid rgba(255, 0, 85, 0.2)',
                  color: '#FF3366'
                }}
                onClick={muteAllRemotePeers}
              >
                Mute All
              </button>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            flexGrow: 1
          }}>
            {/* Local Client */}
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(0, 112, 243, 0.08)',
              border: '1px solid rgba(0, 112, 243, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                {displayName} <span style={{ color: 'var(--primary)', fontSize: '11px' }}>(You)</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{audioMuted ? "Muted" : "Active"}</span>
            </div>

            {/* Remote Clients */}
            {activeParticipants.map(p => (
              <div key={p.id} style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.display_name}
                    {p.is_host && <span style={{ fontSize: '9px', marginLeft: '6px', background: 'rgba(121,40,202,0.1)', color: '#d7a3ff', padding: '2px 4px', borderRadius: '4px' }}>Host</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {displayName === 'Default User' && (
                    <button
                      style={{
                        background: 'rgba(255, 0, 85, 0.05)',
                        border: '1px solid rgba(255, 0, 85, 0.1)',
                        borderRadius: '4px',
                        color: '#FF3366',
                        fontSize: '10px',
                        padding: '3px 6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onClick={async () => {
                        if (confirm(`Remove ${p.display_name} from the meeting?`)) {
                          try {
                            await apiService.removeParticipant(p.id);
                          } catch (err) {
                            console.error("Failed to remove participant:", err);
                          }
                        }
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
      )}
    </div>
  );
}
