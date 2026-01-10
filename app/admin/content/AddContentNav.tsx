"use client";

import { Navigation } from "@/components/Navigation";
import { playSound } from "@/lib/sounds";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";

interface Album {
  id: string;
  name: string;
  created_at: string;
  imageCount: number;
}

interface AddContentNavProps {
  onAddSong?: () => void;
  onSaveSongs?: () => void;
  onUploadImages?: () => void;
  onDeleteImages?: () => void;
  onAddToAlbum?: (albumId: string | null) => void;
  selectedImagesCount?: number;
  albums?: Album[];
  saving?: boolean;
}

export function AddContentNav({
  onAddSong,
  onSaveSongs,
  onUploadImages,
  onDeleteImages,
  onAddToAlbum,
  selectedImagesCount = 0,
  albums = [],
  saving = false,
}: AddContentNavProps) {
  const pathname = usePathname();
  const isSongsPage = pathname === "/admin/content/songs";
  const isImagesPage = pathname === "/admin/content/images";
  const [showAlbumDropdown, setShowAlbumDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showAlbumDropdown) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowAlbumDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAlbumDropdown]);

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
        label: selectedImagesCount > 0 ? `ADD TO ALBUM (${selectedImagesCount})` : "ADD TO ALBUM",
        onClick: () => {
          setShowAlbumDropdown(!showAlbumDropdown);
          playSound("click");
        },
        isActive: false,
        disabled: selectedImagesCount === 0,
        hasDropdown: selectedImagesCount > 0 && showAlbumDropdown,
        dropdownItems:
          selectedImagesCount > 0
            ? [
                {
                  label: "Remove from Album",
                  onClick: () => {
                    onAddToAlbum?.(null);
                    setShowAlbumDropdown(false);
                    playSound("click");
                  },
                },
                ...albums.map((album) => ({
                  label: `${album.name} (${album.imageCount})`,
                  onClick: () => {
                    onAddToAlbum?.(album.id);
                    setShowAlbumDropdown(false);
                    playSound("click");
                  },
                })),
              ]
            : [],
      },
      {
        label: selectedImagesCount > 0 ? `DELETE ${selectedImagesCount}` : "DELETE",
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
