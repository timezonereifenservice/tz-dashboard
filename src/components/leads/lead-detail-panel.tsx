"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  History,
  Mail,
  MessageSquareQuote,
  Phone,
  Route,
  Send,
  Shield,
  Snowflake,
  Star,
} from "lucide-react";
import type { UnifiedLead } from "@/lib/adapters/types";
import { getProjectMeta } from "@/lib/projects/meta";
import type { ProjectConfig } from "@/lib/projects/config";
import {
  formatDate,
  formatLeadCreated,
  formatRelativeTime,
} from "@/lib/utils";
import {
  LeadsStatusBadge,
  STATUS_OPTIONS,
  leadReference,
  sourceLabel,
} from "@/components/leads/lead-shared";
import { ToastNotification } from "@/components/system";
import styles from "./lead-detail.module.css";

type LeadDetailPanelProps = {
  project: ProjectConfig;
  lead: UnifiedLead;
};

function statusStage(status: string) {
  switch (status.toUpperCase()) {
    case "NEW":
      return "STAGE 1";
    case "READ":
    case "CONTACTED":
      return "STAGE 2";
    case "QUALIFIED":
    case "QUOTED":
    case "NEGOTIATION":
      return "STAGE 3";
    case "CONFIRMED":
    case "WON":
      return "STAGE 4";
    default:
      return "CLOSED";
  }
}

type TimelineDot = "secondary" | "primary" | "muted";

function buildTimeline(lead: UnifiedLead, source: string) {
  const events: Array<{
    title: string;
    time: string;
    description: string;
    dot: TimelineDot;
  }> = [
    {
      title: "Lead created",
      time: lead.createdAt,
      description: `Inbound payload received via ${source}.`,
      dot: "muted",
    },
  ];

  if (lead.updatedAt && lead.updatedAt !== lead.createdAt) {
    events.unshift({
      title: "Lead record updated",
      time: lead.updatedAt,
      description: `Latest status is ${lead.status.replace(/_/g, " ")}.`,
      dot: "primary",
    });
  }

  if (lead.status === "NEW") {
    events.unshift({
      title: "Awaiting dispatcher review",
      time: lead.createdAt,
      description: "New inquiry is ready for qualification and routing.",
      dot: "secondary",
    });
  }

  return events;
}

