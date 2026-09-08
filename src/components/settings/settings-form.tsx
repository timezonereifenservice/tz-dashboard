"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/dashboard-ui";

export function SettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setPending(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await res.json()) as { message?: string };
      setMessage(data.message ?? (res.ok ? "Updated" : "Failed"));
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          Current password
        </label>
        <input
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-black focus:ring-2"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-700">
          New password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none ring-black focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Update password"}
      </button>
      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
    </form>
  );
}

export function SettingsPageClient() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your TZ Transport hub account password"
      />
      <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
        <SettingsForm />
      </div>
    </div>
  );
}
