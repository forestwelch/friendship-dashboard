"use client";

import React, { useState } from "react";
import { FriendWidget } from "@/lib/queries";
import { WidgetConfig, WidgetSize } from "@/lib/types";
import { BaseWidgetConfigModal } from "./BaseWidgetConfigModal";

interface DefaultWidgetConfigModalProps {
  widget: FriendWidget;
  onClose: () => void;
  onSave: (config: WidgetConfig, size?: WidgetSize) => void;
}

// Widget size options by type
const WIDGET_SIZES: Record<string, WidgetSize[]> = {
  personality_quiz: ["1x1", "2x2", "3x3", "4x4"],
  connect_four: ["2x1", "2x2", "3x3", "4x4"],
  consumption_log: ["3x1", "4x1", "5x1"],
  question_jar: ["2x2", "3x2", "4x2"],
  audio_snippets: ["1x2", "1x3", "2x1", "3x1", "4x1"],
  absurd_reviews: ["2x1", "3x1", "4x1"],
  fridge_magnets: ["2x3", "3x4", "4x6"],
};

export function DefaultWidgetConfigModal({
  widget,
  onClose,
  onSave,
}: DefaultWidgetConfigModalProps) {
  const [selectedSize, setSelectedSize] = useState<WidgetSize | null>(widget.size || null);

  const handleSave = () => {
    if (selectedSize && selectedSize !== widget.size) {
      onSave(widget.config || {}, selectedSize);
    } else {
      onSave(widget.config || {});
    }
    onClose();
  };

  const availableSizes = WIDGET_SIZES[widget.widget_type] || [];

  return (
    <BaseWidgetConfigModal
      title={`Configure ${widget.widget_name}`}
      selectedSize={selectedSize}
      availableSizes={availableSizes}
      onSizeChange={setSelectedSize}
      onClose={onClose}
      onSave={handleSave}
    >
      <></>
    </BaseWidgetConfigModal>
  );
}