export function LeadDetailPanel({ project, lead }: LeadDetailPanelProps) {
  const router = useRouter();
  const meta = getProjectMeta(project.id);
  const reference = leadReference(project.slug, lead.id);
  const created = formatLeadCreated(lead.createdAt);
  const source = sourceLabel(lead);

  const [status, setStatus] = useState(lead.status);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [copied, setCopied] = useState(false);

  const timeline = useMemo(() => buildTimeline(lead, source), [lead, source]);

  async function saveStatus() {
    setPending(true);
    setFeedback("");
    try {
      const res = await fetch(`/api/${project.slug}/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setFeedback("Failed to update status");
        return;
      }
      setFeedback("Status updated successfully");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function copyEmail() {
    if (!lead.email) return;
    await navigator.clipboard.writeText(lead.email);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={styles.page}>
      <div className={styles.topMeta}>
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <span>Console</span>
          <span>/</span>
          <span>{project.name}</span>
          <span>/</span>
          <Link href={`/${project.slug}/leads`} className={styles.breadcrumbLink}>
            Leads
          </Link>
          <span>/</span>
          <span className={styles.breadcrumbCurrent}>
            {lead.fullName || "Lead"} ({reference})
          </span>
        </nav>
        <span className={styles.feedChip}>
          <span className={styles.feedDot} aria-hidden />
          Direct API Feed
        </span>
      </div>

      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <Link href={`/${project.slug}/leads`} className={styles.backButton}>
            <ArrowLeft size={18} aria-hidden />
            Back to Leads
          </Link>
          <span className={styles.divider} aria-hidden />
          <div>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>{lead.fullName || "Lead Detail"}</h1>
              <span className={styles.refBadge}>{reference}</span>
            </div>
            <p className={styles.subtitle}>
              {lead.email ? (
                <span className={styles.subtitleStrong}>{lead.email}</span>
              ) : null}
              {lead.phone ? (
                <>
                  <span>•</span>
                  <span>{lead.phone}</span>
                </>
              ) : null}
              <span>•</span>
              <span className={styles.subtitleStrong}>{source}</span>
              <span>•</span>
              <span>
                <Clock size={15} style={{ display: "inline", verticalAlign: "text-bottom" }} />{" "}
                Submitted {created.primary} ({formatRelativeTime(lead.createdAt)})
              </span>
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.ghostButton} disabled title="Coming soon">
            <FileText size={18} aria-hidden />
            Download PDF
          </button>
          <button type="button" className={styles.ghostButton} disabled title="Coming soon">
            <Route size={18} aria-hidden />
            Print Route Dossier
          </button>
          <button type="button" className={styles.ghostButton} disabled title="Coming soon">
            <Star size={18} aria-hidden />
            Priority
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.mainColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIcon}>
                  <Building2 size={22} aria-hidden />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Contact & Company Profile</h2>
                  <p className={styles.cardSubtitle}>Lead contact details and acquisition context</p>
                </div>
              </div>
              <span className={styles.cardBadge}>
                <Shield size={15} aria-hidden />
                Verified Lead
              </span>
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Full Contact Name</span>
                <span className={styles.fieldValue}>{lead.fullName || "—"}</span>
                <span className={styles.fieldHint}>Primary contact</span>
              </div>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Corporate Email</span>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldValue}>{lead.email || "—"}</span>
                  {lead.email ? (
                    <button
                      type="button"
                      className={styles.copyButton}
                      aria-label="Copy email"
                      onClick={copyEmail}
                    >
                      <Copy size={16} aria-hidden />
                    </button>
                  ) : null}
                </div>
                <span className={styles.fieldHint}>
                  {copied ? "Copied to clipboard" : "Click to copy email"}
                </span>
              </div>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Direct Phone</span>
                <div className={styles.fieldRow}>
                  <span className={styles.fieldValue}>{lead.phone || "—"}</span>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className={styles.copyButton} aria-label="Call phone">
                      <Phone size={16} aria-hidden />
                    </a>
                  ) : null}
                </div>
                <span className={styles.fieldHint}>Business contact number</span>
              </div>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Requested Service</span>
                <span className={styles.fieldValue}>{lead.service || "General inquiry"}</span>
                <span className={styles.fieldHint}>Service category</span>
              </div>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Acquisition Channel</span>
                <span className={styles.fieldValue}>{source}</span>
                <span className={styles.fieldHint}>{lead.source || "Website"}</span>
              </div>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Property Scope</span>
                <span className={styles.fieldValue}>{project.name}</span>
                <span className={styles.fieldHint}>{meta.domain}</span>
              </div>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Form / Page</span>
                <span className={styles.fieldValue}>{lead.formKey || "—"}</span>
                <span className={styles.fieldHint}>{lead.sourcePage || "—"}</span>
              </div>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Lead Type</span>
                <span className={styles.fieldValue}>{lead.type || lead.source || "—"}</span>
                <span className={styles.fieldHint}>Source classification</span>
              </div>
              <div className={styles.fieldBox}>
                <span className={styles.fieldLabel}>Created</span>
                <span className={styles.fieldValue}>{formatDate(lead.createdAt)}</span>
                <span className={styles.fieldHint}>{formatRelativeTime(lead.createdAt)}</span>
              </div>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIcon}>
                  <Snowflake size={22} aria-hidden />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Cargo & Transport Requirements</h2>
                  <p className={styles.cardSubtitle}>Service scope and routing context from submission</p>
                </div>
              </div>
              {lead.service ? (
                <span className={styles.serviceBadge}>
                  <Snowflake size={16} aria-hidden />
                  {lead.service}
                </span>
              ) : null}
            </div>

            <div className={styles.servicePanel}>
              <div className={styles.serviceTitle}>
                <Route size={18} aria-hidden />
                <span>{lead.service || "General logistics inquiry"}</span>
              </div>
              {lead.sourcePage ? (
                <p className={styles.serviceMeta}>
                  Submitted from page: <strong>{lead.sourcePage}</strong>
                </p>
              ) : null}
              {lead.message ? (
                <p className={styles.serviceMeta}>{lead.message}</p>
              ) : (
                <p className={styles.serviceMeta}>No additional transport details were provided.</p>
              )}
            </div>

            <div className={styles.specGrid}>
              <div className={styles.specBox}>
                <span className={styles.fieldLabel}>Service Requested</span>
                <span className={styles.fieldValue}>{lead.service || "Not specified"}</span>
              </div>
              <div className={styles.specBox}>
                <span className={styles.fieldLabel}>Submission Source</span>
                <span className={styles.fieldValue}>{source}</span>
              </div>
            </div>
          </section>

          {lead.message ? (
            <section className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleWrap}>
                  <div className={styles.cardIcon}>
                    <MessageSquareQuote size={22} aria-hidden />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Customer Message & Instructions</h2>
                    <p className={styles.cardSubtitle}>Original submission message</p>
                  </div>
                </div>
              </div>
              <div className={styles.messageQuote}>{lead.message}</div>
            </section>
          ) : null}

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIcon}>
                  <History size={22} aria-hidden />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Audit Trail & Processing Events</h2>
                  <p className={styles.cardSubtitle}>Automated ledger from lead lifecycle</p>
                </div>
              </div>
              <span className={styles.cardBadge}>{timeline.length} Events Recorded</span>
            </div>

            <div className={styles.timeline}>
              {timeline.map((event) => (
                <div key={`${event.title}-${event.time}`} className={styles.timelineItem}>
                  <span
                    className={`${styles.timelineDot} ${
                      event.dot === "secondary"
                        ? styles.dotSecondary
                        : event.dot === "primary"
                          ? styles.dotPrimary
                          : styles.dotMuted
                    }`}
                    aria-hidden
                  />
                  <div className={styles.timelineHead}>
                    <span className={styles.timelineTitle}>{event.title}</span>
                    <span className={styles.timelineTime}>{formatDate(event.time)}</span>
                  </div>
                  <p className={styles.timelineBody}>{event.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.fieldLabel}>Operational Pipeline</span>
              <span className={styles.fieldHint}>{reference}</span>
            </div>

            <div className={styles.statusHero}>
              <div className={styles.statusHeroLeft}>
                {lead.status === "NEW" ? (
                  <span className={styles.pulseDot} aria-hidden />
                ) : null}
                <div>
                  <span className={styles.statusHeroTitle}>
                    {lead.status.replace(/_/g, " ")} INQUIRY
                  </span>
                  <span className={styles.statusHeroHint}>
                    Received {formatRelativeTime(lead.createdAt)}
                  </span>
                </div>
              </div>
              <span className={styles.stageBadge}>{statusStage(status)}</span>
            </div>

            <LeadsStatusBadge status={status} />

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="lead-status">
                Change Pipeline Status
              </label>
              <select
                id="lead-status"
                className={styles.select}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel} htmlFor="internal-notes">
                Internal Dispatch Notes
              </label>
              <textarea
                id="internal-notes"
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal notes for dispatchers..."
              />
            </div>

            <button
              type="button"
              className={styles.primaryButton}
              disabled={pending}
              onClick={saveStatus}
            >
              <CheckCircle2 size={20} aria-hidden />
              {pending ? "Saving…" : "Update Status & Save"}
            </button>
            <button type="button" className={styles.secondaryButton} disabled title="Coming soon">
              <Send size={20} aria-hidden />
              Send Quote Directly
            </button>

            {feedback && feedback.includes("Failed") ? (
              <p className={`${styles.feedback} ${styles.feedbackError}`}>{feedback}</p>
            ) : null}
            {feedback && !feedback.includes("Failed") ? (
              <ToastNotification
                variant="success"
                title="Lead status updated"
                meta={`Reference: ${reference}`}
              />
            ) : null}

            <div className={styles.formGroup}>
              <span className={styles.formLabel}>Quick Actions</span>
              <div className={styles.quickActions}>
                <button type="button" className={styles.quickAction} disabled title="Coming soon">
                  <Mail size={20} aria-hidden />
                  Email
                </button>
                <button type="button" className={styles.quickAction} disabled title="Coming soon">
                  <Phone size={20} aria-hidden />
                  Log Call
                </button>
                <button type="button" className={styles.quickAction} disabled title="Coming soon">
                  <MessageSquareQuote size={20} aria-hidden />
                  Chatbot
                </button>
              </div>
              <p className={styles.fieldHint}>
                Last updated {formatRelativeTime(lead.updatedAt || lead.createdAt)}.
              </p>
            </div>
          </section>

          <section className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleWrap}>
                <div className={styles.cardIcon}>
                  <Route size={20} aria-hidden />
                </div>
                <div>
                  <h2 className={styles.cardTitle}>Lead Summary</h2>
                  <p className={styles.cardSubtitle}>At-a-glance operational context</p>
                </div>
              </div>
            </div>
            <div className={styles.metaCard}>
              <div className={styles.metaRow}>
                <span className={styles.fieldLabel}>Current Status</span>
                <span className={styles.metaValue}>{status.replace(/_/g, " ")}</span>
              </div>
              <p className={styles.metaHint}>
                Source: {source}
                {lead.sourcePage ? ` • Page: ${lead.sourcePage}` : ""}
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
