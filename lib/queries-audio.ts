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
      console.error("Error fetching audio snippets:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getAudioSnippets:", error);
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
      console.error("Invalid audio blob: empty or null");
      return null;
    }

    // Check blob size (limit to 5MB as per migration notes, supports up to 5 seconds of audio)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (audioBlob.size > maxSize) {
      console.error(`Audio blob too large: ${audioBlob.size} bytes (max: ${maxSize})`);
      return null;
    }

    // Use API route to avoid CORS issues with direct storage uploads
    // This works around the 400/CORS error we're seeing
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("friendId", friendId);
    formData.append("recordedBy", recordedBy);
    formData.append("iconName", iconName);

    console.warn("Uploading via API route to avoid CORS issues...");

    const response = await fetch("/api/audio/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("API upload error:", errorData);
      return null;
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Error in uploadAudioSnippet:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
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
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      console.error("API delete error:", errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteAudioSnippet:", error);
    return false;
  }
}
