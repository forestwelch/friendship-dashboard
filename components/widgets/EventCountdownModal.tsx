"use client";

import { useState, useCallback, useMemo } from "react";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import { ThemeColors } from "@/lib/types";
import { Modal } from "@/components/Modal";
import { DatePicker } from "@/components/DatePicker";
import {
  useEventCountdownWidget,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/lib/queries-events";
import styles from "./EventCountdownModal.module.css";

interface Event {
  id: string;
  name: string;
  date: string;
  emoji: string;
  description?: string;
  created_at: string;
}

interface EventCountdownData {
  events?: Event[];
}

interface EventCountdownModalProps {
  friendId: string;
  widgetId: string;
  themeColors: ThemeColors;
  config?: EventCountdownData;
}

const QUICK_EMOJIS = ["🎸", "🎬", "🎤", "🍕", "✈️", "🎭"];

export function EventCountdownModal({
  friendId,
  widgetId,
  themeColors: _themeColors,
  config,
}: EventCountdownModalProps) {
  const { openModal, setOpenModal } = useUIStore();
  const modalId = `event-${widgetId}`;
  const _isOpen = openModal === modalId;

  const { data: eventData } = useEventCountdownWidget(friendId, widgetId);
  const createEventMutation = useCreateEvent(friendId, widgetId);
  const updateEventMutation = useUpdateEvent(friendId, widgetId);
  const deleteEventMutation = useDeleteEvent(friendId, widgetId);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEmoji, setEventEmoji] = useState("🎸");
  const [eventDescription, setEventDescription] = useState("");

  // Sort events by date
  const sortedEvents = useMemo(() => {
    const gameEvents = eventData?.events || config?.events || [];
    return [...gameEvents].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [eventData?.events, config?.events]);

  const _handleCreateNew = () => {
    setEditingEvent(null);
    setEventName("");
    setEventDate("");
    setEventEmoji("🎸");
    setEventDescription("");
    playSound("open");
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEventName(event.name);
    setEventDate(event.date);
    setEventEmoji(event.emoji);
    setEventDescription(event.description || "");
    playSound("open");
  };

  const handleSave = useCallback(() => {
    if (!eventName || !eventDate) return;

    const eventData: Omit<Event, "created_at"> = {
      id: editingEvent?.id || `event-${Date.now()}`,
      name: eventName,
      date: eventDate,
      emoji: eventEmoji,
      description: eventDescription || undefined,
    };

    if (editingEvent) {
      updateEventMutation.mutate(eventData);
    } else {
      createEventMutation.mutate(eventData);
    }

    // Reset form
    setEditingEvent(null);
    setEventName("");
    setEventDate("");
    setEventEmoji("🎸");
    setEventDescription("");
    playSound("event_save");
  }, [
    eventName,
    eventDate,
    eventEmoji,
    eventDescription,
    editingEvent,
    createEventMutation,
    updateEventMutation,
  ]);

  const handleDelete = useCallback(
    (eventId: string) => {
      deleteEventMutation.mutate(eventId);
      playSound("delete");
    },
    [deleteEventMutation]
  );

  // Auto-save on input change
  const handleNameChange = useCallback(
    (value: string) => {
      setEventName(value);
      if (editingEvent && value && eventDate) {
        const timeoutId = setTimeout(() => {
          updateEventMutation.mutate({
            id: editingEvent.id,
            name: value,
            date: eventDate,
            emoji: eventEmoji,
            description: eventDescription,
          });
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    },
    [editingEvent, eventDate, eventEmoji, eventDescription, updateEventMutation]
  );

  const handleDescriptionChange = useCallback(
    (value: string) => {
      setEventDescription(value);
      if (editingEvent && eventName && eventDate) {
        const timeoutId = setTimeout(() => {
          updateEventMutation.mutate({
            id: editingEvent.id,
            name: eventName,
            date: eventDate,
            emoji: eventEmoji,
            description: value,
          });
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    },
    [editingEvent, eventName, eventDate, eventEmoji, updateEventMutation]
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Modal id={modalId} title="EVENT" onClose={() => setOpenModal(null)}>
      <div className={styles.eventModal}>
        {/* Create/Edit Form */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>EVENT NAME</h3>
          <input
            type="text"
            className={styles.input}
            value={eventName}
            onChange={(e) => handleNameChange(e.target.value)}
            onFocus={() => playSound("ping")}
            placeholder="Enter event name..."
            autoSave="true"
          />

          <h3 className={styles.sectionTitle}>DATE</h3>
          <DatePicker
            id={`${widgetId}-date`}
            value={eventDate}
            onChange={(date) => {
              setEventDate(date);
              if (editingEvent && eventName) {
                updateEventMutation.mutate({
                  id: editingEvent.id,
                  name: eventName,
                  date,
                  emoji: eventEmoji,
                  description: eventDescription,
                });
              }
            }}
          />

          <h3 className={styles.sectionTitle}>EMOJI</h3>
          <div className={styles.emojiGrid}>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                className={`${styles.emojiButton} ${eventEmoji === emoji ? styles.selected : ""}`}
                onClick={() => {
                  setEventEmoji(emoji);
                  if (editingEvent && eventName && eventDate) {
                    updateEventMutation.mutate({
                      id: editingEvent.id,
                      name: eventName,
                      date: eventDate,
                      emoji,
                      description: eventDescription,
                    });
                  }
                  playSound("select");
                }}
                aria-label={`Select ${emoji}`}
                style={{ minWidth: "44px", minHeight: "44px" }}
              >
                {emoji}
              </button>
            ))}
          </div>

          <h3 className={styles.sectionTitle}>DESCRIPTION (optional)</h3>
          <textarea
            className={styles.textarea}
            value={eventDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Add description..."
            rows={3}
          />

          {editingEvent && (
            <button
              className={styles.deleteButton}
              onClick={() => handleDelete(editingEvent.id)}
              style={{ minHeight: "44px" }}
            >
              DELETE
            </button>
          )}

          {!editingEvent && eventName && eventDate && (
            <button
              className={styles.saveButton}
              onClick={handleSave}
              style={{ minHeight: "44px" }}
            >
              CREATE EVENT
            </button>
          )}
        </div>

        {/* Events List */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>EXISTING EVENTS</h3>
          <div className={styles.eventsList}>
            {sortedEvents.length > 0 ? (
              sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className={styles.eventItem}
                  onClick={() => handleEdit(event)}
                >
                  <div className={styles.eventHeader}>
                    <span className={styles.emoji}>{event.emoji}</span>
                    <span className={styles.eventName}>{event.name}</span>
                  </div>
                  <div className={styles.eventDate}>{formatDate(event.date)}</div>
                  {event.description && (
                    <div className={styles.eventDescription}>{event.description}</div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.noEvents}>No events yet. Create one above!</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

