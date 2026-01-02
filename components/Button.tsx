"use client";

import React from "react";
import { playSound } from "@/lib/sounds";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  sound?: "click" | "success" | "error" | "pop" | "blip" | false;
  className?: string;
}

export function Button({
  children,
  sound = "click",
  className = "",
  onClick,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (sound) {
      playSound(sound);
    }
    onClick?.(e);
  };

  return (
    <button className={`widget-button ${className}`} onClick={handleClick} {...props}>
      {children}
    </button>
  );
}
