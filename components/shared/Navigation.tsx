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
          className={clsx("game-nav-link", styles.navLink, "cursor-pointer")}
        >
          ADD FRIEND
        </button>
      )}

      {/* Admin Actions as Links - styled as sub-actions (smaller, underlined) */}
      {adminActions && adminActions.length > 0 && (
        <>
          {adminActions.map((action, index) => (
            <div key={index} className={styles.navDropdownContainer}>
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
                  action.isActive && "active",
                  action.disabled && styles.navButtonDisabled,
                  !action.disabled && "cursor-pointer"
                )}
              >
                {action.label}
              </button>
              {action.hasDropdown && action.dropdownItems && action.dropdownItems.length > 0 && (
                <div className={styles.navDropdown}>
                  {action.dropdownItems.map((item, itemIndex) => (
                    <button
                      key={itemIndex}
                      onClick={() => {
                        item.onClick();
                        playSound("click");
                      }}
                      className={styles.navDropdownItem}
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
