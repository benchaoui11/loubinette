"use client";

import { ExternalLink, Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { ReadOnlyDashboardData } from "@/types/firstidp";

type DocumentRow = ReadOnlyDashboardData["documentRows"][number];

type RequestState = {
  key: string | null;
  message: string | null;
  error: string | null;
};

const INITIAL_STATE: RequestState = { key: null, message: null, error: null };

export function DocumentMetadataTable({ rows }: { rows: ReadOnlyDashboardData["documentRows"] }) {
  const [requestState, setRequestState] = useState<RequestState>(INITIAL_STATE);

  async function viewDocument(row: DocumentRow, document: DocumentRow["documents"][number]) {
    if (!row.applicationId) {
      setRequestState({ key: null, message: null, error: "This application cannot be opened until its secure document ID is available." });
      return;
    }

    const key = `${row.applicationId}:${document.type}`;
    setRequestState({ key, message: null, error: null });

    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(row.applicationId)}/signed-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: document.type }),
        cache: "no-store",
      });
      const payload = (await response.json()) as { signedUrl?: string; expiresIn?: number; error?: string };

      if (!response.ok || !payload.signedUrl) {
        throw new Error(payload.error || "Could not open this document.");
      }

      window.open(payload.signedUrl, "_blank", "noopener,noreferrer");
      setRequestState({
        key,
        message: `Authorized link opened. It expires in ${payload.expiresIn ?? 60} seconds; use View document again to regenerate it.`,
        error: null,
      });
    } catch (error) {
      setRequestState({
        key,
        message: null,
        error: error instanceof Error ? error.message : "Could not open this document.",
      });
    }
  }

  return (
    <div className="space-y-3">
      {requestState.error ? (
        <p className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
          {requestState.error}
        </p>
      ) : null}
      {requestState.message ? (
        <p className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100">
          {requestState.message}
        </p>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Application</th>
              <th>Applicant</th>
              <th>Document state</th>
              <th>Access</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.applicationRef}>
                <td className="mono text-blue-100">{row.applicationRef}</td>
                <td>{row.applicant}</td>
                <td>{row.documentsUploaded} of {row.documentsExpected} documents uploaded</td>
                <td>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {row.documents.map((document) => {
                      const key = `${row.applicationId}:${document.type}`;
                      const isLoading = requestState.key === key && !requestState.message && !requestState.error;
                      const disabled = !document.available || !row.applicationId || isLoading;
                      return (
                        <div
                          key={document.type}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-500/20 bg-slate-950/30 px-2.5 py-2"
                        >
                          <span className="text-xs text-slate-200">{document.label}</span>
                          <button
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/25 bg-blue-300/10 px-2.5 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-300/15 disabled:cursor-not-allowed disabled:border-slate-500/20 disabled:bg-slate-400/10 disabled:text-slate-400"
                            type="button"
                            disabled={disabled}
                            onClick={() => viewDocument(row, document)}
                            title={document.available ? `Generate a fresh signed link for ${document.label}` : `${document.label} is not uploaded`}
                          >
                            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : document.available ? <ExternalLink className="size-3.5" /> : <LockKeyhole className="size-3.5" />}
                            <span>{document.available ? "View document" : "Not uploaded"}</span>
                            {document.available ? <RefreshCw className="size-3" aria-hidden="true" /> : null}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
