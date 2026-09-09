import { Bot, Mail, Snowflake, Truck, Zap } from "lucide-react";
import type { UnifiedLead } from "@/lib/adapters/types";
import {
  LEAD_STATUS_OPTIONS,
  StatusBadge,
} from "@/components/system";

export const STATUS_OPTIONS = LEAD_STATUS_OPTIONS;

export function LeadsStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}

export function sourceLabel(lead: UnifiedLead) {
  if (lead.formKey) return lead.formKey.replace(/[-_]/g, " ");
  if (lead.source === "CHATBOT") return "Chatbot Transfer";
  if (lead.source) return lead.source;
  return "Web Form";
}

export function serviceIcon(service: string) {
  const value = service.toLowerCase();
  if (value.includes("kühl") || value.includes("cold") || value.includes("frigo")) {
    return <Snowflake size={16} color="var(--dash-primary-container)" aria-hidden />;
  }
  if (value.includes("express") || value.includes("kurier") || value.includes("courier")) {
    return <Zap size={16} color="var(--dash-secondary)" aria-hidden />;
  }
  if (value.includes("chatbot") || value.includes("bot")) {
    return <Bot size={16} color="var(--dash-primary-container)" aria-hidden />;
  }
  return <Truck size={16} color="var(--dash-primary-container)" aria-hidden />;
}

export function leadReference(projectSlug: string, leadId: string) {
  const suffix = leadId.replace(/\D/g, "").slice(-4) || leadId.slice(-4).toUpperCase();
  const prefix = projectSlug.split("-").map((part) => part[0]?.toUpperCase() ?? "").join("");
  return `#${prefix}-${suffix}`;
}
