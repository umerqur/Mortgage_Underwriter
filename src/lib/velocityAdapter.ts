// Velocity CRM adapter — maps canonical UnderwritingProfile to Velocity Deal In schema.
// All Velocity-specific enums and types live in this file only.

import type { Intake } from './types';
import type { UnderwritingProfile } from './underwritingProfile';

// ---------------------------------------------------------------------------
// Velocity enums
// ---------------------------------------------------------------------------

export const VelocityIncomeType = {
  EMPLOYMENT: 'EMPLOYMENT',
  SELF_EMPLOYMENT: 'SELF_EMPLOYMENT',
  RENTAL: 'RENTAL',
  OTHER: 'OTHER',
} as const;

export const VelocityTransactionType = {
  PURCHASE: 'PURCHASE',
  RENEWAL_REFINANCE: 'RENEWAL_REFINANCE',
} as const;

export const VelocityDocumentStatus = {
  UPLOADED: 'UPLOADED',
  MISSING: 'MISSING',
} as const;

// ---------------------------------------------------------------------------
// Velocity Deal In types
// ---------------------------------------------------------------------------

export interface VelocityIncome {
  incomeType: string;
  annualIncome: number | null;
  netIncome: number | null;
  taxableIncome: number | null;
  sourceDocuments: string[];
}

export interface VelocityApplicant {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  sinLast4: string | null;
  incomes: VelocityIncome[];
}

export interface VelocityDocument {
  name: string;
  category: string;
  status: string;
}

export interface VelocityDealPayload {
  deal: {
    referenceNumber: string;
    transactionType: string;
    brokerName: string;
    applicants: VelocityApplicant[];
    documents: VelocityDocument[];
    createdAt: string;
  };
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function mapTransactionType(formType: string): string {
  switch (formType) {
    case 'purchase_resale':
    case 'purchase_new':
      return VelocityTransactionType.PURCHASE;
    case 'renewal_refinance':
      return VelocityTransactionType.RENEWAL_REFINANCE;
    default:
      return formType.toUpperCase();
  }
}

function buildIncomes(profile: UnderwritingProfile | null): VelocityIncome[] {
  if (!profile) return [];

  const incomes: VelocityIncome[] = [];

  if (profile.income.employment) {
    const emp = profile.income.employment;
    incomes.push({
      incomeType: VelocityIncomeType.EMPLOYMENT,
      annualIncome: emp.annualIncome ?? null,
      netIncome: emp.netIncome ?? null,
      taxableIncome: emp.taxableIncome ?? null,
      sourceDocuments: emp.sourceDocuments,
    });
  }

  if (profile.income.selfEmployment) {
    const se = profile.income.selfEmployment;
    incomes.push({
      incomeType: VelocityIncomeType.SELF_EMPLOYMENT,
      annualIncome: null,
      netIncome: se.netIncome ?? null,
      taxableIncome: se.taxableIncome ?? null,
      sourceDocuments: se.sourceDocuments,
    });
  }

  return incomes;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function toVelocityDeal(
  intake: Intake,
  uploadedDocIds: Set<string>,
): VelocityDealPayload {
  const profile = intake.underwriting_profile;

  const applicant: VelocityApplicant = {
    firstName: profile?.borrower.firstName ?? intake.client_first_name,
    lastName: profile?.borrower.lastName ?? intake.client_last_name,
    email: intake.client_email,
    phone: intake.client_phone,
    dateOfBirth: profile?.borrower.dateOfBirth ?? null,
    sinLast4: profile?.borrower.sinLast4 ?? null,
    incomes: buildIncomes(profile),
  };

  const documents: VelocityDocument[] = intake.required_docs.map((d) => ({
    name: d.name,
    category: d.category,
    status: uploadedDocIds.has(d.id)
      ? VelocityDocumentStatus.UPLOADED
      : VelocityDocumentStatus.MISSING,
  }));

  return {
    deal: {
      referenceNumber: intake.id,
      transactionType: mapTransactionType(
        intake.form_answers.transactionType,
      ),
      brokerName: intake.broker_name,
      applicants: [applicant],
      documents,
      createdAt: intake.created_at,
    },
  };
}
