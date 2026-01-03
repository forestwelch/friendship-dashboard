"use client";

import React, { useState } from "react";
import { Modal } from "@/components/Modal";
import { useUIStore } from "@/lib/store/ui-store";
import {
  useQuestionJarEntries,
  useCreateQuestion,
  useAnswerQuestion,
} from "@/lib/queries-question-jar-hooks";
import { useIdentity } from "@/lib/identity-utils";
import { FormField, Textarea } from "@/components/shared";

interface QuestionJarModalProps {
  friendId: string;
  friendName: string;
}

export function QuestionJarModal({ friendId, friendName }: QuestionJarModalProps) {
  const { setOpenModal } = useUIStore();
  const [answerText, setAnswerText] = useState("");
  const [nextQuestionText, setNextQuestionText] = useState("");
  const identity = useIdentity();
  const modalId = `questionjar-${friendId}`;

  const { data: entries = [] } = useQuestionJarEntries(friendId);
  const createQuestionMutation = useCreateQuestion(friendId);
  const answerQuestionMutation = useAnswerQuestion(friendId);

  const unansweredQuestion = entries.find((entry) => !entry.answer_text);

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerText.trim() || !unansweredQuestion || answerQuestionMutation.isPending) return;

    answerQuestionMutation.mutate(
      {
        questionId: unansweredQuestion.id,
        answerText: answerText.trim(),
        answeredBy: identity,
      },
      {
        onSuccess: () => {
          setAnswerText("");
        },
      }
    );
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextQuestionText.trim() || createQuestionMutation.isPending) return;

    createQuestionMutation.mutate(
      {
        questionText: nextQuestionText.trim(),
        askedBy: identity,
      },
      {
        onSuccess: () => {
          setNextQuestionText("");
        },
      }
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Modal id={modalId} title="Question Jar" onClose={() => setOpenModal(null)}>
      <div className="modal-content">
        {/* Answer Section */}
        {unansweredQuestion && unansweredQuestion.asked_by !== identity && (
          <div className="form-section">
            <div className="form-title">Question:</div>
            <div className="form-title-small">{unansweredQuestion.question_text}</div>
            <form onSubmit={handleAnswerSubmit} className="form">
              <FormField label="Your answer" required>
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Your answer..."
                  rows={4}
                  required
                />
              </FormField>
              <button
                type="submit"
                className="game-button game-button-primary"
                disabled={answerQuestionMutation.isPending || !answerText.trim()}
              >
                {answerQuestionMutation.isPending ? "Submitting..." : "Submit Answer"}
              </button>
            </form>
          </div>
        )}

        {/* Ask Next Question Section */}
        {(!unansweredQuestion ||
          (unansweredQuestion.asked_by === identity && unansweredQuestion.answer_text)) && (
          <div className="form-section form-section-accent">
            <div className="form-title">Ask Next Question:</div>
            <form onSubmit={handleQuestionSubmit} className="form">
              <FormField label="Your question" required>
                <Textarea
                  value={nextQuestionText}
                  onChange={(e) => setNextQuestionText(e.target.value)}
                  placeholder="Your question..."
                  rows={4}
                  required
                />
              </FormField>
              <button
                type="submit"
                className="game-button game-button-primary"
                disabled={createQuestionMutation.isPending || !nextQuestionText.trim()}
              >
                {createQuestionMutation.isPending ? "Submitting..." : "Ask Question"}
              </button>
            </form>
          </div>
        )}

        {/* Archive Section */}
        <div className="entries-list">
          <div className="form-title">Archive:</div>
          {entries.filter((e) => e.answer_text).length === 0 ? (
            <div className="empty-state">No Q&As yet. Start the conversation!</div>
          ) : (
            entries
              .filter((e) => e.answer_text)
              .map((entry) => (
                <div key={entry.id} className="entry">
                  <div className="entry-title">Q: {entry.question_text}</div>
                  <div className="entry-content">A: {entry.answer_text}</div>
                  <div className="entry-meta">
                    Asked by {entry.asked_by === "admin" ? "Forest" : friendName} • Answered by{" "}
                    {entry.answered_by === "admin" ? "Forest" : friendName} •{" "}
                    {formatDate(entry.answered_at || entry.asked_at)}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </Modal>
  );
}
