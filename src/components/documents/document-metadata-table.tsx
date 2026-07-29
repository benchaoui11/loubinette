"use client";

import type { ReadOnlyDashboardData } from "@/types/firstidp";

export function DocumentMetadataTable({ rows }: { rows: ReadOnlyDashboardData["documentRows"] }) {
  return (
    <div className="table-wrap">
      <div className="table-scroll-x">
        <table className="min-w-[44rem]">
          <thead>
            <tr>
              <th className="w-[15rem]">Application</th>
              <th className="w-[17rem]">Applicant</th>
              <th className="w-[12rem]">Document state</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.applicationRef}>
                <td className="mono text-blue-100">
                  <a className="hover:underline" href={`/applications?highlight=${encodeURIComponent(row.applicationRef)}#application-${encodeURIComponent(row.applicationRef)}`}>
                    {row.applicationRef}
                  </a>
                </td>
                <td className="font-medium text-slate-100">{row.applicant}</td>
                <td className="whitespace-nowrap">{row.documentsUploaded} of {row.documentsExpected} documents uploaded</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
