import type { Document } from '../lib/types';

// =============================================================================
// DOCUMENTS REGISTRY
// Using stable IDs - no auto-generation from names
// Document text matches spreadsheet exactly (including typos like "Amendements", "Interem")
// =============================================================================

export const documentsRegistry: Record<string, Document> = {
  // Transaction Documents - Purchase Resale
  doc_aps: {
    id: 'doc_aps',
    name: 'Agreement of Purchase of Sale',
    category: 'transaction',
  },
  doc_mls: {
    id: 'doc_mls',
    name: 'MLS Listing',
    category: 'transaction',
  },
  doc_amendments: {
    id: 'doc_amendments',
    name: 'All Amendments',
    category: 'transaction',
  },

  // Transaction Documents - Purchase New
  doc_amendments_waivers: {
    id: 'doc_amendments_waivers',
    name: 'All Amendements and Waivers',
    category: 'transaction',
  },
  doc_interim_adjustments: {
    id: 'doc_interim_adjustments',
    name: 'Interem Statement of Adjustments',
    category: 'transaction',
  },
  doc_deposits: {
    id: 'doc_deposits',
    name: 'Copy of all deposits',
    category: 'transaction',
  },

  // Down Payment Documents
  doc_dp_90day: {
    id: 'doc_dp_90day',
    name: 'Down Payment (90 Day Bank Statement)',
    category: 'transaction',
  },
  doc_dp_bank_stmt: {
    id: 'doc_dp_bank_stmt',
    name: 'Down Payment (Bank Statement)',
    category: 'transaction',
  },
  doc_gift_letter: {
    id: 'doc_gift_letter',
    name: 'Gift Letter',
    category: 'transaction',
  },

  // Transaction Documents - Renewal/Refinance
  doc_mortgage_stmt: {
    id: 'doc_mortgage_stmt',
    name: 'Mortgage Statements',
    category: 'transaction',
  },
  doc_property_tax: {
    id: 'doc_property_tax',
    name: 'Property Tax Statements',
    category: 'transaction',
  },

  // Property Documents - Condo
  doc_condo_fee: {
    id: 'doc_condo_fee',
    name: 'Condo Fee Confirmation',
    category: 'property',
  },
  doc_lease_bank_stmt: {
    id: 'doc_lease_bank_stmt',
    name: 'Lease Agreement & Bank Statements',
    category: 'property',
  },

  // Income Documents - Employed
  doc_t4_2yr: {
    id: 'doc_t4_2yr',
    name: 'T4 (Past 2 Years)',
    category: 'income',
  },
  doc_noas_2yr: {
    id: 'doc_noas_2yr',
    name: 'NOAs (Past 2 Years)',
    category: 'income',
  },
  doc_job_letter: {
    id: 'doc_job_letter',
    name: 'Job Letter',
    category: 'income',
  },
  doc_paystubs: {
    id: 'doc_paystubs',
    name: 'Paystubs (Most Recent)',
    category: 'income',
  },

  // Income Documents - Retired
  doc_t4a_retired: {
    id: 'doc_t4a_retired',
    name: 'T4A (Most Recent) - CPP, OAS, Pension',
    category: 'income',
  },
  doc_t1_most_recent: {
    id: 'doc_t1_most_recent',
    name: 'T1 General (Most Recent)',
    category: 'income',
  },
  doc_noa_most_recent: {
    id: 'doc_noa_most_recent',
    name: 'NOA (Most Recent)',
    category: 'income',
  },
  doc_bank_stmt_retired: {
    id: 'doc_bank_stmt_retired',
    name: 'Bank Statement',
    category: 'income',
  },

  // Income Documents - Self-Employed (Common)
  doc_t1_2yr: {
    id: 'doc_t1_2yr',
    name: 'T1 General (Past 2 Years)',
    category: 'income',
  },
  doc_business_bank_stmt: {
    id: 'doc_business_bank_stmt',
    name: 'Business Bank Statements (12 Months)',
    category: 'income',
  },

  // Income Documents - Self-Employed (Incorporated)
  doc_articles_inc: {
    id: 'doc_articles_inc',
    name: 'Articles of Incorporation',
    category: 'income',
  },
  doc_t2_2yr: {
    id: 'doc_t2_2yr',
    name: 'T2 (Past 2 Years)',
    category: 'income',
  },
  doc_financial_stmt: {
    id: 'doc_financial_stmt',
    name: 'Financial Statements (Past 2 Years) - CPA Prep',
    category: 'income',
  },

  // Income Documents - Self-Employed (Sole Proprietor)
  doc_business_license: {
    id: 'doc_business_license',
    name: 'Business License',
    category: 'income',
  },

  // Income Documents - Rental
  doc_lease_agreement: {
    id: 'doc_lease_agreement',
    name: 'Lease Agreement',
    category: 'income',
  },
  doc_bank_statements_rental: {
    id: 'doc_bank_statements_rental',
    name: 'Bank Statements',
    category: 'income',
  },
  doc_first_last_deposits: {
    id: 'doc_first_last_deposits',
    name: 'First & Last Deposits (New Lease)',
    category: 'income',
  },
  doc_t1_generals_rental: {
    id: 'doc_t1_generals_rental',
    name: 'T1 Generals',
    category: 'income',
  },

  // Income Documents - Other Income Types
  doc_child_care_benefit: {
    id: 'doc_child_care_benefit',
    name: 'Child Care Benefit (CRA Letter & Bank Statements)',
    category: 'income',
  },
  doc_alimony: {
    id: 'doc_alimony',
    name: 'Alimony (Bank Statements & Separation Agreement)',
    category: 'income',
  },
  doc_investment_income: {
    id: 'doc_investment_income',
    name: 'Investment Income (2 Years Full T1 Generals or T5s and NOAs)',
    category: 'income',
  },
  doc_disability: {
    id: 'doc_disability',
    name: 'Disability Income (T1 General, T4A, Letter)',
    category: 'income',
  },
  doc_survivors_pension: {
    id: 'doc_survivors_pension',
    name: "Survivor's Pension (T1 General / T4A / Letter)",
    category: 'income',
  },
  doc_maternity_leave: {
    id: 'doc_maternity_leave',
    name: 'Maternity Leave Income (Job Letter w Return Date & last full paystub before Leave)',
    category: 'income',
  },

  // Net Worth Documents
  doc_rrsp_stmt: {
    id: 'doc_rrsp_stmt',
    name: 'RRSP Statement',
    category: 'net_worth',
    note: 'BMO, SCOTIA (12 months) | Other Lenders (90 days)',
  },
  doc_rdsp_stmt: {
    id: 'doc_rdsp_stmt',
    name: 'RDSP Statement',
    category: 'net_worth',
    note: 'BMO, SCOTIA (12 months) | Other Lenders (90 days)',
  },
  doc_spousal_rrsp_stmt: {
    id: 'doc_spousal_rrsp_stmt',
    name: 'Spousal RRSP Statement',
    category: 'net_worth',
    note: 'BMO, SCOTIA (12 months) | Other Lenders (90 days)',
  },
  doc_tfsa_stmt: {
    id: 'doc_tfsa_stmt',
    name: 'TFSA Statement',
    category: 'net_worth',
    note: 'BMO, SCOTIA (12 months) | Other Lenders (90 days)',
  },
  doc_fhsa_stmt: {
    id: 'doc_fhsa_stmt',
    name: 'FHSA Statement',
    category: 'net_worth',
    note: 'BMO, SCOTIA (12 months) | Other Lenders (90 days)',
  },
  doc_non_registered_stmt: {
    id: 'doc_non_registered_stmt',
    name: 'Non-Registered Account Statement',
    category: 'net_worth',
    note: 'BMO, SCOTIA (12 months) | Other Lenders (90 days)',
  },

  // Existing Properties Documents
  doc_mortgage_stmt_other: {
    id: 'doc_mortgage_stmt_other',
    name: 'Mortgage Statements (Other Properties)',
    category: 'existing_properties',
  },
  doc_property_tax_other: {
    id: 'doc_property_tax_other',
    name: 'Property Tax Statements (Other Properties)',
    category: 'existing_properties',
  },
  doc_rental_agreements: {
    id: 'doc_rental_agreements',
    name: 'Rental Agreements (If Applicable)',
    category: 'existing_properties',
  },
  doc_bank_stmt_rental_income: {
    id: 'doc_bank_stmt_rental_income',
    name: 'Bank Statements Showing Rental Income (If Applicable)',
    category: 'existing_properties',
  },
};

