"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { playSound } from "@/lib/sounds";
import clsx from "clsx";
import styles from "./Navigation.module.css";

interface NavigationProps {
  adminActions?: {
    label: string;
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    hasDropdown?: boolean;
    dropdownItems?: Array<{ label: string; onClick: () => void }>;
  }[];
  addFriendAction?: {
    onClick: () => void;
  };
  className?: string;
}

export function Navigation(
  { adminActions, addFriendAction, className }: NavigationProps = {} as NavigationProps
) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/admin/content", label: "MANAGE CONTENT" },
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

      {/* Add Friend button - shown on manage friends page */}
      {addFriendAction && (
        <button
          onClick={() => {
            addFriendAction.onClick();
            playSound("click");
          }}
          className={clsx("game-nav-link", styles.navLink)}
          style={{
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ADD FRIEND
        </button>
      )}

      {/* Admin Actions as Links - styled as sub-actions (smaller, underlined) */}
      {adminActions && adminActions.length > 0 && (
        <>
          {adminActions.map((action, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                display: "inline-block",
              }}
            >
              <button
                onClick={() => {
                  if (!action.disabled) {
                    action.onClick();
                    if (!action.hasDropdown) {
                      playSound("click");
                    }
                  }
                }}
                disabled={action.disabled}
                className={clsx(
                  "game-nav-link",
                  styles.navLink,
                  styles.subAction,
                  action.isActive && "active"
                )}
                style={{
                  cursor: action.disabled ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: action.disabled ? 0.5 : 1,
                }}
              >
                {action.label}
              </button>
              {action.hasDropdown && action.dropdownItems && action.dropdownItems.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    marginTop: "var(--space-xs)",
                    background: "var(--game-surface)",
                    border: "var(--border-width-md) solid var(--game-border)",
                    borderRadius: "var(--radius-sm)",
                    padding: "var(--space-xs)",
                    zIndex: 1000,
                    minWidth: "12rem",
                    maxHeight: "20rem",
                    overflowY: "auto",
                  }}
                >
                  {action.dropdownItems.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      onClick={() => {
                        item.onClick();
                        playSound("click");
                      }}
                      style={{
                        width: "100%",
                        padding: "var(--space-xs) var(--space-sm)",
                        textAlign: "left",
                        background: "transparent",
                        border: "none",
                        color: "var(--text)",
                        cursor: "pointer",
                        fontSize: "var(--font-size-sm)",
                        fontFamily: "inherit",
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </nav>
  );
}
