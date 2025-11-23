"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScale } from "@/lib/scale-context";
import { playSound } from "@/lib/sounds";

interface NavigationProps {
  themeColors?: {
    bg?: string;
    text?: string;
    border?: string;
    active?: string;
  };
  actions?: {
    label: string;
    onClick: () => void;
    icon?: string;
    primary?: boolean;
  }[];
}

export function Navigation({ themeColors, actions }: NavigationProps = {} as NavigationProps) {
  const pathname = usePathname();
  const { scale, setScale } = useScale();

  const navLinks = [
    { href: "/", label: "HOME" },
    { href: "/admin/content", label: "MANAGE CONTENT" },
    { href: "/admin/images", label: "IMAGES" },
  ];

  const navStyle: React.CSSProperties = {
    background: themeColors?.bg || "var(--admin-bg)",
    borderBottomColor: themeColors?.border || "var(--admin-accent)",
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
                ? (themeColors?.active || "var(--admin-text)")
                : (themeColors?.text || "var(--admin-secondary)"),
            }}
            onClick={() => playSound("click")}
          >
            {link.label}
          </Link>
        );
      })}
      
      {/* Contextual Actions */}
      {actions && actions.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-sm)", marginLeft: "var(--space-md)", borderLeft: "1px solid var(--game-border)", paddingLeft: "var(--space-md)" }}>
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                playSound(action.primary ? "select" : "click");
              }}
              className={`game-button ${action.primary ? "game-button-primary" : ""}`}
              style={{ fontSize: "var(--font-size-xs)", height: "24px", minHeight: "24px" }}
            >
              {action.icon && <i className={`hn ${action.icon}`} style={{ marginRight: "4px" }} />}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Global Scale Selector */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          gap: "var(--space-xs)",
          alignItems: "center",
          border: `var(--border-width-md) solid ${themeColors?.border || "var(--admin-accent)"}`,
          borderRadius: "var(--radius-sm)",
          padding: "2px",
        }}
      >
        {([1, 2, 4] as const).map((s) => (
          <button
            key={s}
            onClick={() => {
              setScale(s);
              playSound("select");
            }}
            style={{
              padding: "var(--space-xs) var(--space-sm)",
              fontSize: "var(--font-size-xs)",
              fontWeight: "bold",
              background: scale === s ? (themeColors?.active || "var(--admin-primary)") : "transparent",
              color: scale === s ? (themeColors?.bg || "var(--admin-bg)") : (themeColors?.text || "var(--admin-text)"),
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              textTransform: "uppercase",
              height: "var(--height-button)",
              minHeight: "var(--height-button)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {s}x
          </button>
        ))}
      </div>
    </nav>
  );
}
