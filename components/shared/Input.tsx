"use client";

import React, { memo } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Input = memo(function Input({ className = "", ...props }: InputProps) {
  return <input className={`game-input ${className}`} {...props} />;
});
