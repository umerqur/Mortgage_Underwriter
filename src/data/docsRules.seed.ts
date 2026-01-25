import type { Document, DocumentRule } from '../lib/types';

// Helper to create document with unique ID
const createDoc = (
  name: string,
  category: Document['category'],
  note?: string
): Document => ({
  id: `${category}_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
  name,
  category,
  note,
});

// Transaction: Purchase Resale
const purchaseResaleDocs: Document[] = [
  createDoc('Agreement of Purchase and Sale', 'transaction'),
  createDoc('MLS Listing', 'transaction'),
  createDoc('Down Payment (90 Day Bank Statement)', 'transaction'),
  createDoc('Gift Letter', 'transaction'),
  createDoc('All Amendments', 'transaction'),
];

// Transaction: Purchase New Construction
const purchaseNewDocs: Document[] = [
  createDoc('Agreement of Purchase and Sale', 'transaction'),
  createDoc('All Amendments and Waivers', 'transaction'),
  createDoc('Interim Statement of Adjustments', 'transaction'),
  createDoc('Copy of All Deposits', 'transaction'),
  createDoc('Down Payment (Bank Statement)', 'transaction'),
  createDoc('Gift Letter', 'transaction'),
];

// Transaction: Renewal/Refinance
const renewalRefinanceDocs: Document[] = [
  createDoc('Mortgage Statements', 'transaction'),
  createDoc('Property Tax Statements', 'transaction'),
];

// Property: Condo
const condoDocs: Document[] = [
  createDoc('Lease Agreement & Bank Statements', 'property'),
  createDoc('Condo Fee Confirmation', 'property'),
];

// Income: Retired
const retiredDocs: Document[] = [
  createDoc('T4A (Most Recent) - CPP, OAS, Pension', 'income'),
  createDoc('T1 General (Most Recent)', 'income'),
  createDoc('NOA (Most Recent)', 'income'),
  createDoc('Bank Statement', 'income'),
];

// Income: Employed
const employedDocs: Document[] = [
  createDoc('T4 (Past 2 Years)', 'income'),
  createDoc('NOAs (Past 2 Years)', 'income'),
  createDoc('Job Letter', 'income'),
  createDoc('Paystubs (Most Recent)', 'income'),
];

// Income: Self-Employed
const selfEmployedDocs: Document[] = [
  createDoc('Articles of Incorporation', 'income'),
  createDoc('Business License', 'income'),
  createDoc('T1 General (Past 2 Years)', 'income'),
  createDoc('NOAs (Past 2 Years)', 'income'),
  createDoc('T2 (Past 2 Years)', 'income'),
  createDoc('Financial Statements (Past 2 Years) - CPA Prep', 'income'),
  createDoc('Business Bank Statements (12 Months)', 'income'),
];

// Income: Rental
const rentalDocs: Document[] = [
  createDoc('Lease Agreement', 'income'),
  createDoc('Bank Statements', 'income'),
  createDoc('First & Last Deposits (New Lease)', 'income'),
  createDoc('T1 Generals', 'income'),
];

// Income: Other
const otherIncomeDocs: Document[] = [
  createDoc('Child Care Benefit (CRA Letter & Bank Statements)', 'income'),
  createDoc('Alimony (Bank Statements & Separation Agreement)', 'income'),
  createDoc('Investment Income (2 Years Full T1 Generals or T5s and NOAs)', 'income'),
  createDoc('Disability Income (T1 General, T4A, Letter)', 'income'),
  createDoc("Survivor's Pension (T1 General, T4A, Letter)", 'income'),
  createDoc('Maternity Leave Income (Job Letter w/ Return Date & Last Full Paystub Before Leave)', 'income'),
];

// Net Worth Account Statement
const NET_WORTH_NOTE = 'BMO, SCOTIA (12 months) | Other Lenders (90 days)';

const netWorthDocs: Record<string, Document> = {
  rrsp: createDoc('RRSP Statement', 'net_worth', NET_WORTH_NOTE),
  rdsp: createDoc('RDSP Statement', 'net_worth', NET_WORTH_NOTE),
  spousal_rrsp: createDoc('Spousal RRSP Statement', 'net_worth', NET_WORTH_NOTE),
  tfsa: createDoc('TFSA Statement', 'net_worth', NET_WORTH_NOTE),
  fhsa: createDoc('FHSA Statement', 'net_worth', NET_WORTH_NOTE),
  non_registered: createDoc('Non-Registered Account Statement', 'net_worth', NET_WORTH_NOTE),
};

// Export all document rules
export const documentRules: DocumentRule[] = [
  // Transaction rules
  { tag: 'purchase_resale', documents: purchaseResaleDocs },
  { tag: 'purchase_new', documents: purchaseNewDocs },
  { tag: 'renewal_refinance', documents: renewalRefinanceDocs },

  // Property rules
  { tag: 'condo', documents: condoDocs },

  // Income rules
  { tag: 'retired', documents: retiredDocs },
  { tag: 'employed', documents: employedDocs },
  { tag: 'self_employed', documents: selfEmployedDocs },
  { tag: 'rental', documents: rentalDocs },
  { tag: 'other', documents: otherIncomeDocs },

  // Net worth rules
  { tag: 'rrsp', documents: [netWorthDocs.rrsp] },
  { tag: 'rdsp', documents: [netWorthDocs.rdsp] },
  { tag: 'spousal_rrsp', documents: [netWorthDocs.spousal_rrsp] },
  { tag: 'tfsa', documents: [netWorthDocs.tfsa] },
  { tag: 'fhsa', documents: [netWorthDocs.fhsa] },
  { tag: 'non_registered', documents: [netWorthDocs.non_registered] },
];

// Export for reference
export const allDocuments = {
  purchaseResale: purchaseResaleDocs,
  purchaseNew: purchaseNewDocs,
  renewalRefinance: renewalRefinanceDocs,
  condo: condoDocs,
  retired: retiredDocs,
  employed: employedDocs,
  selfEmployed: selfEmployedDocs,
  rental: rentalDocs,
  otherIncome: otherIncomeDocs,
  netWorth: netWorthDocs,
};
