"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isOpen = openModal === id;

  // Close modal on navigation to prevent DOM errors
  useEffect(() => {
    if (isOpen) {
      setOpenModal(null);
      onClose?.();
    }
    // Only react to pathname changes, not other dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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

    // Only focus first element if no input is already focused
    // This prevents stealing focus when user is typing
    const activeElement = document.activeElement;
    const isInputFocused =
      activeElement &&
      (activeElement.tagName === "INPUT" ||
        activeElement.tagName === "TEXTAREA" ||
        activeElement.tagName === "SELECT");

    if (!isInputFocused) {
      firstElement?.focus();
    }

    return () => {
      modal.removeEventListener("keydown", handleTab);
    };
  }, [isOpen]);

  // Handle backdrop click to close modal
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      style={{ pointerEvents: "auto" }}
    >
      <div
        className={styles.modal}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: "auto" }}
      >
        <div className={styles.header}>
          {title && (
            <h2 id={`${id}-title`} className={styles.title}>
              {title}
            </h2>
          )}
          <button className={styles.closeButton} onClick={handleClose} aria-label="Close modal">
            <i className="hn hn-window-close-solid" />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );

  // Portal to grid container wrapper if available and still in DOM, otherwise render to body
  // This ensures modals render in the same place as the grid with proper scaling/positioning
  if (typeof document !== "undefined") {
    const gridWrapper =
      document.querySelector("[data-grid-container-wrapper]") ||
      document.querySelector("[data-grid-container]");

    if (gridWrapper && gridWrapper.isConnected && document.body.contains(gridWrapper)) {
      return createPortal(modalContent, gridWrapper);
    }

    // Fallback to body if grid container not available
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}
