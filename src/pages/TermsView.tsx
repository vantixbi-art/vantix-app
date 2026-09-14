import { Scale, TriangleAlert } from 'lucide-react';

interface Section { title: string; body: string[] }

const SECTIONS: Section[] = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using Vantix ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all terms and conditions, you may not access or use the Platform.',
      'These Terms apply to all visitors, users, and others who access or use the Platform.',
    ],
  },
  {
    title: '2. No Financial Advice',
    body: [
      'All content, data, AI-generated analysis, alerts, charts, whale flow indicators, options sentiment, scenario projections, and other materials provided by Vantix are strictly for informational and educational purposes only.',
      'Nothing on this Platform constitutes financial, investment, trading, tax, legal, or any other type of professional advice. Vantix is not a registered investment advisor, broker-dealer, financial planner, or any other type of licensed financial professional.',
      'You should not make any financial or investment decision solely or primarily based on content from this Platform. Always conduct your own independent research and consult a qualified financial professional before making investment decisions.',
    ],
  },
  {
    title: '3. Limitation of Liability',
    body: [
      'To the maximum extent permitted by applicable law, Vantix and its founders, officers, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, trading losses, loss of data, or loss of goodwill.',
      'Vantix provides the Platform on an "as is" and "as available" basis without any warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      'You expressly acknowledge and agree that use of the Platform is at your sole risk and that trading financial instruments involves a high level of risk and may not be suitable for all investors.',
    ],
  },
  {
    title: '4. AI-Generated Content Disclaimer',
    body: [
      'Vantix uses artificial intelligence and machine learning models, including Google Gemini, to generate market analysis, trading insights, and coaching feedback. These AI outputs are probabilistic in nature and are based on historical data patterns.',
      'AI-generated content may be inaccurate, incomplete, or misleading. Past performance of any pattern, indicator, or strategy identified by the AI does not guarantee future results. You should treat AI Coach insights and AI Analyst signals as one data point among many — not as definitive trade signals.',
      'When you use the AI Coach feature, your trade journal entries are transmitted to Google Gemini via a secure server-side proxy. By using this feature, you consent to this data processing. See our Privacy Policy for details.',
    ],
  },
  {
    title: '5. Alert Service Disclaimer',
    body: [
      'Smart Alerts are delivered on a best-effort basis via third-party email and notification infrastructure. Vantix does not guarantee the delivery, timing, or accuracy of any alert notification.',
      'Alerts are not intended for high-frequency or automated trading execution. Reliance on alerts for time-sensitive trading decisions is done entirely at your own risk. Network latency, email provider delays, and technical failures may cause missed or delayed alerts.',
    ],
  },
  {
    title: '6. Refund Policy',
    body: [
      'Vantix PRO subscriptions are eligible for a full refund within 7 calendar days of the initial purchase if you are not satisfied. To request a refund, contact our support team at support@vantix.io within the 7-day window.',
      'Refunds are not available after the 7-day period under any circumstances. Yearly subscriptions that are cancelled mid-term will not receive a pro-rated refund for the remaining subscription period.',
      'All subscription billing is handled by Stripe. Vantix does not store or have access to your payment card details.',
    ],
  },
  {
    title: '7. Prohibited Uses',
    body: [
      'You agree not to use the Platform to scrape, copy, or redistribute market data or AI outputs for commercial purposes without prior written consent from Vantix.',
      'You may not attempt to reverse-engineer, decompile, or extract the underlying AI models, algorithms, or proprietary scoring methods used by the Platform.',
      'You agree not to use the Platform in any manner that could disrupt, damage, or impair the Platform\'s availability or performance for other users.',
    ],
  },
  {
    title: '8. Modifications to Terms',
    body: [
      'Vantix reserves the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the Platform. Your continued use of the Platform after any changes constitutes your acceptance of the new terms.',
      'It is your responsibility to review these Terms periodically. If you do not agree to the modified Terms, you must discontinue use of the Platform.',
    ],
  },
  {
    title: '9. Governing Law',
    body: [
      'These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.',
      'Any disputes arising out of or related to these Terms or your use of the Platform shall be subject to the exclusive jurisdiction of the state and federal courts located in Delaware.',
    ],
  },
];

export function TermsView() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-10 px-6 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-gold">
              <Scale size={16} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Terms of Service</h1>
              <p className="text-xs text-muted mt-0.5">Last updated: September 2026</p>
            </div>
          </div>

          {/* Prominent financial disclaimer */}
          <div className="p-4 rounded-xl border border-alert/40 bg-alert/10 flex gap-3">
            <TriangleAlert size={16} className="text-alert shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <p className="text-xs font-bold text-alert">Not Financial Advice</p>
              <p className="text-xs text-muted/80 leading-relaxed">
                Vantix is an informational and educational platform only. Nothing on this platform — including AI analysis, alerts, charts, or whale flow data — constitutes financial, investment, or trading advice. You trade at your own risk. Always consult a qualified financial professional before making investment decisions.
              </p>
            </div>
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
          © 2026 Vantix. All rights reserved. For questions about these terms, contact legal@vantix.io
        </p>

      </div>
    </div>
  );
}
