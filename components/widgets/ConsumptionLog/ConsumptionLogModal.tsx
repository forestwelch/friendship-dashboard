"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/shared";
import { useUIStore } from "@/lib/store/ui-store";
import {
  useConsumptionEntries,
  useCreateConsumptionEntry,
  useMarkConsumptionEntryAsRead,
} from "./queries";
import { useIdentity } from "@/lib/hooks/useIdentity";
import { FormField, Input, Textarea } from "@/components/shared";
import { formatDateCompact } from "@/lib/utils/date-utils";
import { getUserColorVar } from "@/lib/utils/color-utils";
import styles from "./ConsumptionLogModal.module.css";

interface ConsumptionLogModalProps {
  friendId: string;
  friendName: string;
}

export function ConsumptionLogModal({
  friendId,
  friendName: _friendName,
}: ConsumptionLogModalProps) {
  const { openModal, setOpenModal } = useUIStore();
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [thought, setThought] = useState("");
  const identity = useIdentity();
  const modalId = `consumption-${friendId}`;
  const isOpen = openModal === modalId;

  const { data: entries = [] } = useConsumptionEntries(friendId);
  const createMutation = useCreateConsumptionEntry(friendId);
  const markReadMutation = useMarkConsumptionEntryAsRead(friendId);

  // Mark entries as read when modal opens
  useEffect(() => {
    if (isOpen && entries.length > 0) {
      const unreadEntries = entries.filter((entry) => {
        if (identity === "admin") {
          return !entry.read_by_admin;
        } else {
          return !entry.read_by_friend;
        }
      });

      unreadEntries.forEach((entry) => {
        markReadMutation.mutate({ entryId: entry.id, reader: identity });
      });
    }
  }, [isOpen, entries, identity, markReadMutation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !thought.trim() || createMutation.isPending) return;

    createMutation.mutate(
      {
        title: title.trim(),
        thought: thought.trim(),
        link: link.trim() || null,
        addedBy: identity,
      },
      {
        onSuccess: () => {
          setTitle("");
          setLink("");
          setThought("");
        },
      }
    );
  };

  return (
    <Modal id={modalId} title="Shared Consumption Log" onClose={() => setOpenModal(null)}>
      <div className="modal-content">
        {/* Add Entry Form */}
        <form onSubmit={handleSubmit} className={`form ${styles.formFullWidth}`}>
          <FormField label="Title" required={false}>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              className={styles.formFieldFullWidth}
            />
          </FormField>
          <FormField label="Link (optional)">
            <Input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className={styles.formFieldFullWidth}
            />
          </FormField>
          <FormField label="Thoughts" required={false}>
            <Textarea
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              required
              rows={4}
              maxLength={280}
              showCharCount
              className={styles.formFieldFullWidth}
            />
          </FormField>
          <button
            type="submit"
            className="game-button game-button-primary"
            disabled={createMutation.isPending || !title.trim() || !thought.trim()}
          >
            {createMutation.isPending ? "Adding..." : "Add Entry"}
          </button>
        </form>

        {/* Entries List */}
        {entries.length > 0 && (
          <div className="entries-list">
            {entries.map((entry) => {
              const entryColor = getUserColorVar(entry.added_by, friendId);

              return (
                <div key={entry.id} className="entry">
                  <div className="entry-header">
                    <div
                      className={`entry-title ${styles.entryTitle}`}
                      style={{ "--entry-color": entryColor } as React.CSSProperties}
                    >
                      {entry.link ? (
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.entryLink}
                        >
                          {entry.title}
                        </a>
                      ) : (
                        entry.title
                      )}
                    </div>
                    <div className="entry-date">{formatDateCompact(entry.created_at)}</div>
                  </div>
                  <div
                    className={`entry-content ${styles.entryContent}`}
                    style={{ "--entry-color": entryColor } as React.CSSProperties}
                  >
                    {entry.thought}
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
