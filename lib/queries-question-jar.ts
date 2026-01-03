import { supabase, isSupabaseConfigured } from "./supabase";

export interface QuestionJarEntry {
  id: string;
  friend_id: string;
  question_text: string;
  answer_text: string | null;
  asked_by: "admin" | "friend";
  answered_by: "admin" | "friend" | null;
  asked_at: string;
  answered_at: string | null;
}

export async function getQuestionJarEntries(friendId: string): Promise<QuestionJarEntry[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("question_jar")
      .select("*")
      .eq("friend_id", friendId)
      .order("asked_at", { ascending: false });

    if (error) {
      console.error("Error fetching question jar entries:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getQuestionJarEntries:", error);
    return [];
  }
}

export async function createQuestion(
  friendId: string,
  questionText: string,
  askedBy: "admin" | "friend"
): Promise<QuestionJarEntry | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("question_jar")
      .insert({
        friend_id: friendId,
        question_text: questionText,
        asked_by: askedBy,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating question:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createQuestion:", error);
    return null;
  }
}

export async function answerQuestion(
  questionId: string,
  answerText: string,
  answeredBy: "admin" | "friend"
): Promise<QuestionJarEntry | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("question_jar")
      .update({
        answer_text: answerText,
        answered_by: answeredBy,
        answered_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .select()
      .single();

    if (error) {
      console.error("Error answering question:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in answerQuestion:", error);
    return null;
  }
}
