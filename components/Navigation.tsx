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

      {/* Admin Actions as Links - styled exactly like nav links */}
      {adminActions && adminActions.length > 0 && (
        <>
          {adminActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                playSound("click");
              }}
              className={clsx("game-nav-link", styles.navLink, action.isActive && "active")}
              style={{
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {action.label}
            </button>
          ))}
        </>
      )}
    </nav>
  );
}
