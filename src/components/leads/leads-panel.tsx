"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageHeader, StatusBadge } from "@/components/ui/dashboard-ui";
import { formatDate } from "@/lib/utils";
import type { UnifiedLead } from "@/lib/adapters/types";

const STATUS_OPTIONS = [
  "NEW",
  "READ",
  "ARCHIVED",
  "CONTACTED",
  "QUALIFIED",
  "QUOTED",
  "NEGOTIATION",
  "CONFIRMED",
  "WON",
  "LOST",
];

type Props = {
  projectSlug: string;
  title: string;
  leads: UnifiedLead[];
};

export function LeadsTable({ projectSlug, title, leads }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filtered = leads.filter((lead) => {
    const matchesQuery =
      !query ||
      lead.fullName.toLowerCase().includes(query.toLowerCase()) ||
      lead.email.toLowerCase().includes(query.toLowerCase()) ||
      lead.phone.includes(query);
    const matchesStatus =
      statusFilter === "ALL" || lead.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div>
      <PageHeader title={title} description={`${filtered.length} leads shown`} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Search name, email, phone…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none ring-black focus:ring-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none"
        >
          <option value="ALL">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    No leads found
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-black">
                        {lead.fullName || "—"}
                      </p>
                      <p className="text-xs text-neutral-500">{lead.email || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {lead.formKey || lead.source || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/${projectSlug}/leads/${lead.id}`}
                        className="text-sm font-semibold text-black underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

type DetailProps = {
  projectSlug: string;
  lead: UnifiedLead;
};

export function LeadDetail({ projectSlug, lead }: DetailProps) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function saveStatus() {
    setPending(true);
    setMessage("");
    try {
      const res = await fetch(`/api/${projectSlug}/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setMessage("Failed to update status");
        return;
      }
      setMessage("Status updated");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={lead.fullName || "Lead Detail"}
        description={lead.email || undefined}
        actions={
          <Link
            href={`/${projectSlug}/leads`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Back to leads
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-black">Contact</h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <Field label="Name" value={lead.fullName} />
              <Field label="Email" value={lead.email} />
              <Field label="Phone" value={lead.phone} />
              <Field label="Service" value={lead.service} />
              <Field label="Source" value={lead.source} />
              <Field label="Form" value={lead.formKey} />
              <Field label="Page" value={lead.sourcePage} />
              <Field label="Created" value={formatDate(lead.createdAt)} />
            </dl>
          </div>

          {lead.message ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-black">Message</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">
                {lead.message}
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-black">Status</h3>
          <div className="mt-4 space-y-3">
            <StatusBadge status={status} />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveStatus}
              disabled={pending}
              className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Saving…" : "Update status"}
            </button>
            {message ? (
              <p className="text-xs text-neutral-600">{message}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-1 text-neutral-800">{value || "—"}</dd>
    </div>
  );
}
