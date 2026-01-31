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
  subjectPropertyRented: boolean | null;
  incomeSources: IncomeSource[];
  netWorthAccounts: NetWorthAccount[];
  downPaymentSources: DownPaymentSource[];
  downPaymentOtherDetails: string;
  selfEmployedType: SelfEmployedType;
  otherIncomeTypes: OtherIncomeType[];
  // Existing properties
  hasOtherProperties: boolean | null;
  numberOfOtherProperties: number | null;
  otherPropertiesIsCondo: boolean[];
  // Income other free text
  incomeOtherDetails: string;
}

// Document definition
export interface Document {
  id: string;
  name: string;
  category: 'transaction' | 'property' | 'income' | 'net_worth' | 'existing_properties';
  note?: string;
}

// Engine result
export interface EngineResult {
  tags: string[];
  documents: Document[];
}

// Upload status
export type UploadStatus = 'uploaded' | 'deleted';

// Intake row from Supabase
export interface Intake {
  id: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  broker_name: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string | null;
  client_phone: string | null;
  form_answers: FormAnswers;
  engine_tags: string[];
  required_docs: Document[];
  pdf_summary_path: string | null;
}

// Intake upload row from Supabase
export interface IntakeUpload {
  id: string;
  created_at: string;
  intake_id: string;
  doc_id: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string | null;
  upload_status: UploadStatus;
  classification_status: string;
  classified_doc_id: string | null;
  classification_confidence: number | null;
  extraction_status: string;
  extraction_confidence: number | null;
  extracted_json: Record<string, unknown> | null;
  error_message: string | null;
}
