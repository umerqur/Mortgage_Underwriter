import { Link } from 'react-router-dom';

// Change this email when domain email is ready
const REQUEST_ACCESS_EMAIL = 'ousmaan@yourbrokerage.ca';

const features = [
  {
    title: 'Document Checklist Generator',
    description:
      'Automatically generate comprehensive document checklists based on transaction type, income sources, and borrower profile.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    title: 'PDF Package Export',
    description:
      'Export complete underwriting packages as professionally formatted PDFs ready for lender submission.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    title: 'Secure Internal Access',
    description:
      'Protected behind invite-only authentication. Only authorized staff can access the intake tools.',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
  },
];

export default function Landing() {
  const mailtoLink = `mailto:${REQUEST_ACCESS_EMAIL}?subject=${encodeURIComponent(
    'Request Access to Internal Tool'
  )}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-slate-900">
                Mortgage Agent Intake
              </span>
            </div>
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Mortgage Agent Intake Automation
            </h1>
            <p className="mt-4 text-xl text-slate-600">
              Reduce manual CRM entry. Standardize underwriting packages.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={mailtoLink}
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-colors"
              >
                Request Access
              </a>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm transition-colors"
              >
                Log in
              </Link>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-20 max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                About This Tool
              </h2>
              <p className="text-slate-600 leading-relaxed">
                We are a mortgage brokerage. We are building an internal tool to
                help our agents collect borrower documents and prefill our CRM
                fields to reduce manual data entry. This tool is for internal
                staff only and will be protected behind login. It does not
                expose any customer data publicly.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">
              Features
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center text-sky-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            Internal tool for authorized staff only.
          </p>
        </div>
      </footer>
    </div>
  );
}
