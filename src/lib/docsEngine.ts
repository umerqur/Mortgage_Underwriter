import type { FormAnswers, Document, EngineResult } from './types';
import { documentRules } from '../data/docsRules.seed';

/**
 * Builds an array of tags based on form answers.
 * Tags are used to match against document rules.
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

  // Add net worth account tags
  for (const account of answers.netWorthAccounts) {
    tags.push(account);
  }

  return tags;
}

/**
 * Recommends documents based on matching tags.
 * Deduplicates documents by name.
 */
export function recommendDocuments(tags: string[]): Document[] {
  const documentsMap = new Map<string, Document>();

  for (const tag of tags) {
    const rule = documentRules.find((r) => r.tag === tag);
    if (rule) {
      for (const doc of rule.documents) {
        // Deduplicate by document name
        if (!documentsMap.has(doc.name)) {
          documentsMap.set(doc.name, doc);
        }
      }
    }
  }

  // Convert map values to array and sort by category then name
  const documents = Array.from(documentsMap.values());

  const categoryOrder: Record<Document['category'], number> = {
    transaction: 1,
    property: 2,
    income: 3,
    net_worth: 4,
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
  const documents = recommendDocuments(tags);

  return {
    tags,
    documents,
  };
}
