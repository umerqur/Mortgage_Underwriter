// Canonical underwriting model — independent of any CRM or export format.
// Documents populate this model. Export adapters read from it.

export interface TaxDocumentExtraction {
  uploadId: string;
  docId: string;
  documentType: string; // 'noa' | 't1_general' | 'other'
  documentLabel: string; // Human-readable: "NOA", "T1 General", etc.
  taxYear: number | null;
  totalIncome: number | null;
  netIncome: number | null;
  taxableIncome: number | null;
  taxpayerName: string | null;
}

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

  extractedDocuments: TaxDocumentExtraction[];

  metadata: {
    lastUpdatedAt: string;
  };
}

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
    extractedDocuments: [],
    metadata: {
      lastUpdatedAt: new Date().toISOString(),
    },
  };
}

export function mergeExtraction(
  profile: UnderwritingProfile,
  extraction: TaxDocumentExtraction,
): UnderwritingProfile {
  // Replace any previous extraction for the same upload
  const otherDocs = profile.extractedDocuments.filter(
    (d) => d.uploadId !== extraction.uploadId,
  );
  const allExtractions = [...otherDocs, extraction];

  // Rebuild income from most recent tax year extraction
  const incomeExtractions = allExtractions
    .filter(
      (d) =>
        d.totalIncome != null ||
        d.netIncome != null ||
        d.taxableIncome != null,
    )
    .sort((a, b) => (b.taxYear ?? 0) - (a.taxYear ?? 0));

  const income = { ...profile.income };

  if (incomeExtractions.length > 0) {
    const latest = incomeExtractions[0];
    income.employment = {
      annualIncome: latest.totalIncome ?? undefined,
      netIncome: latest.netIncome ?? undefined,
      taxableIncome: latest.taxableIncome ?? undefined,
      sourceDocuments: incomeExtractions.map(
        (e) => `${e.documentLabel}${e.taxYear ? ` (${e.taxYear})` : ''}`,
      ),
    };
  }

  return {
    ...profile,
    income,
    extractedDocuments: allExtractions,
    metadata: {
      lastUpdatedAt: new Date().toISOString(),
    },
  };
}
