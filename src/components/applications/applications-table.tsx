"use client";

import { ChevronDown, ExternalLink, FileImage, Loader2, LockKeyhole, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, fullName, maskEmail } from "@/lib/utils/format";
import type { ApplicationStatus, DocumentFileField, FirstIdpApplication } from "@/types/firstidp";

const APPLICATION_STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "rejected", label: "Rejected" },
];

type StatusFeedback = {
  type: "success" | "error";
  message: string;
};

type StatusPayload = {
  status?: ApplicationStatus | null;
  changed?: boolean;
  error?: string;
};

export function ApplicationsTable({ applications, highlightRef }: { applications: FirstIdpApplication[]; highlightRef?: string | null }) {
  const router = useRouter();
  const normalizedHighlight = highlightRef?.toLowerCase();
  const [rows, setRows] = useState(applications);
  const [expandedRef, setExpandedRef] = useState<string | null>(highlightRef ?? null);
  const [modalApplication, setModalApplication] = useState<FirstIdpApplication | null>(null);
  const [savingApplicationId, setSavingApplicationId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<Record<string, StatusFeedback>>({});

  useEffect(() => {
    setRows(applications);
  }, [applications]);

  function toggleExpanded(app: FirstIdpApplication) {
    const key = app.ref ?? app.id ?? null;
    if (!key) return;
    setExpandedRef((current) => current === key ? null : key);
  }

  async function updateApplicationStatus(app: FirstIdpApplication, nextStatus: ApplicationStatus) {
    if (!app.id) {
      const key = app.ref ?? "unknown";
      setStatusFeedback((current) => ({
        ...current,
        [key]: { type: "error", message: "This application cannot be updated until its database ID is available." },
      }));
      return;
    }

    if (savingApplicationId || app.status === nextStatus) return;

    setSavingApplicationId(app.id);
    setStatusFeedback((current) => {
      const next = { ...current };
      delete next[app.id as string];
      return next;
    });

    try {
      const response = await fetch(`/api/applications/${encodeURIComponent(app.id)}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reference: app.ref,
          siteId: app.site_id,
        }),
        cache: "no-store",
      });
      const payload = (await response.json()) as StatusPayload;

      if (!response.ok || !payload.status) {
        throw new Error(payload.error || "Application status could not be updated.");
      }

      setRows((currentRows) => currentRows.map((row) => row.id === app.id ? { ...row, status: payload.status ?? nextStatus } : row));
      setStatusFeedback((current) => ({
        ...current,
        [app.id as string]: {
          type: "success",
          message: payload.changed === false ? "Status was already up to date." : "Application status updated.",
        },
      }));
      router.refresh();
    } catch (error) {
      setStatusFeedback((current) => ({
        ...current,
        [app.id as string]: {
          type: "error",
          message: error instanceof Error ? error.message : "Application status could not be updated.",
        },
      }));
    } finally {
      setSavingApplicationId(null);
    }
  }

  return (
    <>
    <div className="table-wrap">
      <div className="table-scroll-x">
      <table className="min-w-[72rem]">
        <thead>
          <tr>
            <th className="w-[3rem]" aria-label="Expand" />
            <th>Reference</th>
            <th>Applicant</th>
            <th>Email</th>
            <th>Format</th>
            <th>Validity</th>
            <th>Destination</th>
            <th>Submitted value</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((app) => {
            const isHighlighted = Boolean(normalizedHighlight && app.ref?.toLowerCase() === normalizedHighlight);
            const rowKey = app.ref ?? app.id ?? `${app.email}-${app.created_at}`;
            const isExpanded = expandedRef === rowKey || Boolean(app.ref && expandedRef === app.ref);
            const feedbackKey = app.id ?? app.ref ?? rowKey;
            return (
              <Fragment key={rowKey}>
                <tr
                  id={app.ref ? `application-${app.ref}` : undefined}
                  data-highlighted={isHighlighted}
                  className="cursor-pointer"
                  onClick={() => toggleExpanded(app)}
                >
                  <td>
                    <button
                      className="cc-icon-button grid size-8 place-items-center rounded-lg"
                      type="button"
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} application details`}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleExpanded(app);
                      }}
                    >
                      <ChevronDown className={`size-4 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  </td>
                  <td className="mono text-blue-100">
                    <button
                      className="text-left hover:underline"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleExpanded(app);
                      }}
                    >
                      {app.ref ?? "No ref"}
                    </button>
                  </td>
                  <td>
                    <div className="font-medium text-slate-100">{fullName(app.first_name, app.last_name)}</div>
                    {app.is_companion ? <div className="text-xs text-slate-500">Travel companion</div> : null}
                  </td>
                  <td>{maskEmail(app.email)}</td>
                  <td className="capitalize">{app.format?.replace("_", " ") ?? "Unknown"}</td>
                  <td>{app.validity_years ? `${app.validity_years} years` : "Unknown"}</td>
                  <td>{app.destination_country ?? "Unknown"}</td>
                  <td>{formatCurrency(Number(app.total) || 0, app.currency ?? "USD")}</td>
                  <td><StatusBadge status={app.status} /></td>
                  <td>{app.created_at ? new Date(app.created_at).toLocaleDateString() : "Unknown"}</td>
                </tr>
                {isExpanded ? (
                  <tr className="application-detail-row">
                    <td colSpan={10}>
                      <ApplicationDetails
                        app={app}
                        feedback={statusFeedback[feedbackKey]}
                        saving={savingApplicationId === app.id}
                        onStatusChange={(status) => void updateApplicationStatus(app, status)}
                        onViewDocuments={() => setModalApplication(app)}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
    {modalApplication ? <DocumentsModal application={modalApplication} onClose={() => setModalApplication(null)} /> : null}
    </>
  );
}

function ApplicationDetails({
  app,
  feedback,
  saving,
  onStatusChange,
  onViewDocuments,
}: {
  app: FirstIdpApplication;
  feedback?: StatusFeedback;
  saving: boolean;
  onStatusChange: (status: ApplicationStatus) => void;
  onViewDocuments: () => void;
}) {
  return (
    <div className="application-detail-panel rounded-xl p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <DetailItem label="Applicant" value={fullName(app.first_name, app.last_name)} />
          <DetailItem label="Phone" value={app.phone || "Unavailable"} />
          <DetailItem label="Destination country" value={app.destination_country || "Unknown"} />
          <DetailItem label="Fast processing" value={app.vip_processing ? "Enabled" : "Not selected"} />
          <StatusSelector app={app} saving={saving} onStatusChange={onStatusChange} />
        </div>
        <button className="cc-primary-button inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium" type="button" onClick={onViewDocuments}>
          <FileImage className="size-4" aria-hidden="true" />
          View Documents
        </button>
      </div>
      {feedback ? (
        <p className={`mt-4 rounded-lg border px-3 py-2 text-sm ${feedback.type === "success" ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" : "border-rose-400/30 bg-rose-400/10 text-rose-100"}`}>
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}

function StatusSelector({ app, saving, onStatusChange }: { app: FirstIdpApplication; saving: boolean; onStatusChange: (status: ApplicationStatus) => void }) {
  const currentStatus = app.status ?? "submitted";
  const hasLegacyStatus = !APPLICATION_STATUS_OPTIONS.some((option) => option.value === currentStatus);

  return (
    <label className="grid gap-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">Status</span>
      <span className="relative">
        <select
          className="cc-input h-10 w-full rounded-lg px-3 pr-9 text-sm capitalize disabled:cursor-not-allowed disabled:opacity-70"
          value={currentStatus}
          disabled={saving}
          aria-label="Application status"
          onChange={(event) => onStatusChange(event.target.value as ApplicationStatus)}
        >
          {hasLegacyStatus ? (
            <option value={currentStatus} disabled>
              {currentStatus.replaceAll("_", " ")}
            </option>
          ) : null}
          {APPLICATION_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {saving ? <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-500" aria-hidden="true" /> : null}
      </span>
    </label>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-500/20 bg-slate-950/30 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-medium text-slate-100" title={value}>{value}</div>
    </div>
  );
}

const DOCUMENTS: { type: DocumentFileField; label: string }[] = [
  { type: "file_license_front", label: "Driver license — front" },
  { type: "file_license_back", label: "Driver license — back" },
  { type: "file_selfie", label: "Personal photo" },
  { type: "file_signature", label: "Signature" },
];

type DocumentUrlState = Record<DocumentFileField, { loading: boolean; url: string | null; error: string | null }>;

function initialDocumentState(): DocumentUrlState {
  return {
    file_license_front: { loading: false, url: null, error: null },
    file_license_back: { loading: false, url: null, error: null },
    file_selfie: { loading: false, url: null, error: null },
    file_signature: { loading: false, url: null, error: null },
  };
}

function DocumentsModal({ application, onClose }: { application: FirstIdpApplication; onClose: () => void }) {
  const [documents, setDocuments] = useState<DocumentUrlState>(() => initialDocumentState());

  useEffect(() => {
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;

    async function loadDocument(type: DocumentFileField) {
      if (!application.id || !application[type]) {
        setDocuments((current) => ({ ...current, [type]: { loading: false, url: null, error: "Not uploaded" } }));
        return;
      }

      setDocuments((current) => ({ ...current, [type]: { loading: true, url: null, error: null } }));
      try {
        const response = await fetch(`/api/documents/${encodeURIComponent(application.id)}/signed-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentType: type }),
          cache: "no-store",
        });
        const payload = (await response.json()) as { signedUrl?: string; error?: string };
        if (!response.ok || !payload.signedUrl) throw new Error(payload.error || "Could not load preview.");
        if (!cancelled) setDocuments((current) => ({ ...current, [type]: { loading: false, url: payload.signedUrl ?? null, error: null } }));
      } catch (error) {
        if (!cancelled) {
          setDocuments((current) => ({
            ...current,
            [type]: { loading: false, url: null, error: error instanceof Error ? error.message : "Could not load preview." },
          }));
        }
      }
    }

    DOCUMENTS.forEach((document) => void loadDocument(document.type));
    return () => {
      cancelled = true;
    };
  }, [application]);

  return (
    <div className="modal-overlay fixed inset-0 z-[90] flex items-center justify-center px-4 py-8" role="dialog" aria-modal="true" aria-label="Uploaded documents">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="Close uploaded documents" onClick={onClose} />
      <div className="modal-panel relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-500/20 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Uploaded documents</h2>
            <p className="mono mt-1 text-sm text-slate-400">{application.ref ?? "No reference"}</p>
          </div>
          <button className="cc-icon-button grid size-9 place-items-center rounded-lg" type="button" onClick={onClose} aria-label="Close modal">
            <X className="size-4" />
          </button>
        </div>
        <div className="modal-scroll grid gap-4 overflow-y-auto p-5 md:grid-cols-2">
          {DOCUMENTS.map((document) => (
            <DocumentPreviewCard key={document.type} label={document.label} state={documents[document.type]} signature={document.type === "file_signature"} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DocumentPreviewCard({ label, state, signature }: { label: string; state: { loading: boolean; url: string | null; error: string | null }; signature: boolean }) {
  return (
    <section className="document-preview-card rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        {state.url ? (
          <a className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-100 hover:underline" href={state.url} target="_blank" rel="noopener noreferrer">
            Open full size
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </div>
      <div className={`document-preview-frame grid aspect-[4/3] place-items-center overflow-hidden rounded-lg ${signature ? "document-preview-signature" : ""}`}>
        {state.loading ? (
          <Loader2 className="size-6 animate-spin text-slate-500" aria-hidden="true" />
        ) : state.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.url} alt={`${label} preview`} className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-sm text-slate-400">
            <LockKeyhole className="size-5" aria-hidden="true" />
            <span>{state.error ?? "Preview unavailable"}</span>
          </div>
        )}
      </div>
    </section>
  );
}
