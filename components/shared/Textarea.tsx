"use client";

import React, { memo, useCallback } from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  maxLength?: number;
  showCharCount?: boolean;
}

export const Textarea = memo(function Textarea({
  value,
  onChange,
  maxLength,
  showCharCount = false,
  className = "",
  ...props
}: TextareaProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (maxLength && e.target.value.length > maxLength) {
        return;
      }
      onChange(e);
    },
    [maxLength, onChange]
  );

  return (
    <>
      <textarea
        className={`game-input ${className}`}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
        {...props}
      />
      {showCharCount && maxLength && (
        <div className="form-helper-text">
          {value.length}/{maxLength}
        </div>
      )}
    </>
  );
});
