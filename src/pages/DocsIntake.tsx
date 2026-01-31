import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  FormAnswers,
  TransactionType,
  IncomeSource,
  NetWorthAccount,
  DownPaymentSource,
  SelfEmployedType,
  OtherIncomeType,
} from '../lib/types';
import { runEngine } from '../lib/docsEngine';
import { createIntake } from '../lib/intakeService';

const STORAGE_KEY = 'mortgage_docs_form';
const CHECKED_DOCS_KEY = 'mortgage_docs_checked';

const initialFormState: FormAnswers = {
  clientFirstName: '',
  clientLastName: '',
  clientEmail: '',
  clientPhone: '',
  brokerName: 'Ousmaan',
  transactionType: '',
  isCondo: null,
  subjectPropertyRented: null,
  incomeSources: [],
  netWorthAccounts: [],
  downPaymentSources: [],
  downPaymentOtherDetails: '',
  selfEmployedType: '',
  otherIncomeTypes: [],
  hasOtherProperties: null,
  numberOfOtherProperties: null,
  otherPropertiesIsCondo: [],
  incomeOtherDetails: '',
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

const downPaymentOptions: { value: DownPaymentSource; label: string }[] = [
  { value: 'savings', label: 'Savings' },
  { value: 'sale_of_property', label: 'Sale of Property' },
  { value: 'gift', label: 'Gift' },
  { value: 'rrsp_hbp', label: 'RRSP HBP' },
  { value: 'other', label: 'Other' },
];

const selfEmployedOptions: { value: SelfEmployedType; label: string }[] = [
  { value: 'incorporated', label: 'Incorporated' },
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
];

const otherIncomeOptions: { value: OtherIncomeType; label: string }[] = [
  { value: 'child_care_benefit', label: 'Child Care Benefit' },
  { value: 'alimony', label: 'Alimony' },
  { value: 'investment_income', label: 'Investment Income' },
  { value: 'disability', label: 'Disability' },
  { value: 'survivors_pension', label: "Survivor's Pension" },
  { value: 'maternity_leave', label: 'Maternity Leave' },
];

export default function DocsIntake() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormAnswers>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new fields have default values for backwards compatibility
        return {
          ...initialFormState,
          ...parsed,
          clientFirstName: parsed.clientFirstName || '',
          clientLastName: parsed.clientLastName || '',
          clientEmail: parsed.clientEmail || '',
          clientPhone: parsed.clientPhone || '',
          brokerName: parsed.brokerName || 'Ousmaan',
          downPaymentSources: parsed.downPaymentSources || [],
          downPaymentOtherDetails: parsed.downPaymentOtherDetails || '',
          selfEmployedType: parsed.selfEmployedType || '',
          otherIncomeTypes: parsed.otherIncomeTypes || [],
          hasOtherProperties: parsed.hasOtherProperties ?? null,
          numberOfOtherProperties: parsed.numberOfOtherProperties ?? null,
          otherPropertiesIsCondo: parsed.otherPropertiesIsCondo || [],
          subjectPropertyRented: parsed.subjectPropertyRented ?? null,
          incomeOtherDetails: parsed.incomeOtherDetails || '',
        };
      } catch {
        return initialFormState;
      }
    }
    return initialFormState;
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Computed: is this a purchase transaction?
  const isPurchase =
    formData.transactionType === 'purchase_resale' ||
    formData.transactionType === 'purchase_new';

  // Computed: is self-employed selected?
  const isSelfEmployed = formData.incomeSources.includes('self_employed');

  // Computed: is other income selected?
  const isOtherIncome = formData.incomeSources.includes('other');

  // Persist form data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

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

    // Validate self-employed type if self-employed is selected
    if (isSelfEmployed && !formData.selfEmployedType) {
      errors.push('Please select your self-employment type');
    }

    // Validate other income types if other income is selected
    if (isOtherIncome && formData.otherIncomeTypes.length === 0) {
      errors.push('Please select at least one other income type');
    }

    // Validate down payment sources for purchase transactions
    if (isPurchase && formData.downPaymentSources.length === 0) {
      errors.push('Please select at least one down payment source');
    }

    // Validate other properties question is answered
    if (formData.hasOtherProperties === null) {
      errors.push('Please indicate if you own other properties');
    }

    return errors;
  }, [formData, isSelfEmployed, isOtherIncome, isPurchase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate();
    setValidationErrors(errors);
    setSubmitError(null);

    if (errors.length > 0) {
      return;
    }

    const result = runEngine(formData);

    // Create intake in Supabase and redirect
    setSubmitting(true);
    try {
      const intake = await createIntake({
        broker_name: formData.brokerName,
        client_first_name: formData.clientFirstName,
        client_last_name: formData.clientLastName,
        client_email: formData.clientEmail,
        client_phone: formData.clientPhone,
        form_answers: formData,
        engine_tags: result.tags,
        required_docs: result.documents,
      });
      // Clear localStorage after successful creation
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CHECKED_DOCS_KEY);
      navigate(`/intake/${intake.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create intake';
      setSubmitError(message);
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setValidationErrors([]);
    setSubmitError(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CHECKED_DOCS_KEY);
  };

  const toggleIncomeSource = (source: IncomeSource) => {
    setFormData((prev) => {
      const newIncomeSources = prev.incomeSources.includes(source)
        ? prev.incomeSources.filter((s) => s !== source)
        : [...prev.incomeSources, source];

      // Clear dependent fields when parent is unchecked
      let newSelfEmployedType = prev.selfEmployedType;
      let newOtherIncomeTypes = prev.otherIncomeTypes;
      let newIncomeOtherDetails = prev.incomeOtherDetails;

      if (source === 'self_employed' && prev.incomeSources.includes(source)) {
        newSelfEmployedType = '';
      }

      if (source === 'other' && prev.incomeSources.includes(source)) {
        newOtherIncomeTypes = [];
        newIncomeOtherDetails = '';
      }

      return {
        ...prev,
        incomeSources: newIncomeSources,
        selfEmployedType: newSelfEmployedType,
        otherIncomeTypes: newOtherIncomeTypes,
        incomeOtherDetails: newIncomeOtherDetails,
      };
    });
  };

  const toggleNetWorthAccount = (account: NetWorthAccount) => {
    setFormData((prev) => ({
      ...prev,
      netWorthAccounts: prev.netWorthAccounts.includes(account)
        ? prev.netWorthAccounts.filter((a) => a !== account)
        : [...prev.netWorthAccounts, account],
    }));
  };

  const toggleDownPaymentSource = (source: DownPaymentSource) => {
    setFormData((prev) => {
      const removing = prev.downPaymentSources.includes(source);
      return {
        ...prev,
        downPaymentSources: removing
          ? prev.downPaymentSources.filter((s) => s !== source)
          : [...prev.downPaymentSources, source],
        // Clear description when "other" is unchecked
        downPaymentOtherDetails:
          source === 'other' && removing ? '' : prev.downPaymentOtherDetails,
      };
    });
  };

  const toggleOtherIncomeType = (incomeType: OtherIncomeType) => {
    setFormData((prev) => ({
      ...prev,
      otherIncomeTypes: prev.otherIncomeTypes.includes(incomeType)
        ? prev.otherIncomeTypes.filter((t) => t !== incomeType)
        : [...prev.otherIncomeTypes, incomeType],
    }));
  };

  // Clear down payment sources, other details, and subject property rented when transaction type changes to non-purchase
  useEffect(() => {
    if (!isPurchase) {
      if (formData.downPaymentSources.length > 0 || formData.downPaymentOtherDetails || formData.subjectPropertyRented !== null) {
        setFormData((prev) => ({
          ...prev,
          downPaymentSources: [],
          downPaymentOtherDetails: '',
          subjectPropertyRented: null,
        }));
      }
    }
  }, [isPurchase, formData.downPaymentSources.length, formData.downPaymentOtherDetails, formData.subjectPropertyRented]);

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

          {/* Client Information */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900">
              Client Information
            </label>
            <p className="mt-1 text-sm text-slate-500">
              Enter client details for the document checklist
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="clientFirstName"
                  className="block text-sm font-medium text-slate-700"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="clientFirstName"
                  value={formData.clientFirstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientFirstName: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="clientLastName"
                  className="block text-sm font-medium text-slate-700"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="clientLastName"
                  value={formData.clientLastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientLastName: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="clientEmail"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="clientEmail"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientEmail: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label
                  htmlFor="clientPhone"
                  className="block text-sm font-medium text-slate-700"
                >
                  Phone <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      clientPhone: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="brokerName"
                  className="block text-sm font-medium text-slate-700"
                >
                  Broker Name
                </label>
                <input
                  type="text"
                  id="brokerName"
                  value={formData.brokerName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      brokerName: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

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

          {/* Down Payment Sources - Only show for purchase transactions */}
          {isPurchase && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-900">
                Down Payment Sources <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-slate-500">
                Where is your down payment coming from? (Select all that apply)
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {downPaymentOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                      formData.downPaymentSources.includes(option.value)
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.downPaymentSources.includes(option.value)}
                      onChange={() => toggleDownPaymentSource(option.value)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm font-medium text-slate-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              {formData.downPaymentSources.includes('other') && (
                <div className="mt-4">
                  <label
                    htmlFor="downPaymentOtherDetails"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Describe the down payment source
                  </label>
                  <input
                    type="text"
                    id="downPaymentOtherDetails"
                    value={formData.downPaymentOtherDetails}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        downPaymentOtherDetails: e.target.value,
                      }))
                    }
                    placeholder="e.g., inheritance, sale of investments"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
              {validationErrors.includes('Please select at least one down payment source') && (
                <p className="mt-3 text-sm text-red-600">
                  Please select at least one down payment source
                </p>
              )}
            </div>
          )}

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

          {/* Subject Property Rented - Only show for purchase transactions */}
          {isPurchase && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-900">
                Will any portion of the property be rented out?
              </label>
              <p className="mt-1 text-sm text-slate-500">
                Rental properties require a lease agreement and bank statements
              </p>
              <div className="mt-4 flex gap-4">
                {[
                  { value: true, label: 'Yes' },
                  { value: false, label: 'No' },
                ].map((option) => (
                  <label
                    key={String(option.value)}
                    className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border p-4 transition-all ${
                      formData.subjectPropertyRented === option.value
                        ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subjectPropertyRented"
                      value={String(option.value)}
                      checked={formData.subjectPropertyRented === option.value}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          subjectPropertyRented: option.value,
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
          )}

          {/* Other Properties */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900">
              Do you own other properties? <span className="text-red-500">*</span>
            </label>
            <p className="mt-1 text-sm text-slate-500">
              Properties beyond the one involved in this transaction
            </p>
            <div className="mt-4 flex gap-4">
              {[
                { value: true, label: 'Yes' },
                { value: false, label: 'No' },
              ].map((option) => (
                <label
                  key={String(option.value)}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border p-4 transition-all ${
                    formData.hasOtherProperties === option.value
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="hasOtherProperties"
                    value={String(option.value)}
                    checked={formData.hasOtherProperties === option.value}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        hasOtherProperties: option.value,
                        // Clear dependent fields if set to false
                        numberOfOtherProperties: option.value ? prev.numberOfOtherProperties : null,
                        otherPropertiesIsCondo: option.value ? prev.otherPropertiesIsCondo : [],
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
            {validationErrors.includes('Please indicate if you own other properties') && (
              <p className="mt-3 text-sm text-red-600">
                Please indicate if you own other properties
              </p>
            )}
          </div>

          {/* Number of Other Properties - Only show if hasOtherProperties is true */}
          {formData.hasOtherProperties === true && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <label
                htmlFor="numberOfOtherProperties"
                className="block text-sm font-semibold text-slate-900"
              >
                How many other properties?
              </label>
              <p className="mt-1 text-sm text-slate-500">
                Enter the number of additional properties you own
              </p>
              <input
                type="number"
                id="numberOfOtherProperties"
                min={1}
                max={10}
                value={formData.numberOfOtherProperties ?? ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const n = value ? Math.min(10, Math.max(1, parseInt(value, 10))) : null;
                  setFormData((prev) => {
                    // Resize condo flags array to match new N, preserving existing values
                    const oldFlags = prev.otherPropertiesIsCondo;
                    const newFlags = n
                      ? Array.from({ length: n }, (_, idx) => oldFlags[idx] ?? false)
                      : [];
                    return {
                      ...prev,
                      numberOfOtherProperties: n,
                      otherPropertiesIsCondo: newFlags,
                    };
                  });
                }}
                className="mt-4 block w-32 rounded-lg border border-emerald-300 px-3 py-2 text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="1"
              />
              {formData.numberOfOtherProperties && formData.otherPropertiesIsCondo.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-slate-700">
                    Is each property a condo?
                  </p>
                  {formData.otherPropertiesIsCondo.map((isCondo, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-36">
                        Other Property {idx + 1}
                      </span>
                      <label className={`flex cursor-pointer items-center rounded border px-3 py-1 text-sm transition-all ${isCondo ? 'border-emerald-500 bg-emerald-100 ring-1 ring-emerald-500' : 'border-emerald-200 bg-white hover:border-emerald-300'}`}>
                        <input
                          type="radio"
                          name={`otherPropertyCondo_${idx}`}
                          checked={isCondo === true}
                          onChange={() =>
                            setFormData((prev) => {
                              const flags = [...prev.otherPropertiesIsCondo];
                              flags[idx] = true;
                              return { ...prev, otherPropertiesIsCondo: flags };
                            })
                          }
                          className="h-3 w-3 border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-1.5">Yes</span>
                      </label>
                      <label className={`flex cursor-pointer items-center rounded border px-3 py-1 text-sm transition-all ${isCondo === false ? 'border-emerald-500 bg-emerald-100 ring-1 ring-emerald-500' : 'border-emerald-200 bg-white hover:border-emerald-300'}`}>
                        <input
                          type="radio"
                          name={`otherPropertyCondo_${idx}`}
                          checked={isCondo === false}
                          onChange={() =>
                            setFormData((prev) => {
                              const flags = [...prev.otherPropertiesIsCondo];
                              flags[idx] = false;
                              return { ...prev, otherPropertiesIsCondo: flags };
                            })
                          }
                          className="h-3 w-3 border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-1.5">No</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                  className={`flex cursor-pointer items-start rounded-lg border p-3 transition-all ${
                    formData.incomeSources.includes(option.value)
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.incomeSources.includes(option.value)}
                    onChange={() => toggleIncomeSource(option.value)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2">
                    <span className="text-sm font-medium text-slate-700">
                      {option.label}
                    </span>
                    {option.value === 'rental' && (
                      <span className="block text-xs text-slate-400">
                        This refers to rental income you already earn from other properties.
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Self-Employed Type - Only show if self-employed is selected */}
          {isSelfEmployed && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-900">
                Self-Employment Type <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-slate-500">
                What type of self-employment?
              </p>
              <div className="mt-4 flex gap-4">
                {selfEmployedOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border p-4 transition-all ${
                      formData.selfEmployedType === option.value
                        ? 'border-amber-500 bg-amber-100 ring-1 ring-amber-500'
                        : 'border-amber-200 bg-white hover:border-amber-300 hover:bg-amber-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="selfEmployedType"
                      value={option.value}
                      checked={formData.selfEmployedType === option.value}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          selfEmployedType: e.target.value as SelfEmployedType,
                        }))
                      }
                      className="h-4 w-4 border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="ml-2 font-medium text-slate-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Other Income Types - Only show if other income is selected */}
          {isOtherIncome && (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-6 shadow-sm">
              <label className="block text-sm font-semibold text-slate-900">
                Other Income Types <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-slate-500">
                Select the types of other income you receive
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {otherIncomeOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center rounded-lg border p-3 transition-all ${
                      formData.otherIncomeTypes.includes(option.value)
                        ? 'border-teal-500 bg-teal-100 ring-1 ring-teal-500'
                        : 'border-teal-200 bg-white hover:border-teal-300 hover:bg-teal-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.otherIncomeTypes.includes(option.value)}
                      onChange={() => toggleOtherIncomeType(option.value)}
                      className="h-4 w-4 rounded border-teal-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm font-medium text-slate-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <label
                  htmlFor="incomeOtherDetails"
                  className="block text-sm font-medium text-slate-700"
                >
                  Describe the income source
                </label>
                <input
                  type="text"
                  id="incomeOtherDetails"
                  value={formData.incomeOtherDetails}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      incomeOtherDetails: e.target.value,
                    }))
                  }
                  placeholder="e.g., foreign income, trust distributions"
                  className="mt-1 block w-full rounded-lg border border-teal-300 px-3 py-2 text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

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

          {/* Submit error */}
          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">
                Failed to create intake: {submitError}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-400"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating Intake...
                </span>
              ) : (
                'Get Document Checklist'
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={submitting}
              className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
