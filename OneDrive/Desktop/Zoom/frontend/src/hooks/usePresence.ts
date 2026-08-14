import { useEffect, useState, useRef } from 'react';
import { apiService, UserStats } from '../services/api';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function usePresence() {
  const [stats, setStats] = useState<UserStats>({
    total_users: 1,
    online_users: 1,
    in_meeting_users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>('');

  useEffect(() => {
    // Generate or reuse client_id for this tab connection
    if (!clientIdRef.current) {
      clientIdRef.current = `client_${Math.random().toString(36).substring(2, 9)}`;
    }

    const userId = typeof window !== 'undefined' ? sessionStorage.getItem('user_id') || 'guest' : 'guest';
    const wsUrl = `${WS_BASE}/ws/presence?client_id=${clientIdRef.current}&user_id=${userId}`;

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        // Send initial ping to keep-alive
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send("ping");
        }
      };

      socket.onerror = (err) => {
        console.warn("Presence WebSocket error:", err);
      };
    } catch (e) {
      console.warn("Could not establish presence WebSocket:", e);
    }

    // Fetch initial stats & poll every 3 seconds
    const fetchStats = () => {
      apiService.getUserStats()
        .then(data => {
          setStats(data);
          setError(null);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch user stats:", err);
          setError(err.message || "Failed to fetch presence stats");
          setLoading(false);
        });
    };

    fetchStats();
    const interval = setInterval(fetchStats, 3000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return { stats, loading, error };
}
