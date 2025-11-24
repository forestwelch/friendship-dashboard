"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { playSound } from "@/lib/sounds";

interface NavigationProps {
  actions?: {
    label: string;
    onClick: () => void;
    icon?: string;
    primary?: boolean;
  }[];
}

export function Navigation({ actions }: NavigationProps = {} as NavigationProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/admin/friends", label: "MANAGE FRIENDS" },
    { href: "/admin/content", label: "MANAGE GLOBAL CONTENT" },
  ];

  const navStyle: React.CSSProperties = {
    background: "var(--bg)",
    borderBottomColor: "var(--accent)",
  };

  return (
    <nav className="game-nav" style={navStyle}>
      {navLinks.map((link) => {
        const isActive = pathname === link.href || 
          (link.href !== "/" && pathname?.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`game-nav-link ${isActive ? "active" : ""}`}
            style={{
              color: isActive 
                ? "var(--primary)"
                : "var(--text)",
            }}
            onClick={() => playSound("click")}
          >
            {link.label}
          </Link>
        );
      })}
      
      {/* Contextual Actions */}
      {actions && actions.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-sm)", marginLeft: "var(--space-md)", borderLeft: "var(--border-width-sm) solid var(--accent)", paddingLeft: "var(--space-md)" }}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                playSound(action.primary ? "select" : "click");
              }}
              className={`game-button ${action.primary ? "game-button-primary" : ""}`}
              style={{ fontSize: "var(--font-size-xs)", height: "1.5rem", minHeight: "1.5rem" }}
            >
              {action.icon && <i className={`hn ${action.icon}`} style={{ marginRight: "0.25rem" }} />}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
