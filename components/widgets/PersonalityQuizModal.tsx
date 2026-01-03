"use client";

import { useState, useEffect, useCallback } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { QUIZ_QUESTIONS, calculateResult, calculateCompatibility } from "@/lib/quiz-questions";
import { usePersonalityQuizWidget, useSubmitQuizAnswers } from "@/lib/queries-quiz";
import styles from "./PersonalityQuizModal.module.css";

// Helper function to convert emoji strings to icon class names
function getIconForEmoji(emoji: string): string {
  const emojiToIcon: Record<string, string> = {
    "☀️": "hn-sun-solid",
    "🌙": "hn-moon-solid",
    "⭐": "hn-star-solid",
    "🌑": "hn-moon-solid",
    "🌞": "hn-sun-solid",
    "🌠": "hn-star-solid",
    "🌈": "hn-bolt-solid", // palette-solid not available, using bolt for rainbow/colorful
    "✨": "hn-star-solid",
  };
  return emojiToIcon[emoji] || "hn-star-solid";
}

interface QuizResultData {
  emoji: string;
  title: string;
  description: string;
  answers: string[];
  completed_at: string;
}

interface PersonalityQuizData {
  your_result?: QuizResultData;
  their_result?: QuizResultData;
  compatibility_note?: string;
}

interface PersonalityQuizModalProps {
  friendId: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: PersonalityQuizData;
}

export function PersonalityQuizModal({
  friendId,
  widgetId,
  themeColors: _themeColors,
  config,
}: PersonalityQuizModalProps) {
  const { openModal, setOpenModal } = useUIStore();
  const modalId = `quiz-${widgetId}`;
  const isOpen = openModal === modalId;

  const { data: quizData } = usePersonalityQuizWidget(friendId, widgetId);
  const submitQuizMutation = useSubmitQuizAnswers(friendId, widgetId);

  const yourResult = quizData?.your_result || config?.your_result;
  const theirResult = quizData?.their_result || config?.their_result;
  const compatibilityNote = quizData?.compatibility_note || config?.compatibility_note;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [focusedOption, setFocusedOption] = useState(0);

  // Reset quiz state when modal opens
  useEffect(() => {
    if (isOpen && !yourResult) {
      // Defer to avoid sync setState
      setTimeout(() => {
        setCurrentQuestion(0);
        setAnswers([]);
        setFocusedOption(0);
      }, 0);
    }
  }, [isOpen, yourResult]);

  const handleAnswer = useCallback(
    (answer: "a" | "b" | "c") => {
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);
      playSound("quiz_advance");

      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setFocusedOption(0);
      } else {
        // Quiz complete - calculate result
        const result = calculateResult(newAnswers);
        const theirResultData = theirResult
          ? {
              emoji: theirResult.emoji,
              title: theirResult.title,
              description: theirResult.description,
            }
          : null;
        const compatibility = theirResultData
          ? calculateCompatibility(result, theirResultData)
          : undefined;

        submitQuizMutation.mutate({
          your_result: {
            ...result,
            answers: newAnswers,
            completed_at: new Date().toISOString(),
          },
          compatibility_note: compatibility,
        });

        playSound("quiz_results");
      }
    },
    [answers, currentQuestion, theirResult, submitQuizMutation]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || yourResult) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setFocusedOption((prev) => Math.min(prev + 1, 2));
        playSound("navigate");
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setFocusedOption((prev) => Math.max(prev - 1, 0));
        playSound("navigate");
      } else if (e.key === "Enter") {
        e.preventDefault();
        const option = ["a", "b", "c"][focusedOption] as "a" | "b" | "c";
        handleAnswer(option);
      } else if (e.key === "Escape") {
        setOpenModal(null);
        playSound("close");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, yourResult, focusedOption, handleAnswer, setOpenModal]);

  const handleRetake = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setFocusedOption(0);
    playSound("retake");
    // Note: Quiz result clearing would require a mutation if needed
  };

  // Quiz mode
  if (!yourResult) {
    const question = QUIZ_QUESTIONS[currentQuestion];
    const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

    return (
      <Modal id={modalId} title="VIBE QUIZ" onClose={() => setOpenModal(null)}>
        <div className={styles.quizModal}>
          <div className={styles.progressSection}>
            <div className={styles.progressText}>
              QUESTION {currentQuestion + 1} of {QUIZ_QUESTIONS.length}
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className={styles.questionSection}>
            <h2 className={styles.question}>{question.question}</h2>
          </div>

          <div className={styles.optionsSection}>
            {(["a", "b", "c"] as const).map((option, idx) => (
              <button
                key={option}
                className={`${styles.optionButton} ${focusedOption === idx ? styles.focused : ""}`}
                onClick={() => handleAnswer(option)}
                style={{ minHeight: "44px" }}
              >
                {question.options[option]}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  // Results mode
  const theirResultData = theirResult
    ? {
        emoji: theirResult.emoji,
        title: theirResult.title,
        description: theirResult.description,
      }
    : null;

  return (
    <Modal id={modalId} title="YOUR VIBE" onClose={() => setOpenModal(null)}>
      <div className={styles.resultsModal}>
        <div className={styles.resultSection}>
          <div className={styles.resultEmoji}>
            <i
              className="hn hn-star-solid"
              style={{ fontSize: "1.5rem", marginRight: "var(--space-xs)" }}
            />
            <i className={`hn ${getIconForEmoji(yourResult.emoji)}`} style={{ fontSize: "2rem" }} />
            <i
              className="hn hn-star-solid"
              style={{ fontSize: "1.5rem", marginLeft: "var(--space-xs)" }}
            />
          </div>
          <h2 className={styles.resultTitle}>YOU ARE {yourResult.title}</h2>
          <p className={styles.resultDescription}>{yourResult.description}</p>
        </div>

        {theirResultData && (
          <div className={styles.compatibilitySection}>
            <h3 className={styles.compatibilityTitle}>--- COMPATIBILITY ---</h3>
            <div className={styles.theirResult}>
              <div className={styles.theirEmoji}>
                <i
                  className={`hn ${getIconForEmoji(theirResultData.emoji)}`}
                  style={{ fontSize: "2rem" }}
                />
              </div>
              <div className={styles.theirTitle}>{theirResultData.title}</div>
            </div>
            {compatibilityNote && <p className={styles.compatibilityNote}>{compatibilityNote}</p>}
          </div>
        )}

        {!theirResultData && (
          <div className={styles.waitingSection}>
            <p>Waiting for them to take the quiz...</p>
          </div>
        )}

        <button
          className={styles.retakeButton}
          onClick={handleRetake}
          style={{ minHeight: "44px" }}
        >
          RETAKE QUIZ
        </button>
      </div>
    </Modal>
  );
}
