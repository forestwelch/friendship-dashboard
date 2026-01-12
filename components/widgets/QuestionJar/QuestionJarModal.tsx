"use client";

import React, { useState } from "react";
import { Modal } from "@/components/shared";
import { useUIStore } from "@/lib/store/ui-store";
import { useQuestionJarEntries, useCreateQuestion, useAnswerQuestion } from "./queries";
import { useIdentity } from "@/lib/identity-utils";
import { FormField, Textarea } from "@/components/shared";
import { formatDateCompact } from "@/lib/date-utils";
import { getUserColorVar } from "@/lib/color-utils";
import styles from "./QuestionJarModal.module.css";

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

  // Get initials for display
  const friendInitial = friendName.charAt(0).toUpperCase();
  const forestInitial = "F"; // Forest's initial

  return (
    <Modal id={modalId} title="Question Jar" onClose={() => setOpenModal(null)}>
      <div className="modal-content">
        {/* Answer Section */}
        {unansweredQuestion && unansweredQuestion.asked_by !== identity && (
          <div className={styles.formFullWidth}>
            <div className={`form-title-small ${styles.formTitleCentered}`}>
              {unansweredQuestion.question_text}
            </div>
            <form onSubmit={handleAnswerSubmit} className={`form ${styles.formFullWidth}`}>
              <FormField label="" required={false}>
                <Textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Your answer..."
                  rows={4}
                  required
                  className={styles.formFieldFullWidth}
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
          <div className={styles.formFullWidth}>
            <div className="form-title">Ask Next Question:</div>
            <form onSubmit={handleQuestionSubmit} className={`form ${styles.formFullWidth}`}>
              <FormField label="Your question" required>
                <Textarea
                  value={nextQuestionText}
                  onChange={(e) => setNextQuestionText(e.target.value)}
                  placeholder="Your question..."
                  rows={4}
                  required
                  className={styles.formFieldFullWidth}
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
        {entries.filter((e) => e.answer_text).length > 0 && (
          <div className="entries-list">
            <div className="form-title">Archive:</div>
            {entries
              .filter((e) => e.answer_text)
              .map((entry) => {
                const askerInitial = entry.asked_by === "admin" ? forestInitial : friendInitial;
                const answererInitial =
                  entry.answered_by === "admin" ? forestInitial : friendInitial;

                return (
                  <div key={entry.id} className="entry">
                    <div
                      className="entry-title"
                      style={{ color: getUserColorVar(entry.asked_by || "admin", friendId) }}
                    >
                      {askerInitial}: {entry.question_text}
                    </div>
                    <div
                      className="entry-content"
                      style={{ color: getUserColorVar(entry.answered_by || "admin", friendId) }}
                    >
                      {answererInitial}: {entry.answer_text}
                    </div>
                    <div className="entry-meta">
                      {formatDateCompact(entry.answered_at || entry.asked_at)}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </Modal>
  );
}
