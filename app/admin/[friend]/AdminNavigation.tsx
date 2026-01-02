"use client";

import { Navigation } from "@/components/Navigation";
import { useUserContext } from "@/lib/use-user-context";
import { useState, useCallback, useEffect } from "react";
import { playSound } from "@/lib/sounds";

export function AdminNavigation() {
  const userContext = useUserContext();
  const [isEditMode, setIsEditMode] = useState(true);

  // Listen for edit mode changes from FriendPageClient
  useEffect(() => {
    const handleEditModeChanged = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      setIsEditMode(customEvent.detail);
    };
    const eventName = "admin-edit-mode-changed" as keyof WindowEventMap;
    window.addEventListener(eventName, handleEditModeChanged as EventListener);
    return () => {
      window.removeEventListener(eventName, handleEditModeChanged as EventListener);
    };
  }, []);

  const handleAdd = useCallback(() => {
    window.dispatchEvent(new CustomEvent("admin-add-widget"));
    playSound("open");
  }, []);

  const handleSave = useCallback(() => {
    window.dispatchEvent(new CustomEvent("admin-save"));
    playSound("select");
  }, []);

  const handleView = useCallback(() => {
    setIsEditMode(false);
    window.dispatchEvent(new CustomEvent("admin-set-edit-mode", { detail: false }));
    playSound("close");
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditMode(true);
    window.dispatchEvent(new CustomEvent("admin-set-edit-mode", { detail: true }));
    playSound("open");
  }, []);

  if (!userContext.isAdmin) {
    return null;
  }

  return (
    <Navigation
      adminActions={[
        {
          label: "VIEW",
          onClick: handleView,
          isActive: !isEditMode,
        },
        {
          label: "EDIT",
          onClick: handleEdit,
          isActive: isEditMode,
        },
        ...(isEditMode
          ? [
              {
                label: "ADD",
                onClick: handleAdd,
                isActive: false,
              },
              {
                label: "SAVE",
                onClick: handleSave,
                isActive: false,
              },
            ]
          : []),
      ]}
    />
  );
}
