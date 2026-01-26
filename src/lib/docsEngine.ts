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
  existingPropertiesDocs,
} from '../data/docsRules.seed';

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
    // Down payment bank statement - include if any non-gift source selected
    const needsDownPaymentStatement = answers.downPaymentSources.some(
      (source) =>
        source === 'savings' ||
        source === 'sale_of_property' ||
        source === 'rrsp_hbp' ||
        source === 'other'
    );

    if (needsDownPaymentStatement) {
      if (answers.transactionType === 'purchase_resale') {
        addDoc('doc_dp_90day');
      } else if (answers.transactionType === 'purchase_new') {
        addDoc('doc_dp_bank_stmt');
      }
    }

    // Gift Letter - include only if gift is selected
    if (answers.downPaymentSources.includes('gift')) {
      addDoc('doc_gift_letter');
    }
  }

  // ==========================================================================
  // PROPERTY RULES
  // ==========================================================================

  // Condo - include condo documents
  if (answers.isCondo === true) {
    addDocs(condoDocs);
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

  // If the client owns other properties, include all existing properties docs
  // Note: This is a single checklist requirement, not per property
  if (answers.hasOtherProperties === true) {
    addDocs(existingPropertiesDocs);
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
