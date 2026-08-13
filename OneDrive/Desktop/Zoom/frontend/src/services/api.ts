const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface MeetingLink {
  invite_token: string;
  invite_url: string;
  created_at: string;
}

export interface Meeting {
  id: number;
  meeting_id: string;
  title: string;
  description?: string;
  host_id: number;
  scheduled_at: string;
  duration: number;
  status: string;
  created_at: string;
  meeting_link?: MeetingLink;
}

export interface Participant {
  id: number;
  meeting_id: number;
  display_name: string;
  joined_at: string;
  left_at?: string;
  is_host: boolean;
}

export interface JoinResponse {
  meeting: Meeting;
  participant: Participant;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    let errMsg = "API Request failed";
    try {
      const errBody = await response.json();
      errMsg = errBody.detail || errMsg;
    } catch {
      // ignore parsing error
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

export const apiService = {
  createInstantMeeting: (title?: string, description?: string) =>
    request<Meeting>("/meetings", {
      method: "POST",
      body: JSON.stringify({ title, description }),
    }),

  scheduleMeeting: (title: string, description: string | undefined, scheduledAt: string, duration: number) =>
    request<Meeting>("/meetings/schedule", {
      method: "POST",
      body: JSON.stringify({ title, description, scheduled_at: scheduledAt, duration }),
    }),

  getMeetingDetails: (meetingId: string) =>
    request<Meeting>(`/meetings/${meetingId}`),

  joinMeeting: (meetingIdOrToken: string, displayName: string) =>
    request<JoinResponse>("/meetings/join", {
      method: "POST",
      body: JSON.stringify({ meeting_id_or_token: meetingIdOrToken, display_name: displayName }),
    }),

  getUpcomingMeetings: () =>
    request<Meeting[]>("/meetings/upcoming"),

  getRecentMeetings: () =>
    request<Meeting[]>("/meetings/recent"),

  addParticipant: (meetingId: string, displayName: string) =>
    request<Participant>(`/meetings/${meetingId}/participants`, {
      method: "POST",
      body: JSON.stringify({ display_name: displayName }),
    }),

  getActiveParticipants: (meetingId: string) =>
    request<Participant[]>(`/meetings/${meetingId}/participants`),

  removeParticipant: (participantId: number) =>
    request<Participant>(`/participants/${participantId}`, {
      method: "DELETE",
    }),
};
