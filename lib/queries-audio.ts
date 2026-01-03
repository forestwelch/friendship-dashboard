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
    // Upload to Supabase Storage
    const fileName = `${friendId}/${Date.now()}.webm`;
    const { error: uploadError } = await supabase.storage
      .from("audio-snippets")
      .upload(fileName, audioBlob, {
        contentType: "audio/webm",
      });

    if (uploadError) {
      console.error("Error uploading audio:", uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("audio-snippets").getPublicUrl(fileName);
    const audioUrl = urlData.publicUrl;

    // Save metadata to database
    const { data, error } = await supabase
      .from("audio_snippets")
      .insert({
        friend_id: friendId,
        audio_url: audioUrl,
        recorded_by: recordedBy,
        icon_name: iconName,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving audio snippet:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in uploadAudioSnippet:", error);
    return null;
  }
}
