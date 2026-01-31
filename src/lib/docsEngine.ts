import type { FormAnswers, Document, EngineResult } from './types';
import {
  getDocs,
  getDoc,
  purchaseResaleAlwaysDocs,
  purchaseNewAlwaysDocs,
  renewalRefinanceDocs,
  condoDocs,
  employedDocs,
  retiredDocs,
  rentalDocs,
  selfEmployedAlwaysDocs,
  selfEmployedIncorporatedDocs,
  selfEmployedSoleProprietorDocs,
  otherIncomeTypeDocMap,
  netWorthDocMap,
} from '../data/docsRules.seed';

/**
 * Generates per-property documents at runtime based on the number of other properties.
 * Always includes: Mortgage Statement, Property Tax Statement, Heating Costs, Legal Description.
 * Condo Fee Statement is only included when the property is flagged as a condo.
 */
function generatePerPropertyDocuments(
  numberOfProperties: number,
  condoFlags: boolean[],
): Document[] {
  const docs: Document[] = [];

  for (let i = 1; i <= numberOfProperties; i++) {
    docs.push({
      id: `doc_other_property_mortgage_statement_${i}`,
      name: `Mortgage Statement (Other Property ${i})`,
      category: 'existing_properties',
    });
    docs.push({
      id: `doc_other_property_tax_statement_${i}`,
      name: `Property Tax Statement (Other Property ${i})`,
      category: 'existing_properties',
    });
    docs.push({
      id: `doc_other_property_heating_costs_${i}`,
      name: `Heating Costs Document (Other Property ${i})`,
      category: 'existing_properties',
    });
    docs.push({
      id: `doc_other_property_legal_description_${i}`,
      name: `Legal Description (Other Property ${i})`,
      category: 'existing_properties',
    });
    if (condoFlags[i - 1]) {
      docs.push({
        id: `doc_other_property_condo_fee_${i}`,
        name: `Condo Fee Statement (Other Property ${i})`,
        category: 'existing_properties',
      });
    }
  }

  return docs;
}

/**
 * Builds an array of tags based on form answers.
 * Tags are used for tracking what was selected.
 */
export function buildTags(answers: FormAnswers): string[] {
  const tags: string[] = [];

  // Add transaction type tag
  if (answers.transactionType) {
    tags.push(answers.transactionType);
  }

  // Add condo tag if applicable
  if (answers.isCondo === true) {
    tags.push('condo');
  }

  // Add subject property rented tag if applicable
  if (answers.subjectPropertyRented === true) {
    tags.push('subject_property_rented');
  }

  // Add income source tags
  for (const source of answers.incomeSources) {
    tags.push(source);
  }

  // Add self-employed type if applicable
  if (answers.selfEmployedType) {
    tags.push(`self_employed_${answers.selfEmployedType}`);
  }

  // Add other income type tags
  for (const incomeType of answers.otherIncomeTypes) {
    tags.push(`other_income_${incomeType}`);
  }

  // Add down payment source tags
  for (const source of answers.downPaymentSources) {
    tags.push(`dp_${source}`);
  }

  // Add net worth account tags
  for (const account of answers.netWorthAccounts) {
    tags.push(account);
  }

  // Add other properties tag if applicable
  if (answers.hasOtherProperties === true) {
    tags.push('has_other_properties');
  }

  return tags;
}

/**
 * Rule-driven document recommendation engine.
 * Each rule explicitly defines when documents are included.
 */
