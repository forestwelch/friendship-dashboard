import { supabase, isSupabaseConfigured } from "./supabase";

export interface ReviewTopic {
  id: string;
  friend_id: string;
  topic_name: string;
  status: "pending" | "both_reviewed" | "revealed";
  created_at: string;
}

export interface Review {
  id: string;
  topic_id: string;
  reviewer: "admin" | "friend";
  stars: number;
  review_text: string;
  recommend: boolean;
  created_at: string;
}

export async function getCurrentTopic(friendId: string): Promise<ReviewTopic | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("review_topics")
      .select("*")
      .eq("friend_id", friendId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching current topic:", error);
    return null;
  }
}

export async function getReviewsForTopic(topicId: string): Promise<Review[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase.from("reviews").select("*").eq("topic_id", topicId);

    if (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in getReviewsForTopic:", error);
    return [];
  }
}

export async function createTopic(
  friendId: string,
  topicName: string
): Promise<ReviewTopic | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("review_topics")
      .insert({
        friend_id: friendId,
        topic_name: topicName,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating topic:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createTopic:", error);
    return null;
  }
}

export async function submitReview(
  topicId: string,
  reviewer: "admin" | "friend",
  stars: number,
  reviewText: string,
  recommend: boolean
): Promise<Review | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    // Check if both reviews exist
    const existingReviews = await getReviewsForTopic(topicId);
    const hasBothReviews = existingReviews.length >= 2;

    const { data, error } = await supabase
      .from("reviews")
      .upsert(
        {
          topic_id: topicId,
          reviewer,
          stars,
          review_text: reviewText,
          recommend,
        },
        {
          onConflict: "topic_id,reviewer",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error submitting review:", error);
      return null;
    }

    // Update topic status if both reviews exist
    if (hasBothReviews || (await getReviewsForTopic(topicId)).length >= 2) {
      await supabase.from("review_topics").update({ status: "both_reviewed" }).eq("id", topicId);
    }

    return data;
  } catch (error) {
    console.error("Error in submitReview:", error);
    return null;
  }
}

export async function revealTopic(topicId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { error } = await supabase
      .from("review_topics")
      .update({ status: "revealed" })
      .eq("id", topicId);

    if (error) {
      console.error("Error revealing topic:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in revealTopic:", error);
    return false;
  }
}

export interface ReviewTopicWithReviews extends ReviewTopic {
  reviews: Review[];
}

export async function getAllRevealedTopics(friendId: string): Promise<ReviewTopicWithReviews[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data: topics, error } = await supabase
      .from("review_topics")
      .select("*")
      .eq("friend_id", friendId)
      .eq("status", "revealed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching revealed topics:", error);
      return [];
    }

    if (!topics || topics.length === 0) {
      return [];
    }

    // Fetch reviews for all topics
    const topicIds = topics.map((t) => t.id);
    const { data: allReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("*")
      .in("topic_id", topicIds);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
      return topics.map((topic) => ({ ...topic, reviews: [] }));
    }

    // Group reviews by topic_id
    const reviewsByTopic = new Map<string, Review[]>();
    (allReviews || []).forEach((review) => {
      const existing = reviewsByTopic.get(review.topic_id) || [];
      existing.push(review);
      reviewsByTopic.set(review.topic_id, existing);
    });

    // Combine topics with their reviews
    return topics.map((topic) => ({
      ...topic,
      reviews: reviewsByTopic.get(topic.id) || [],
    }));
  } catch (error) {
    console.error("Error in getAllRevealedTopics:", error);
    return [];
  }
}
