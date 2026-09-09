import { NotFoundState } from "@/components/system";
import "@/styles/dashboard-tokens.css";

export default function NotFoundPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        background: "var(--dash-bg, #f8f9ff)",
      }}
    >
      <div style={{ width: "100%", maxWidth: "40rem" }}>
        <NotFoundState backHref="/login" backLabel="Back to Login" />
      </div>
    </main>
  );
}
