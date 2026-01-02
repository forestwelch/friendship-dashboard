"use client";

import { Navigation } from "@/components/Navigation";
import { playSound } from "@/lib/sounds";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface AddContentNavProps {
  onAddSong?: () => void;
  onSaveSongs?: () => void;
  onUploadImages?: () => void;
  onDeleteImages?: () => void;
  selectedImagesCount?: number;
  saving?: boolean;
}

export function AddContentNav({
  onAddSong,
  onSaveSongs,
  onUploadImages,
  onDeleteImages,
  selectedImagesCount = 0,
  saving = false,
}: AddContentNavProps) {
  const pathname = usePathname();
  const isSongsPage = pathname === "/admin/content/songs";
  const isImagesPage = pathname === "/admin/content/images";

  // Listen for add events and trigger callbacks
  useEffect(() => {
    const handleAddSongs = () => {
      onAddSong?.();
      playSound("open");
    };

    const handleAddImages = () => {
      onUploadImages?.();
      playSound("open");
    };

    window.addEventListener("admin-add-songs", handleAddSongs);
    window.addEventListener("admin-add-images", handleAddImages);

    return () => {
      window.removeEventListener("admin-add-songs", handleAddSongs);
      window.removeEventListener("admin-add-images", handleAddImages);
    };
  }, [onAddSong, onUploadImages]);

  const adminActions = [];

  if (isSongsPage) {
    adminActions.push(
      {
        label: "ADD SONG",
        onClick: () => {
          onAddSong?.();
          playSound("click");
        },
        isActive: false,
      },
      {
        label: saving ? "SAVING..." : "SAVE",
        onClick: () => {
          onSaveSongs?.();
          playSound("click");
        },
        isActive: false,
      }
    );
  } else if (isImagesPage) {
    adminActions.push(
      {
        label: "UPLOAD IMAGES",
        onClick: () => {
          onUploadImages?.();
          playSound("click");
        },
        isActive: false,
      },
      {
        label: `DELETE SELECTED (${selectedImagesCount})`,
        onClick: () => {
          onDeleteImages?.();
          playSound("click");
        },
        isActive: false,
        disabled: selectedImagesCount === 0,
      }
    );
  }

  return <Navigation adminActions={adminActions} />;
}
