import Link from "next/link";

export default function NotFound() {
  return (
    <div className="theme-daniel" style={{ width: "100vw", height: "100vh" }}>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "var(--space-2xl)",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        <h1 style={{ fontSize: "var(--font-size-2xl)" }}>404 - Friend Not Found</h1>
        <p style={{ fontSize: "var(--font-size-base)" }}>This friend doesn&apos;t have a dashboard yet.</p>
        <Link
          href="/"
          className="widget-button"
          style={{
            padding: "var(--space-xl) var(--space-2xl)",
            textDecoration: "none",
            fontSize: "var(--font-size-xl)",
            textAlign: "center",
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}


