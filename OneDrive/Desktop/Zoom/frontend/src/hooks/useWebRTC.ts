import { useEffect, useRef, useState } from 'react';

export interface RemotePeer {
  id: string;
  name: string;
  stream: MediaStream | null;
}

export function useWebRTC(meetingId: string, clientId: string, displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerNamesRef = useRef<Map<string, string>>(new Map());

  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Request access to user camera and microphone
  const startLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      return stream;
    } catch (err: any) {
      console.error("Failed to access camera/microphone:", err);
      let errMsg = "Media access denied. Please grant camera and microphone permissions.";
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errMsg = "Camera or microphone device not found.";
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errMsg = "Camera or microphone is already in use by another application.";
      }
      setError(errMsg);
      throw err;
    }
  };

  useEffect(() => {
    if (!clientId || !displayName) return;
    let active = true;

    const init = async () => {
      let stream: MediaStream;
      try {
        stream = await startLocalMedia();
      } catch {
        return; // Stopped by permission error
      }

      if (!active) return;

      // Connect to FastAPI WebSocket signaling server
      // Use NEXT_PUBLIC_WS_URL in production (e.g. wss://zoomspace-backend.onrender.com)
      // Fall back to the current browser host in dev (localhost:8000)
      const wsBase = process.env.NEXT_PUBLIC_WS_URL ||
        `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000`;
      const wsUrl = `${wsBase}/ws/${meetingId}?client_id=${clientId}`;
      console.log(`Connecting to signaling WebSocket: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Signaling WebSocket connected successfully.");
        // Broadcast join signal containing our display name to the room
        ws.send(JSON.stringify({
          type: "join",
          name: displayName
        }));
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        const { type, sender_id, target_id, payload, name } = data;

        // Skip if message has a specific target that isn't us
        if (target_id && target_id !== clientId) return;

        switch (type) {
          case 'join':
            console.log(`Peer join notification received for client: ${sender_id}`);
            if (name) {
              peerNamesRef.current.set(sender_id, name);
            }
            // Create a peer connection for this new client (we initiate the connection)
            await getOrCreatePeerConnection(sender_id, stream, true);
            break;

          case 'offer':
            console.log(`SDP Offer received from peer: ${sender_id}`);
            if (name) {
              peerNamesRef.current.set(sender_id, name);
            }
            const pcOffer = await getOrCreatePeerConnection(sender_id, stream, false);
            await pcOffer.setRemoteDescription(new RTCSessionDescription(payload));
            const answer = await pcOffer.createAnswer();
            await pcOffer.setLocalDescription(answer);
            
            // Send answer back to peer
            ws.send(JSON.stringify({
              type: "answer",
              target_id: sender_id,
              payload: answer
            }));
            break;

          case 'answer':
            console.log(`SDP Answer received from peer: ${sender_id}`);
            const pcAnswer = peersRef.current.get(sender_id);
            if (pcAnswer) {
              await pcAnswer.setRemoteDescription(new RTCSessionDescription(payload));
            }
            break;

          case 'ice_candidate':
            console.log(`ICE Candidate received from peer: ${sender_id}`);
            const pcIce = peersRef.current.get(sender_id);
            if (pcIce) {
              try {
                await pcIce.addIceCandidate(new RTCIceCandidate(payload));
              } catch (e) {
                console.error("Error adding remote ICE candidate:", e);
              }
            }
            break;

          case 'mute_all':
            console.log("Mute all signal received from host.");
            window.dispatchEvent(new CustomEvent('host-muted-us'));
            break;

          case 'leave':
            console.log(`Peer leave notification received for client: ${sender_id}`);
            cleanupPeer(sender_id);
            break;
        }
      };

      ws.onerror = (err) => {
        console.error("Signaling WebSocket connection error:", err);
      };

      ws.onclose = () => {
        console.log("Signaling WebSocket disconnected.");
      };
    };

    init();

    return () => {
      active = false;
      cleanupAll();
    };
  }, [meetingId, clientId, displayName]);

  // Create or retrieve connection for a specific peer
  const getOrCreatePeerConnection = async (
    peerId: string, 
    stream: MediaStream,
    isInitiator: boolean
  ): Promise<RTCPeerConnection> => {
    let pc = peersRef.current.get(peerId);
    if (pc) return pc;

    console.log(`Creating RTCPeerConnection for peer '${peerId}' (Initiator: ${isInitiator}).`);
    pc = new RTCPeerConnection(rtcConfig);
    peersRef.current.set(peerId, pc);

    // Add local tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "ice_candidate",
          target_id: peerId,
          payload: event.candidate
        }));
      }
    };

    // Handle remote media track reception
    pc.ontrack = (event) => {
      console.log(`Received remote track from peer '${peerId}'.`);
      const remoteStream = event.streams[0] || null;
      
      setRemotePeers(prev => {
        const filtered = prev.filter(p => p.id !== peerId);
        return [
          ...filtered,
          {
            id: peerId,
            name: peerNamesRef.current.get(peerId) || `Participant ${peerId.substring(0, 4)}`,
            stream: remoteStream
          }
        ];
      });
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state with '${peerId}': ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(peerId);
      }
    };

    // If initiating, create and dispatch offer
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "offer",
          target_id: peerId,
          payload: offer
        }));
      }
    }

    return pc;
  };

  const cleanupPeer = (peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (pc) {
      pc.close();
      peersRef.current.delete(peerId);
    }
    peerNamesRef.current.delete(peerId);
    setRemotePeers(prev => prev.filter(p => p.id !== peerId));
  };

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const startScreenShare = async () => {
    try {
      console.log("Acquiring display capture stream...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      screenStreamRef.current = screenStream;
      const screenTrack = screenStream.getVideoTracks()[0];

      // Restore camera when user stops sharing via native browser dialog UI
      screenTrack.onended = () => {
        stopScreenShare();
      };

      // Replace camera video track with screen video track on all active connections
      for (const [peerId, pc] of peersRef.current.entries()) {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        }
      }

      // Update local stream preview display
      if (localStreamRef.current) {
        const cameraTrack = localStreamRef.current.getVideoTracks()[0];
        if (cameraTrack) {
          localStreamRef.current.removeTrack(cameraTrack);
        }
        localStreamRef.current.addTrack(screenTrack);
        // Dispatch new stream reference to trigger React hook re-renders
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }

      setIsScreenSharing(true);
    } catch (err) {
      console.warn("Screen sharing dialog cancelled or failed:", err);
    }
  };

  const stopScreenShare = async () => {
    if (!screenStreamRef.current) return;

    console.log("Restoring camera track after screen sharing ended...");
    screenStreamRef.current.getTracks().forEach(track => track.stop());
    screenStreamRef.current = null;

    try {
      // Re-acquire local camera stream
      const newCameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newCameraTrack = newCameraStream.getVideoTracks()[0];

      // Replace screen video track back to camera video track on all peer connections
      for (const [peerId, pc] of peersRef.current.entries()) {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        if (videoSender) {
          await videoSender.replaceTrack(newCameraTrack);
        }
      }

      // Restore local stream preview display
      if (localStreamRef.current) {
        const screenTrack = localStreamRef.current.getVideoTracks()[0];
        if (screenTrack) {
          localStreamRef.current.removeTrack(screenTrack);
        }
        localStreamRef.current.addTrack(newCameraTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
    } catch (err) {
      console.error("Failed to restore camera stream:", err);
    }

    setIsScreenSharing(false);
  };

  const cleanupAll = () => {
    console.log("Cleaning up all WebRTC media streams and WebSocket signals.");
    
    // Send leave signal and close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "leave" }));
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    // Close all active peer connections
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current.clear();

    // Stop active screen capture streams
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }

    // Terminate local hardware camera/microphone streams
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    setLocalStream(null);
    setRemotePeers([]);
    peerNamesRef.current.clear();
  };

  const muteAllRemotePeers = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("Host dispatching Mute All signal to room.");
      wsRef.current.send(JSON.stringify({
        type: "mute_all"
      }));
    }
  };

  return {
    localStream,
    remotePeers,
    error,
    isScreenSharing,
    startScreenShare,
    stopScreenShare,
    muteAllRemotePeers,
    cleanupAll
  };
}
