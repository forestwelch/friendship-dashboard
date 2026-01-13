"use client";

import { useEffect, useRef, useCallback, useState } from "react";
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
  const isMountedRef = useRef(true);
  const [shouldRender, setShouldRender] = useState(isOpen);

  // Track mount state to prevent rendering after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Close modal on navigation to prevent DOM errors
  useEffect(() => {
    if (isOpen) {
      setOpenModal(null);
      onClose?.();
      // Delay hiding to allow cleanup to complete
      setShouldRender(false);
    }
    // Only react to pathname changes, not other dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Update shouldRender when isOpen changes
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      // Delay hiding to prevent portal errors during unmount
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setShouldRender(false);
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    // Return undefined explicitly for the if branch
    return undefined;
  }, [isOpen]);

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

  // No backdrop click - removed for seamless app feel

  if (!isOpen || !shouldRender) return null;

  const modalContent = (
    <div className={`${styles.backdrop} pointer-events-auto`}>
      <div
        className={`${styles.modal} pointer-events-auto`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${id}-title` : undefined}
        onClick={(e) => e.stopPropagation()}
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
  // Add guards to prevent portal errors during navigation
  if (typeof document !== "undefined" && isMountedRef.current) {
    const gridWrapper =
      document.querySelector("[data-grid-container-wrapper]") ||
      document.querySelector("[data-grid-container]");

    // Double-check that the target is still connected before creating portal
    if (
      gridWrapper &&
      gridWrapper.isConnected &&
      document.body.contains(gridWrapper) &&
      isMountedRef.current
    ) {
      try {
        return createPortal(modalContent, gridWrapper);
      } catch (error) {
        // Fallback to body if portal fails (e.g., during navigation)
        console.warn("Failed to portal to grid wrapper, falling back to body:", error);
        if (isMountedRef.current && document.body.isConnected) {
          return createPortal(modalContent, document.body);
        }
        return null;
      }
    }

    // Fallback to body if grid container not available
    if (isMountedRef.current && document.body.isConnected) {
      try {
        return createPortal(modalContent, document.body);
      } catch (error) {
        // Component is unmounting, don't render
        console.warn("Failed to create portal during navigation:", error);
        return null;
      }
    }
  }

  return null;
}