// =============================================================================
// DOCUMENT GROUPINGS
// These define which documents belong to which logical group for the engine
// =============================================================================

// Transaction: Purchase Resale (always included)
export const purchaseResaleAlwaysDocs: string[] = [
  'doc_aps',
  'doc_mls',
  'doc_amendments',
];

// Transaction: Purchase New Construction (always included)
export const purchaseNewAlwaysDocs: string[] = [
  'doc_aps',
  'doc_amendments_waivers',
  'doc_interim_adjustments',
  'doc_deposits',
];

// Transaction: Renewal/Refinance
export const renewalRefinanceDocs: string[] = [
  'doc_mortgage_stmt',
  'doc_property_tax',
];

// Property: Condo
export const condoDocs: string[] = [
  'doc_condo_fee',
  'doc_lease_bank_stmt',
];

// Income: Employed
export const employedDocs: string[] = [
  'doc_t4_2yr',
  'doc_noas_2yr',
  'doc_job_letter',
  'doc_paystubs',
];

// Income: Retired
export const retiredDocs: string[] = [
  'doc_t4a_retired',
  'doc_t1_most_recent',
  'doc_noa_most_recent',
  'doc_bank_stmt_retired',
];

// Income: Rental
export const rentalDocs: string[] = [
  'doc_lease_agreement',
  'doc_bank_statements_rental',
  'doc_first_last_deposits',
  'doc_t1_generals_rental',
];

