// Transaction types
export type TransactionType = 'purchase_resale' | 'purchase_new' | 'renewal_refinance' | '';

// Income source options
export type IncomeSource = 'employed' | 'self_employed' | 'retired' | 'rental' | 'other';

// Net worth account options
export type NetWorthAccount = 'rrsp' | 'rdsp' | 'spousal_rrsp' | 'tfsa' | 'fhsa' | 'non_registered';

// Down payment source options
export type DownPaymentSource = 'savings' | 'sale_of_property' | 'gift' | 'rrsp_hbp' | 'other';

// Self-employed type options
export type SelfEmployedType = 'incorporated' | 'sole_proprietor' | '';

// Other income type options
export type OtherIncomeType =
  | 'child_care_benefit'
  | 'alimony'
  | 'investment_income'
  | 'disability'
  | 'survivors_pension'
  | 'maternity_leave';

// Form answers structure
export interface FormAnswers {
  // Client fields
  clientFirstName: string;
  clientLastName: string;
  clientEmail: string;
  clientPhone: string;
  brokerName: string;
  // Form fields
  transactionType: TransactionType;
  isCondo: boolean | null;
  incomeSources: IncomeSource[];
  netWorthAccounts: NetWorthAccount[];
  downPaymentSources: DownPaymentSource[];
  selfEmployedType: SelfEmployedType;
  otherIncomeTypes: OtherIncomeType[];
}

// Document definition
export interface Document {
  id: string;
  name: string;
  category: 'transaction' | 'property' | 'income' | 'net_worth';
  note?: string;
}

// Engine result
export interface EngineResult {
  tags: string[];
  documents: Document[];
}
