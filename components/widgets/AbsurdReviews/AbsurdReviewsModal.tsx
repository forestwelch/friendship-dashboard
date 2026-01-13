"use client";

import React, { useState } from "react";
import { Modal } from "@/components/shared";
import { useUIStore } from "@/lib/store/ui-store";
import {
  useCurrentTopic,
  useReviewsForTopic,
  useCreateTopic,
  useAllRevealedTopics,
  submitReview,
} from "./queries";
import { useQueryClient } from "@tanstack/react-query";
import { useIdentity } from "@/lib/hooks/useIdentity";
import { FormField, Input, Textarea, Button, Card } from "@/components/shared";
import { formatDateCompact } from "@/lib/utils/date-utils";
import { getUserColorVar } from "@/lib/utils/color-utils";
import { playSound } from "@/lib/sounds";
import styles from "./AbsurdReviewsModal.module.css";

interface AbsurdReviewsModalProps {
  friendId: string;
  friendName: string;
}

export function AbsurdReviewsModal({ friendId, friendName }: AbsurdReviewsModalProps) {
  const { setOpenModal } = useUIStore();
  const [stars, setStars] = useState(3);
  const [reviewText, setReviewText] = useState("");
  const [recommend, setRecommend] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const identity = useIdentity();
  const modalId = `anthropocenereviewed-${friendId}`;

  const { data: topic } = useCurrentTopic(friendId);
  const { data: reviews = [] } = useReviewsForTopic(topic?.id || null);
  const { data: archivedTopics = [] } = useAllRevealedTopics(friendId);
  const createTopicMutation = useCreateTopic(friendId);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myReview = topic ? reviews.find((r) => r.reviewer === identity) : null;
  const otherReview = topic ? reviews.find((r) => r.reviewer !== identity) : null;
  const hasBothReviews = reviews.length >= 2;

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !topic.id || !reviewText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitReview(topic.id, identity, stars, reviewText.trim(), recommend);
      if (result) {
        queryClient.invalidateQueries({ queryKey: ["reviews", topic.id] });
        queryClient.invalidateQueries({ queryKey: ["review_topic", friendId] });
        // Invalidate archive when both reviews are submitted (topic becomes "both_reviewed")
        queryClient.invalidateQueries({ queryKey: ["revealed_topics", friendId] });
        setReviewText("");
        setStars(3);
        setRecommend(false);
        playSound("success");
      } else {
        playSound("error");
      }
    } catch {
      playSound("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || createTopicMutation.isPending) return;

    createTopicMutation.mutate(newTopicName.trim(), {
      onSuccess: () => {
        setNewTopicName("");
      },
    });
  };

  return (
    <Modal id={modalId} title="Anthropocene Reviewed" onClose={() => setOpenModal(null)}>
      <div className="modal-content">
        {!topic ? (
          // Set Topic Form (Forest only)
          identity === "admin" && (
            <form onSubmit={handleSetTopic} className={`form ${styles.formFullWidth}`}>
              <div className="form-title">Set New Topic:</div>
              <FormField label="Topic name" required>
                <Input
                  type="text"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="e.g., 'The concept of Tuesday'"
                  required
                  className={styles.formFieldFullWidth}
                />
              </FormField>
              <Button
                type="submit"
                variant="primary"
                disabled={createTopicMutation.isPending || !newTopicName.trim()}
              >
                {createTopicMutation.isPending ? "Setting..." : "Set Topic"}
              </Button>
            </form>
          )
        ) : (
          <>
            {/* Topic Display */}
            <div className={styles.textCentered}>
              <div className={`form-title ${styles.formTitleLarge}`}>{topic.topic_name}</div>
            </div>

            {/* Submit Review Form */}
            {!myReview && (
              <form onSubmit={handleSubmitReview} className={`form ${styles.formFullWidth}`}>
                <FormField label="" required={false}>
                  <div className={`star-rating-buttons ${styles.starRatingButtons}`}>
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        onClick={() => setStars(num)}
                        className={stars === num ? "star-selected" : ""}
                      >
                        {num} <i className={`hn hn-star-solid ${styles.starIcon}`} />
                      </Button>
                    ))}
                  </div>
                </FormField>
                <FormField label="" required={false}>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Your review..."
                    rows={3}
                    maxLength={200}
                    showCharCount
                    required
                    className={styles.formFieldFullWidth}
                  />
                </FormField>
                <div className="checkbox-field">
                  <input
                    type="checkbox"
                    id="recommend"
                    checked={recommend}
                    onChange={(e) => setRecommend(e.target.checked)}
                  />
                  <label htmlFor="recommend">Recommend to a friend?</label>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting || !reviewText.trim()}
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            )}

            {/* View Reviews */}
            {hasBothReviews && (
              <div className="reviews-section">
                <div className="reviews-grid">
                  {[myReview, otherReview].map((review, idx) => {
                    if (!review) return null;
                    const reviewColor = getUserColorVar(review.reviewer, friendId);
                    return (
                      <Card key={idx} style={{ borderColor: reviewColor }}>
                        <div
                          className={`entry-title ${styles.entryTitle}`}
                          style={{ "--entry-color": reviewColor } as React.CSSProperties}
                        >
                          {review.reviewer === identity
                            ? "You"
                            : review.reviewer === "admin"
                              ? "Forest"
                              : friendName}
                        </div>
                        <div className="stars-display">
                          {Array.from({ length: review.stars }).map((_, i) => (
                            <i key={i} className="hn hn-star-solid" />
                          ))}
                        </div>
                        <div
                          className={`entry-content ${styles.entryContent}`}
                          style={{ "--entry-color": reviewColor } as React.CSSProperties}
                        >
                          {review.review_text}
                        </div>
                        {review.recommend && (
                          <div className="recommend-badge">
                            <i className="hn hn-check-solid" /> Recommends
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Set Next Topic (Forest only) */}
            {hasBothReviews && identity === "admin" && (
              <form onSubmit={handleSetTopic} className={`form ${styles.formFullWidth}`}>
                <div className="form-title">Set Next Topic:</div>
                <FormField label="Topic name" required>
                  <Input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="e.g., 'The concept of Tuesday'"
                    required
                    className={styles.formFieldFullWidth}
                  />
                </FormField>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createTopicMutation.isPending || !newTopicName.trim()}
                >
                  {createTopicMutation.isPending ? "Setting..." : "Set Next Topic"}
                </Button>
              </form>
            )}
          </>
        )}

        {/* Archive Section */}
        {archivedTopics.length > 0 && (
          <div className="entries-list">
            <div className="form-title">Archive:</div>
            {archivedTopics.map((archivedTopic) => {
              const archivedReviews = archivedTopic.reviews || [];
              const myArchivedReview = archivedReviews.find((r) => r.reviewer === identity);
              const otherArchivedReview = archivedReviews.find((r) => r.reviewer !== identity);

              return (
                <div key={archivedTopic.id} className="entry">
                  <div className="entry-title">{archivedTopic.topic_name}</div>
                  {myArchivedReview && otherArchivedReview && (
                    <div className={`reviews-grid ${styles.reviewsGridWithMargin}`}>
                      {[myArchivedReview, otherArchivedReview].map((review, idx) => {
                        if (!review) return null;
                        const reviewColor = getUserColorVar(review.reviewer, friendId);
                        return (
                          <Card key={idx} style={{ borderColor: reviewColor }}>
                            <div
                              className={`entry-title ${styles.entryTitle}`}
                              style={{ "--entry-color": reviewColor } as React.CSSProperties}
                            >
                              {review.reviewer === identity
                                ? "You"
                                : review.reviewer === "admin"
                                  ? "Forest"
                                  : friendName}
                            </div>
                            <div className="stars-display">
                              {Array.from({ length: review.stars }).map((_, i) => (
                                <i key={i} className="hn hn-star-solid" />
                              ))}
                            </div>
                            <div
                              className={`entry-content ${styles.entryContent}`}
                              style={{ "--entry-color": reviewColor } as React.CSSProperties}
                            >
                              {review.review_text}
                            </div>
                            {review.recommend && (
                              <div className="recommend-badge">
                                <i className="hn hn-check-solid" /> Recommends
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                  <div className="entry-meta">{formatDateCompact(archivedTopic.created_at)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
