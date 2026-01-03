"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ className = "", ...props }: InputProps) {
  return <input className={`game-input ${className}`} {...props} />;
}
