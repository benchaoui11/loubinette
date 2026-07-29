import type { AttributionSummary } from "@/lib/sites/site-attribution";

export type SiteStatus = "live" | "planned" | "paused" | "archived";

export type ManagedSite = {
  id: string;
  siteKey: string;
  name: string;
  domain: string;
  status: SiteStatus;
  logo: string;
  color: string;
  currency: string;
  timezone: string;
  hasOfferPage: boolean;
  hasWhitePage: boolean;
  hasPageSwitching: boolean;
  hasDocuments: boolean;
  hasVisitors: boolean;
  hasOrders: boolean;
  hasApplications: boolean;
  analyticsEnabled: boolean;
};

export type ApplicationStatus =
  | "submitted"
  | "under_review"
  | "documents_accepted"
  | "paid"
  | "processing"
  | "delivered"
  | "cancelled"
  | "rejected"
  | string;

export type FirstIdpApplication = {
  id?: string;
  site_id?: string | null;
  ref: string | null;
  order_number: number | null;
  status: ApplicationStatus | null;
  format: string | null;
  validity_years: number | null;
  destination_country: string | null;
  total: number | null;
  currency: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  vip_processing?: boolean | null;
  group_ref: string | null;
  is_companion: boolean | null;
  file_selfie: string | null;
  file_license_front: string | null;
  file_license_back: string | null;
  file_signature: string | null;
  created_at: string | null;
};

export type VisitorRecord = {
  id?: number;
  site_id?: string | null;
  created_at: string | null;
  session_id: string | null;
  site_mode_at_visit: string | null;
  country: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  referrer: string | null;
  landing_page: string | null;
};

export type DocumentFileField =
  | "file_selfie"
  | "file_license_front"
  | "file_license_back"
  | "file_signature";

export type TimeSeriesPoint = {
  date: string;
  current: number;
  previous?: number;
};

export type DashboardMetrics = {
  totalApplications: number;
  applicationGroups: number;
  applicationsToday: number;
  applicationsThisMonth: number;
  pendingReview: number;
  documentsAccepted: number;
  processing: number;
  delivered: number;
  rejected: number;
  submittedValue: number;
  manuallyMarkedPaidValue: number;
  confirmedRevenueAvailable: false;
  averageSubmittedValue: number;
  visitors: number;
  uniqueVisitors: number | null;
  conversionRate: number | null;
  documentCompletionRate: number;
};

export type ReadOnlyDashboardData = {
  site: ManagedSite;
  generatedAt: string;
  connected: boolean;
  error?: string;
  metrics: DashboardMetrics;
  applications: FirstIdpApplication[];
  visitors: VisitorRecord[];
  applicationsByDay: TimeSeriesPoint[];
  visitorsByDay: TimeSeriesPoint[];
  statusBreakdown: { status: string; count: number }[];
  documentRows: {
    applicationId: string | null;
    applicationRef: string;
    applicant: string;
    documentsUploaded: number;
    documentsExpected: number;
    storagePathsPresent: boolean;
    documents: {
      type: DocumentFileField;
      label: string;
      available: boolean;
    }[];
  }[];
  attributionSummary: AttributionSummary[];
};