export function recommendDocuments(answers: FormAnswers): Document[] {
  const documentsMap = new Map<string, Document>();

  const addDoc = (id: string) => {
    const doc = getDoc(id);
    if (!documentsMap.has(doc.id)) {
      documentsMap.set(doc.id, doc);
    }
  };

  const addDocs = (ids: string[]) => {
    for (const doc of getDocs(ids)) {
      if (!documentsMap.has(doc.id)) {
        documentsMap.set(doc.id, doc);
      }
    }
  };

  const isPurchase =
    answers.transactionType === 'purchase_resale' ||
    answers.transactionType === 'purchase_new';

  // ==========================================================================
  // TRANSACTION RULES
  // ==========================================================================

  // Purchase Resale - always includes these docs
  if (answers.transactionType === 'purchase_resale') {
    addDocs(purchaseResaleAlwaysDocs);
  }

  // Purchase New Construction - always includes these docs
  if (answers.transactionType === 'purchase_new') {
    addDocs(purchaseNewAlwaysDocs);
  }

  // Renewal/Refinance
  if (answers.transactionType === 'renewal_refinance') {
    addDocs(renewalRefinanceDocs);
  }

  // ==========================================================================
  // DOWN PAYMENT RULES (only for purchase transactions)
  // ==========================================================================

  if (isPurchase) {
    const isResale = answers.transactionType === 'purchase_resale';

    // Savings / Investment - 90-day bank statement (resale) or bank statement (new)
    if (answers.downPaymentSources.includes('savings')) {
      addDoc(isResale ? 'doc_dp_90day' : 'doc_dp_bank_stmt');
    }

    // Sale of existing property - agreement of sale, mortgage stmt, insurance, tax bill
    if (answers.downPaymentSources.includes('sale_of_property')) {
      addDoc('doc_dp_sale_agreement');
      addDoc('doc_dp_existing_mortgage_statement');
      addDoc('doc_dp_insurance_policy');
      addDoc('doc_dp_property_tax_bill');
    }

    // Gift - gift letter only
    if (answers.downPaymentSources.includes('gift')) {
      addDoc('doc_gift_letter');
    }

    // RRSP Home Buyers' Plan - withdrawal docs and RRSP statement
    if (answers.downPaymentSources.includes('rrsp_hbp')) {
      addDoc('doc_dp_rrsp_withdrawal_docs');
      addDoc('doc_dp_rrsp_statement');
    }

    // Other - 90-day bank statement (resale) or bank statement (new)
    if (answers.downPaymentSources.includes('other')) {
      addDoc(isResale ? 'doc_dp_90day' : 'doc_dp_bank_stmt');
    }
  }

  // ==========================================================================
  // PROPERTY RULES
  // ==========================================================================

  // Condo - include condo documents
  if (answers.isCondo === true) {
    addDocs(condoDocs);
  }

  // Subject property rented - include lease agreement & bank statements
  if (answers.subjectPropertyRented === true) {
    addDoc('doc_lease_bank_stmt');
  }

  // ==========================================================================
  // INCOME RULES
  // ==========================================================================

  // Employed - include all employed docs
  if (answers.incomeSources.includes('employed')) {
    addDocs(employedDocs);
  }

  // Retired - include all retired docs
  if (answers.incomeSources.includes('retired')) {
    addDocs(retiredDocs);
  }

  // Rental - include all rental docs
  if (answers.incomeSources.includes('rental')) {
    addDocs(rentalDocs);
  }

  // ==========================================================================
  // SELF-EMPLOYED RULES (partial selection based on type)
  // ==========================================================================

  if (answers.incomeSources.includes('self_employed')) {
    // Always include common self-employed docs
    addDocs(selfEmployedAlwaysDocs);

    // Incorporated specific docs
    if (answers.selfEmployedType === 'incorporated') {
      addDocs(selfEmployedIncorporatedDocs);
    }

    // Sole Proprietor specific docs
    if (answers.selfEmployedType === 'sole_proprietor') {
      addDocs(selfEmployedSoleProprietorDocs);
    }
  }

  // ==========================================================================
  // OTHER INCOME RULES (partial selection based on selected types)
  // ==========================================================================

  if (answers.incomeSources.includes('other')) {
    // Only include the specific other income docs that were selected
    for (const incomeType of answers.otherIncomeTypes) {
      const docId = otherIncomeTypeDocMap[incomeType];
      if (docId) {
        addDoc(docId);
      }
    }
  }

  // ==========================================================================
  // NET WORTH / ASSETS RULES
  // ==========================================================================

  // For each selected net worth account, include the matching statement doc
  for (const account of answers.netWorthAccounts) {
    const docId = netWorthDocMap[account];
    if (docId) {
      addDoc(docId);
    }
  }

  // ==========================================================================
  // EXISTING PROPERTIES RULES
  // ==========================================================================

  // If the client owns other properties, generate per-property documents
  // Always: Mortgage Statement, Property Tax, Heating Costs, Legal Description
  // Conditional: Condo Fee Statement (only if that property is flagged as condo)
  if (answers.hasOtherProperties === true && answers.numberOfOtherProperties) {
    const perPropertyDocs = generatePerPropertyDocuments(
      answers.numberOfOtherProperties,
      answers.otherPropertiesIsCondo || [],
    );
    for (const doc of perPropertyDocs) {
      // Per-property docs are intentionally not deduped - add directly
      documentsMap.set(doc.id, doc);
    }
  }

  // ==========================================================================
  // SORT AND RETURN
  // ==========================================================================

  const documents = Array.from(documentsMap.values());

  const categoryOrder: Record<Document['category'], number> = {
    transaction: 1,
    property: 2,
    income: 3,
    net_worth: 4,
    existing_properties: 5,
  };

  documents.sort((a, b) => {
    const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category];
    if (categoryDiff !== 0) return categoryDiff;
    return a.name.localeCompare(b.name);
  });

  return documents;
}

/**
 * Main engine function that takes form answers and returns
 * both the generated tags and recommended documents.
 */
export function runEngine(answers: FormAnswers): EngineResult {
  const tags = buildTags(answers);
  const documents = recommendDocuments(answers);

  return {
    tags,
    documents,
  };
}