// Income: Self-Employed - Always required when self-employed
export const selfEmployedAlwaysDocs: string[] = [
  'doc_t1_2yr',
  'doc_noas_2yr',
];

// Income: Self-Employed - Incorporated specific
export const selfEmployedIncorporatedDocs: string[] = [
  'doc_articles_inc',
  'doc_t2_2yr',
  'doc_financial_stmt',
  'doc_business_bank_stmt',
];

// Income: Self-Employed - Sole Proprietor specific
export const selfEmployedSoleProprietorDocs: string[] = [
  'doc_business_license',
  'doc_business_bank_stmt',
];

// Other Income Type mappings
export const otherIncomeTypeDocMap: Record<string, string> = {
  child_care_benefit: 'doc_child_care_benefit',
  alimony: 'doc_alimony',
  investment_income: 'doc_investment_income',
  disability: 'doc_disability',
  survivors_pension: 'doc_survivors_pension',
  maternity_leave: 'doc_maternity_leave',
};

// Net Worth Account mappings
export const netWorthDocMap: Record<string, string> = {
  rrsp: 'doc_rrsp_stmt',
  rdsp: 'doc_rdsp_stmt',
  spousal_rrsp: 'doc_spousal_rrsp_stmt',
  tfsa: 'doc_tfsa_stmt',
  fhsa: 'doc_fhsa_stmt',
  non_registered: 'doc_non_registered_stmt',
};

// Existing Properties Documents
export const existingPropertiesDocs: string[] = [
  'doc_mortgage_stmt_other',
  'doc_property_tax_other',
  'doc_rental_agreements',
  'doc_bank_stmt_rental_income',
];

// Helper to get document by ID
export function getDoc(id: string): Document {
  const doc = documentsRegistry[id];
  if (!doc) {
    throw new Error(`Document not found: ${id}`);
  }
  return doc;
}

// Helper to get multiple documents by IDs
export function getDocs(ids: string[]): Document[] {
  return ids.map(getDoc);
}
