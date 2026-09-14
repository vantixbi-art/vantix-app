import { ShieldCheck } from 'lucide-react';

interface Section { title: string; body: string[] }

const SECTIONS: Section[] = [
  {
    title: '1. Information We Collect',
    body: [
      'When you register for Vantix, we collect your email address and use Supabase Auth to manage your authentication session. We do not collect your name, phone number, physical address, or any identifying information beyond your email.',
      'We collect anonymous usage analytics to understand how features are used and improve the Platform. This data is aggregated and does not identify individual users.',
      'Trade journal entries, watchlist tickers, and alert configurations that you create are stored in your Supabase database row, which is associated with your user ID and accessible only to you.',
    ],
  },
  {
    title: '2. API Keys & Client Settings',
    body: [
      'Any third-party API keys you enter in the Settings panel (such as your Finnhub API key or personal Google Gemini API key) are stored exclusively in your browser\'s localStorage under the keys "vantix_finnhub_key" and "vantix_gemini_key".',
      'These keys are never transmitted to Vantix servers for storage. If you provide a personal Gemini API key, it is sent directly to the Vantix AI Edge Function over HTTPS in the request body — it is not logged, stored in any database, or visible to Vantix staff.',
      'Keys in localStorage exist solely in your local browser storage and are cleared if you clear your browser data.',
    ],
  },
  {
    title: '3. AI Coach & Gemini Integration',
    body: [
      'Vantix uses Google Gemini (1.5 Flash) to power the AI Coach Insights feature. When you request an AI analysis of your trade journal, your trade records (symbol, P&L, tags, and notes) are transmitted to Google\'s Gemini API via a secure, server-side Supabase Edge Function.',
      'This data transmission is proxied through our server — your trade data is sent to Google Gemini\'s servers to generate the analysis, and the response is returned to you. Your trade data is not stored by Google beyond the lifetime of the API request (subject to Google\'s data processing agreements).',
      'If you supply a personal Gemini API key in Settings, it is used in place of the Vantix server key. In either case, the key travels only over HTTPS and is not retained by Vantix.',
      'You can opt out of AI Coach analysis at any time by not using the AI Coach feature. Disabling the feature or removing your API key prevents any trade data from being sent to Google Gemini.',
    ],
  },
  {
    title: '4. Browser Storage & Consent',
    body: [
      'Vantix stores the following data in your browser\'s localStorage to provide the service:',
      '• vantix_finnhub_key — your Finnhub API key (if provided)',
      '• vantix_gemini_key — your personal Google Gemini API key (if provided)',
      '• vantix_consent — your cookie/storage consent preference ("all" or "essential")',
      '• vantix-sidebar — your sidebar collapsed/expanded preference',
      '• sb-* keys — Supabase authentication session tokens (managed by the Supabase SDK)',
      'We do not use third-party tracking cookies. All storage entries listed above are first-party, functional, or strictly necessary for the service to operate.',
      'By clicking "Accept All" in the consent banner, you also consent to anonymous usage analytics. By clicking "Essential Only", only the functional storage entries listed above are stored.',
    ],
  },
  {
    title: '5. How We Use Your Information',
    body: [
      'Your email address is used only for authentication, account recovery, and to send alert notifications that you explicitly configure. We do not use your email for unsolicited marketing without your consent.',
      'Trade journal data is used solely to power the AI Coach Insights and Scenario Simulator features within your account. This data is never used to train shared AI models or shared with third parties beyond the Google Gemini API call described in Section 3.',
      'We may use aggregated, anonymized usage data to improve Platform features, fix bugs, and prioritize product development.',
    ],
  },
  {
    title: '6. Data Storage & Security',
    body: [
      'User data is stored in Supabase (PostgreSQL), which enforces Row Level Security (RLS) policies ensuring each user can only read and write their own data. Even database administrators cannot read your journal entries through normal application queries.',
      'All data in transit is encrypted via TLS. Supabase encrypts data at rest using AES-256.',
      'Authentication tokens are stored in your browser\'s localStorage by the Supabase SDK and are automatically invalidated when you log out or when the session expires.',
    ],
  },
  {
    title: '7. Feedback Submissions',
    body: [
      'When you submit feedback through the Feedback Widget, we collect your message, feedback category, star rating, and optionally your email address. This data is stored in our "public.feedback" table.',
      'Feedback data is accessible only to the Vantix development team and is used exclusively to improve the Platform. We do not share feedback content with third parties.',
      'A 60-second rate limit is enforced server-side to prevent spam submissions.',
    ],
  },
  {
    title: '8. Third-Party Services',
    body: [
      'Vantix uses Supabase for database and authentication services. Supabase\'s Privacy Policy governs how they handle data on their infrastructure.',
      'Vantix uses Google Gemini (via Google\'s Generative AI API) for AI Coach analysis. Trade data submitted to the AI Coach feature is processed by Google in accordance with Google\'s AI data processing terms.',
      'Payment processing for Vantix PRO subscriptions is handled entirely by Stripe. Vantix never sees, stores, or processes your payment card information. Stripe\'s Privacy Policy governs payment data.',
      'Market data (prices, charts) is fetched from Yahoo Finance, Finnhub, and CNN Financial via proxy requests. No personally identifiable information is transmitted in these requests.',
    ],
  },
  {
    title: '9. Data Retention',
    body: [
      'Your account data (journal entries, watchlist, alerts) is retained as long as your account is active. You may delete individual trade entries at any time from within the Journal view.',
      'If you request account deletion by contacting support@vantix.io, we will permanently delete all your personal data within 30 days, including journal entries, alert configurations, and your authentication record.',
      'Anonymized feedback submissions may be retained indefinitely as they contain no personally identifiable information.',
    ],
  },
  {
    title: '10. Your Rights',
    body: [
      'You have the right to access all personal data we hold about you. You may request a data export by contacting support@vantix.io.',
      'You have the right to rectification — if any data we hold about you is inaccurate, you may update it directly through the Platform or contact us.',
      'You have the right to erasure ("right to be forgotten"). Submit a deletion request to support@vantix.io and we will process it within 30 days.',
      'If you are located in the European Economic Area (EEA), you have additional rights under GDPR, including the right to data portability and the right to lodge a complaint with a supervisory authority.',
    ],
  },
  {
    title: '11. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. When we make significant changes, we will notify you by posting an update notice within the Platform.',
      'Your continued use of Vantix after such changes constitutes your acceptance of the updated Privacy Policy.',
    ],
  },
  {
    title: '12. Contact',
    body: [
      'If you have questions about this Privacy Policy or how your data is handled, please contact our privacy team at privacy@vantix.io.',
      'For accessibility-related concerns, contact accessibility@vantix.io. For general support, contact support@vantix.io.',
    ],
  },
];

export function PrivacyView() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-10 px-6 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-live/10 border border-live/20 text-live">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
              <p className="text-xs text-muted mt-0.5">Last updated: September 2026</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-live/20 bg-live/5">
            <p className="text-xs text-muted/80 leading-relaxed">
              <span className="font-semibold text-muted">Your data is yours.</span> Vantix collects only what is necessary to run the service. We never sell your data and never share it with advertisers.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {SECTIONS.map(({ title, body }) => (
            <div key={title} className="flex flex-col gap-2.5">
              <h2 className="text-sm font-bold text-white border-b border-border pb-2">{title}</h2>
              <div className="flex flex-col gap-2">
                {body.map((para, i) => (
                  <p key={i} className="text-xs text-muted leading-relaxed">{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted/40 text-center pb-4">
          © 2026 Vantix. For privacy inquiries, contact privacy@vantix.io
        </p>

      </div>
    </div>
  );
}
