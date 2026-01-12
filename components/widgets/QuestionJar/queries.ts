import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { playSound } from "@/lib/sounds";

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

export function useQuestionJarEntries(friendId: string) {
  return useQuery({
    queryKey: ["question_jar_entries", friendId],
    queryFn: () => getQuestionJarEntries(friendId),
  });
}

export function useCreateQuestion(friendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionText,
      askedBy,
    }: {
      questionText: string;
      askedBy: "admin" | "friend";
    }) => {
      return createQuestion(friendId, questionText, askedBy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question_jar_entries", friendId] });
      playSound("success");
    },
    onError: () => {
      playSound("error");
    },
  });
}

export function useAnswerQuestion(friendId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      answerText,
      answeredBy,
    }: {
      questionId: string;
      answerText: string;
      answeredBy: "admin" | "friend";
    }) => {
      return answerQuestion(questionId, answerText, answeredBy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["question_jar_entries", friendId] });
      playSound("success");
    },
    onError: () => {
      playSound("error");
    },
  });
}
