"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { playSound } from "@/lib/sounds";
import { useUIStore } from "@/lib/store/ui-store";
import styles from "./Modal.module.css";

interface ModalProps {
  id: string;
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Modal({ id, title, children, onClose }: ModalProps) {
  const { openModal, setOpenModal } = useUIStore();
  const modalRef = useRef<HTMLDivElement>(null);
  const isOpen = openModal === id;

  const handleClose = useCallback(() => {
    playSound("close");
    setOpenModal(null);
    onClose?.();
  }, [setOpenModal, onClose]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => {
      modal.removeEventListener("keydown", handleTab);
    };
  }, [isOpen, handleClose]);

  // Removed backdrop click handler - modals can only be closed via X button or ESC key

  if (!isOpen) return null;

  // Find the grid container wrapper to portal into
  const gridContainer =
    typeof document !== "undefined"
      ? document.querySelector("[data-grid-container-wrapper]") || document.body
      : null;

  const modalContent = (
    <div className={styles.backdrop}>
      <div
        className={styles.modal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
      >
        <div className={styles.header}>
          {title && (
            <h2 id={`${id}-title`} className={styles.title}>
              {title}
            </h2>
          )}
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  // Portal to grid container if available, otherwise render normally
  if (gridContainer && gridContainer !== document.body) {
    return createPortal(modalContent, gridContainer);
  }

  return modalContent;
}
