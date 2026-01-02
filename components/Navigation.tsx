"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { playSound } from "@/lib/sounds";
import clsx from "clsx";
import styles from "./Navigation.module.css";

interface NavigationProps {
  actions?: {
    label: string;
    onClick: () => void;
    icon?: string;
    primary?: boolean;
  }[];
  className?: string;
}

export function Navigation({ actions, className }: NavigationProps = {} as NavigationProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/admin/friends", label: "MANAGE FRIENDS" },
    { href: "/admin/content", label: "MANAGE GLOBAL CONTENT" },
  ];

  return (
    <nav className={clsx("game-nav", styles.nav, className)}>
      {navLinks.map((link) => {
        const isActive =
          pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx("game-nav-link", styles.navLink, isActive && styles.active)}
            onClick={() => playSound("click")}
          >
            {link.label}
          </Link>
        );
      })}

      {/* Contextual Actions */}
      {actions && actions.length > 0 && (
        <div className={styles.actionsContainer}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                playSound(action.primary ? "select" : "click");
              }}
              className={clsx(
                "game-button",
                action.primary && "game-button-primary",
                styles.actionButton
              )}
            >
              {action.icon && <i className={clsx("hn", action.icon, styles.actionIcon)} />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
