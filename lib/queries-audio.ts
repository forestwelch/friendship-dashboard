import { supabase, isSupabaseConfigured } from "./supabase";

export interface AudioSnippet {
  id: string;
  friend_id: string;
  audio_url: string;
  recorded_by: "admin" | "friend";
  icon_name: string;
  created_at: string;
}

export async function getAudioSnippets(friendId: string): Promise<AudioSnippet[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("audio_snippets")
      .select("*")
      .eq("friend_id", friendId)
      .order("created_at", { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}

export async function uploadAudioSnippet(
  friendId: string,
  audioBlob: Blob,
  recordedBy: "admin" | "friend",
  iconName: string
): Promise<AudioSnippet | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // Validate blob
    if (!audioBlob || audioBlob.size === 0) {
      return null;
    }

    // Check blob size (limit to 5MB as per migration notes, supports up to 5 seconds of audio)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (audioBlob.size > maxSize) {
      return null;
    }

    // Use API route to avoid CORS issues with direct storage uploads
    const formData = new FormData();

    // Determine filename extension from blob type
    const getFileExtension = (mimeType: string): string => {
      if (mimeType.includes("webm")) return "webm";
      if (mimeType.includes("ogg")) return "ogg";
      return "webm"; // default
    };

    const extension = getFileExtension(audioBlob.type || "audio/webm");
    formData.append("audio", audioBlob, `recording.${extension}`);
    formData.append("friendId", friendId);
    formData.append("recordedBy", recordedBy);
    formData.append("iconName", iconName);

    const response = await fetch("/api/audio/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      await response.json().catch(() => ({ error: "Unknown error" }));
      return null;
    }

    const responseData = await response.json();
    return responseData.data;
  } catch {
    return null;
  }
}

export async function deleteAudioSnippet(snippetId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const response = await fetch(`/api/audio/${snippetId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      await response.json().catch(() => ({ error: "Unknown error" }));
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
