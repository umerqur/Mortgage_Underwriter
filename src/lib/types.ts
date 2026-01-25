// Transaction types
export type TransactionType = 'purchase_resale' | 'purchase_new' | 'renewal_refinance' | '';

// Income source options
export type IncomeSource = 'employed' | 'self_employed' | 'retired' | 'rental' | 'other';

// Net worth account options
export type NetWorthAccount = 'rrsp' | 'rdsp' | 'spousal_rrsp' | 'tfsa' | 'fhsa' | 'non_registered';

// Form answers structure
export interface FormAnswers {
  transactionType: TransactionType;
  isCondo: boolean | null;
  incomeSources: IncomeSource[];
  netWorthAccounts: NetWorthAccount[];
}

// Document definition
export interface Document {
  id: string;
  name: string;
  category: 'transaction' | 'property' | 'income' | 'net_worth';
  note?: string;
}

// Rule definition for matching tags to documents
export interface DocumentRule {
  tag: string;
  documents: Document[];
}

// Engine result
export interface EngineResult {
  tags: string[];
  documents: Document[];
}
