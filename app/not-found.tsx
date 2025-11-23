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
          gap: "24px",
          background: "var(--bg)",
          color: "var(--text)",
        }}
      >
        <h1 style={{ fontSize: "32px" }}>404 - Friend Not Found</h1>
        <p style={{ fontSize: "16px" }}>This friend doesn't have a dashboard yet.</p>
        <Link
          href="/"
          className="widget-button"
          style={{
            padding: "16px 32px",
            textDecoration: "none",
            fontSize: "24px",
            textAlign: "center",
          }}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}


