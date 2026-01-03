"use client";

import React from "react";
import { playSound } from "@/lib/sounds";
import clsx from "clsx";

type SoundName = Parameters<typeof playSound>[0];

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "default";
  icon?: boolean;
  sound?: SoundName | false;
  children: React.ReactNode;
}

export function Button({
  variant = "default",
  icon = false,
  sound = "click",
  className = "",
  onClick,
  children,
  ...props
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (sound) {
      playSound(sound);
    }
    onClick?.(e);
  };

  const variantClass = variant !== "default" ? `game-button-${variant}` : "";
  const iconClass = icon ? "game-button-icon" : "";

  return (
    <button
      className={clsx("game-button", variantClass, iconClass, className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}
