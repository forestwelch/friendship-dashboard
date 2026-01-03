import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQuestionJarEntries, createQuestion, answerQuestion } from "./queries-question-jar";
import { playSound } from "./sounds";

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
