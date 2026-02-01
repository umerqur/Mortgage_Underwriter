// Canonical underwriting model — independent of any CRM or export format.
// Documents populate this model. Export adapters read from it.
//
// This model stores ONLY underwriting facts. It does NOT store document
// metadata such as upload IDs, document IDs, document types, or labels.
// That data belongs to the extraction result (stored per-upload in
// intake_uploads.extracted_json).

// ---------------------------------------------------------------------------
// Canonical profile — the system of truth
// ---------------------------------------------------------------------------

export interface UnderwritingProfile {
  borrower: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
    sinLast4?: string;
    email?: string;
  };

  income: {
    employment?: {
      annualIncome?: number;
      netIncome?: number;
      taxableIncome?: number;
      sourceDocuments: string[];
    };

    selfEmployment?: {
      netIncome?: number;
      taxableIncome?: number;
      sourceDocuments: string[];
    };
  };

  metadata: {
    lastUpdatedAt: string;
  };
}

// ---------------------------------------------------------------------------
// Transient extraction result — stored in intake_uploads.extracted_json,
// NOT persisted inside UnderwritingProfile.
// ---------------------------------------------------------------------------

export interface DocumentExtractionResult {
  documentType: string; // 'noa' | 't1_general' | 'other'
  documentLabel: string; // Human-readable: "NOA", "T1 General", etc.
  taxYear: number | null;
  totalIncome: number | null;
  netIncome: number | null;
  taxableIncome: number | null;
  taxpayerName: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function createEmptyProfile(
  firstName: string,
  lastName: string,
  email?: string | null,
): UnderwritingProfile {
  return {
    borrower: {
      firstName,
      lastName,
      email: email ?? undefined,
    },
    income: {},
    metadata: {
      lastUpdatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Merge an extraction result into the canonical profile.
 *
 * Phase 1 merge rule:
 *   The latest extraction FULLY OVERWRITES existing income values.
 *   No averaging. No reconciliation. No conflict resolution.
 *   sourceDocuments is set to the single source that produced the current values.
 *
 * This will be revisited when multi-document reconciliation is needed.
 */
export function mergeExtraction(
  profile: UnderwritingProfile,
  extraction: DocumentExtractionResult,
): UnderwritingProfile {
  const income = { ...profile.income };

  const hasIncomeValues =
    extraction.totalIncome != null ||
    extraction.netIncome != null ||
    extraction.taxableIncome != null;

  if (hasIncomeValues) {
    const sourceLabel = extraction.documentLabel +
      (extraction.taxYear ? ` (${extraction.taxYear})` : '');

    income.employment = {
      annualIncome: extraction.totalIncome ?? undefined,
      netIncome: extraction.netIncome ?? undefined,
      taxableIncome: extraction.taxableIncome ?? undefined,
      sourceDocuments: [sourceLabel],
    };
  }

  return {
    ...profile,
    income,
    metadata: {
      lastUpdatedAt: new Date().toISOString(),
    },
  };
}
