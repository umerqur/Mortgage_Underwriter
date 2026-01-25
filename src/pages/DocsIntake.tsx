import { useState, useEffect, useCallback } from 'react';
import type {
  FormAnswers,
  TransactionType,
  IncomeSource,
  NetWorthAccount,
  Document,
} from '../lib/types';
import { runEngine } from '../lib/docsEngine';

const STORAGE_KEY = 'mortgage_docs_form';
const CHECKED_DOCS_KEY = 'mortgage_docs_checked';

const initialFormState: FormAnswers = {
  transactionType: '',
  isCondo: null,
  incomeSources: [],
  netWorthAccounts: [],
};

const transactionOptions: { value: TransactionType; label: string }[] = [
  { value: 'purchase_resale', label: 'Purchase - Resale' },
  { value: 'purchase_new', label: 'Purchase - New Construction' },
  { value: 'renewal_refinance', label: 'Renewal / Refinance' },
];

const incomeOptions: { value: IncomeSource; label: string }[] = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'retired', label: 'Retired' },
  { value: 'rental', label: 'Rental Income' },
  { value: 'other', label: 'Other Income' },
];

const netWorthOptions: { value: NetWorthAccount; label: string }[] = [
  { value: 'rrsp', label: 'RRSP' },
  { value: 'rdsp', label: 'RDSP' },
  { value: 'spousal_rrsp', label: 'Spousal RRSP' },
  { value: 'tfsa', label: 'TFSA' },
  { value: 'fhsa', label: 'FHSA' },
  { value: 'non_registered', label: 'Non-Registered' },
];

const categoryLabels: Record<Document['category'], string> = {
  transaction: 'Transaction Documents',
  property: 'Property Documents',
  income: 'Income Documents',
  net_worth: 'Net Worth Documents',
};

