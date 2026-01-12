"use client";

import React from "react";
import { FriendWidget } from "@/lib/queries";
import { WidgetConfig, WidgetSize } from "@/lib/types";
import { PixelArtConfigModal } from "./PixelArtConfigModal";
import { MusicPlayerConfigModal } from "./MusicPlayerConfigModal";
import { DefaultWidgetConfigModal } from "./DefaultWidgetConfigModal";

interface WidgetConfigModalProps {
  widget: FriendWidget | null;
  onClose: () => void;
  onSave: (config: WidgetConfig, size?: WidgetSize) => void;
}

export function WidgetConfigModal({ widget, onClose, onSave }: WidgetConfigModalProps) {
  if (!widget) return null;

  switch (widget.widget_type) {
    case "pixel_art":
      return <PixelArtConfigModal widget={widget} onClose={onClose} onSave={onSave} />;

    case "music_player":
      return <MusicPlayerConfigModal widget={widget} onClose={onClose} onSave={onSave} />;

    default:
      // For widgets without specific config modals, use default modal with size selection
      return <DefaultWidgetConfigModal widget={widget} onClose={onClose} onSave={onSave} />;
  }
}
