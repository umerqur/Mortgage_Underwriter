import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';
import { LogoIcon } from '../components/LogoIcon';

const REQUEST_ACCESS_EMAIL = 'umer.qureshi@gmail.com';
const HERO_IMAGE_URL = 'https://images.unsplash.com/photo-1558224752-394621ba6925?q=80&w=1114&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

// FAQ items
const faqItems = [
  {
    question: 'Who can access this tool?',
    answer: 'This is an internal tool exclusively for authorized mortgage brokerage staff. Access is invite-only and protected behind secure authentication. We do not offer public signup.',
  },
  {
    question: 'How do I request access?',
    answer: 'Click the "Request Access" button to send an email with your name, brokerage, role, and reason for access. Our team will review your request and provision an account if approved.',
  },
  {
    question: 'Is customer data stored on this site?',
    answer: 'No customer data is stored or displayed publicly. This tool is used internally by staff to generate document checklists. All sensitive information is handled according to our security policies.',
  },
  {
    question: 'What browsers are supported?',
    answer: 'The tool works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser updated for the best experience.',
  },
];

export default function Landing() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const mailtoLink = `mailto:${REQUEST_ACCESS_EMAIL}?subject=BrokerOps%20Access%20Request&body=Hi%2C%0A%0AI%20would%20like%20to%20request%20access%20to%20BrokerOps.%0A%0AName%3A%0ABrokerage%3A%0ARole%3A%0A%0AThank%20you.`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 selection:bg-sky-100 selection:text-sky-900">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <Container>
          <div className="flex justify-between items-center h-16 sm:h-20 lg:h-24">
            <div className="flex items-center gap-2 sm:gap-3 group cursor-default">
              <LogoIcon size={28} />
              <span className="text-lg sm:text-xl font-bold tracking-tightest text-slate-900">BrokerOps</span>
            </div>
            <div className="flex items-center gap-4 sm:gap-8">
              <a href={mailtoLink} className="hidden sm:block text-sm font-semibold text-black hover:text-slate-600 transition-colors">Request Access</a>
              <Link to="/login">
                <Button variant="primary" className="py-2 px-4 sm:py-2.5 sm:px-5 text-sm sm:text-base">Log in</Button>
              </Link>
            </div>
          </div>
        </Container>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[680px] overflow-hidden">
        {/* Background image layer with washout effect */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE_URL}
            alt=""
            className="w-full h-full object-cover blur-[2px] saturate-[0.85] contrast-[0.92] brightness-105"
          />
        </div>

        {/* Gradient overlay - strongest on left, fades to transparent on right */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-200/90 via-40% to-transparent" />

        {/* Content */}
        <Container className="relative z-10 h-full">
          <div className="flex flex-col justify-center h-full pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 lg:pb-24">
            <div className="max-w-xl lg:max-w-2xl">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-slate-950 leading-[1.1] tracking-tight mb-6 sm:mb-8">
                Mortgage intake, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-indigo-600">reimagined.</span>
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 sm:mb-10 max-w-lg">
                The modern underwriting companion. Standardize your packages and accelerate your CRM entry with precision.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button href={mailtoLink} className="h-12 sm:h-14 px-6 sm:px-8 text-base">Request Access Now</Button>
                <Link to="/login">
                  <Button variant="secondary" className="h-12 sm:h-14 px-6 sm:px-8 text-base w-full">Log in</Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Grid - "Bento Style" */}
      <section className="py-24 bg-gradient-to-b from-slate-200 via-slate-300/70 to-slate-200 border-y border-slate-300">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-sm font-bold text-sky-600 uppercase tracking-[0.2em] mb-4">Capabilities</h2>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">Everything you need to move faster.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Smart Checklists", desc: "Automatically know which documents are required based on the deal.", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
              { title: "Lender Ready Packages", desc: "Turn borrower documents into complete, lender ready mortgage packages without manual review.", icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
              { title: "Pre Filled Applications", desc: "Extract key information from submitted documents so applications are ready faster with less re typing.", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" },
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-sky-50 rounded-xl flex items-center justify-center text-sky-600 mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Security Focus */}
      <section className="py-32 overflow-hidden bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200">
        <Container>
          <div className="bg-gradient-to-br from-sky-50 to-indigo-50 rounded-[3rem] p-12 lg:p-24 relative overflow-hidden border border-slate-200">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-sky-200/40 rounded-full blur-[120px]" />
            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-slate-900 tracking-tight mb-6">Designed for brokerage privacy.</h2>
                <p className="text-slate-600 text-lg mb-10">We prioritize internal control. No public registration, no exposed data, just a secure environment for your team.</p>
                <div className="space-y-6">
                  {['Invite-only provisioning', 'Brokerage email allowlist', 'Zero public data exposure'].map((item) => (
                    <div key={item} className="flex items-center gap-4 text-slate-800 font-medium">
                      <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden lg:block">
                <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-200">
                    <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">Admin Controlled</p>
                      <p className="text-slate-500 text-sm">Security Policy Active</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-[85%] bg-sky-500" />
                    </div>
                    <div className="h-2 w-2/3 bg-slate-100 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gradient-to-b from-slate-200 via-slate-300/50 to-slate-200 border-t border-slate-300">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-sm font-bold text-sky-600 uppercase tracking-[0.2em] mb-4">Support</h2>
              <p className="text-4xl font-bold text-slate-900 tracking-tight">Frequently asked questions</p>
            </div>
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                  >
                    <span className="font-semibold text-slate-900">{item.question}</span>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${
                        openFaqIndex === index ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaqIndex === index && (
                    <div className="px-6 pb-5">
                      <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-slate-200 to-slate-300 py-20 border-t border-slate-300">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <LogoIcon size={24} />
              <span className="font-bold text-slate-900 tracking-tightest">BrokerOps</span>
            </div>
            <p className="text-slate-500 text-sm">&copy; 2026 BrokerOps. Internal Use Only.</p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