export default function DocsIntake() {
  const [formData, setFormData] = useState<FormAnswers>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return initialFormState;
      }
    }
    return initialFormState;
  });

  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(CHECKED_DOCS_KEY);
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const [submitted, setSubmitted] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Persist form data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  // Persist checked docs to localStorage
  useEffect(() => {
    localStorage.setItem(CHECKED_DOCS_KEY, JSON.stringify([...checkedDocs]));
  }, [checkedDocs]);

  // Check if there's saved data on mount to auto-show results
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.transactionType) {
          const result = runEngine(parsed);
          if (result.documents.length > 0) {
            setDocuments(result.documents);
            setSubmitted(true);
          }
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const validate = useCallback((): string[] => {
    const errors: string[] = [];

    if (!formData.transactionType) {
      errors.push('Please select a transaction type');
    }

    if (formData.isCondo === null) {
      errors.push('Please indicate if this is a condo');
    }

    if (formData.incomeSources.length === 0) {
      errors.push('Please select at least one income source');
    }

    return errors;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate();
    setValidationErrors(errors);

    if (errors.length > 0) {
      return;
    }

    const result = runEngine(formData);
    setDocuments(result.documents);
    setSubmitted(true);
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setCheckedDocs(new Set());
    setDocuments([]);
    setSubmitted(false);
    setValidationErrors([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHECKED_DOCS_KEY);
  };

  const toggleIncomeSource = (source: IncomeSource) => {
    setFormData((prev) => ({
      ...prev,
      incomeSources: prev.incomeSources.includes(source)
        ? prev.incomeSources.filter((s) => s !== source)
        : [...prev.incomeSources, source],
    }));
  };

  const toggleNetWorthAccount = (account: NetWorthAccount) => {
    setFormData((prev) => ({
      ...prev,
      netWorthAccounts: prev.netWorthAccounts.includes(account)
        ? prev.netWorthAccounts.filter((a) => a !== account)
        : [...prev.netWorthAccounts, account],
    }));
  };

  const toggleDocChecked = (docId: string) => {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  // Group documents by category
  const groupedDocs = documents.reduce(
    (acc, doc) => {
      if (!acc[doc.category]) {
        acc[doc.category] = [];
      }
      acc[doc.category].push(doc);
      return acc;
    },
    {} as Record<Document['category'], Document[]>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Mortgage Document Recommender
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Answer a few questions to get your personalized document checklist
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <ul className="mt-2 list-inside list-disc text-sm text-red-700">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Transaction Type */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900">
              Transaction Type <span className="text-red-500">*</span>
            </label>
            <p className="mt-1 text-sm text-slate-500">
              What type of mortgage transaction is this?
            </p>
            <div className="mt-4 space-y-3">
              {transactionOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center rounded-lg border p-4 transition-all ${
                    formData.transactionType === option.value
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="transactionType"
                    value={option.value}
                    checked={formData.transactionType === option.value}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        transactionType: e.target.value as TransactionType,
                      }))
                    }
                    className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-3 font-medium text-slate-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Condo */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900">
              Is this a Condo? <span className="text-red-500">*</span>
            </label>
            <p className="mt-1 text-sm text-slate-500">
              Condos require additional documentation
            </p>
            <div className="mt-4 flex gap-4">
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ].map((option) => (
                <label
                  key={String(option.value)}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border p-4 transition-all ${
                    formData.isCondo === option.value
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="isCondo"
                    value={String(option.value)}
                    checked={formData.isCondo === option.value}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        isCondo: option.value,
                      }))
                    }
                    className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 font-medium text-slate-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Income Sources */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900">
              Income Sources <span className="text-red-500">*</span>
            </label>
            <p className="mt-1 text-sm text-slate-500">
              Select all that apply
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {incomeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                    formData.incomeSources.includes(option.value)
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.incomeSources.includes(option.value)}
                    onChange={() => toggleIncomeSource(option.value)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Net Worth Accounts */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900">
              Net Worth Accounts
            </label>
            <p className="mt-1 text-sm text-slate-500">
              Select accounts you want to use for qualification (optional)
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {netWorthOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                    formData.netWorthAccounts.includes(option.value)
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.netWorthAccounts.includes(option.value)}
                    onChange={() => toggleNetWorthAccount(option.value)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-700">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Get Document Checklist
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Results */}
        {submitted && (
          <div className="mt-10">
            <div className="mb-6 border-t border-slate-200 pt-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Recommended Documents
              </h2>
              <p className="mt-2 text-slate-600">
                Based on your selections, you'll need the following documents.
                Check them off as you collect them.
              </p>
            </div>

            {documents.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-slate-500">
                  No documents to display. Please complete the form above.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {(
                  ['transaction', 'property', 'income', 'net_worth'] as const
                ).map((category) => {
                  const docs = groupedDocs[category];
                  if (!docs || docs.length === 0) return null;

                  return (
                    <div
                      key={category}
                      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                      <h3 className="mb-4 text-lg font-semibold text-slate-900">
                        {categoryLabels[category]}
                      </h3>
                      <ul className="space-y-3">
                        {docs.map((doc) => (
                          <li key={doc.id}>
                            <label className="flex cursor-pointer items-start gap-3">
                              <input
                                type="checkbox"
                                checked={checkedDocs.has(doc.id)}
                                onChange={() => toggleDocChecked(doc.id)}
                                className="mt-1 h-5 w-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                              />
                              <div className="flex-1">
                                <span
                                  className={`text-base ${
                                    checkedDocs.has(doc.id)
                                      ? 'text-slate-400 line-through'
                                      : 'text-slate-700'
                                  }`}
                                >
                                  {doc.name}
                                </span>
                                {doc.note && (
                                  <p className="mt-1 text-sm text-slate-500">
                                    {doc.note}
                                  </p>
                                )}
                              </div>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

                {/* Progress indicator */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      Progress
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {checkedDocs.size} / {documents.length} collected
                    </span>
                  </div>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-green-500 transition-all duration-300"
                      style={{
                        width: `${(checkedDocs.size / documents.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
