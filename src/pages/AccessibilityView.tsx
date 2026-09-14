import { Accessibility } from 'lucide-react';

interface Section { title: string; body: string[] }

const SECTIONS: Section[] = [
  {
    title: '1. Our Commitment',
    body: [
      'Vantix is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards to our platform.',
    ],
  },
  {
    title: '2. Conformance Status',
    body: [
      'Vantix targets conformance with Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and Israeli Standard IS 5568 (2021 amendment). These guidelines explain how to make web content more accessible to people with disabilities.',
      'Our current conformance status: Partially conformant — some parts of the content do not yet fully conform to the accessibility standard. We are actively working to resolve the remaining gaps described in Section 5.',
    ],
  },
  {
    title: '3. Technical Specifications',
    body: [
      'Vantix relies on the following web technologies for conformance with WCAG 2.1: HTML5, CSS3, WAI-ARIA (Accessible Rich Internet Applications), and JavaScript (React 18).',
      'All interactive components include accessible names via aria-label attributes. Keyboard focus is visually indicated via CSS focus-visible rings on all interactive elements.',
      'Color contrast ratios for primary text on the Vantix dark theme meet or exceed the 4.5:1 minimum ratio required by WCAG 2.1 Level AA. Form inputs include associated labels and error messages. All icon-only buttons carry descriptive aria-label attributes for screen reader users.',
    ],
  },
  {
    title: '4. Supported Assistive Technologies',
    body: [
      'Vantix is tested with and supports the following assistive technologies: NVDA with Mozilla Firefox (Windows); JAWS with Google Chrome (Windows); VoiceOver with Safari (macOS and iOS); TalkBack with Google Chrome (Android).',
      'Keyboard-only navigation is fully supported. All interactive elements are reachable via the Tab and Shift+Tab keys. All primary actions can be performed without a pointing device.',
      'The platform respects the prefers-reduced-motion system preference — users who have enabled reduced-motion in their operating system will see animations suppressed throughout the interface.',
    ],
  },
  {
    title: '5. Known Limitations',
    body: [
      'Despite our best efforts, some content does not yet fully conform. We are actively working to resolve the following:',
      '• Real-time financial charts (candlestick charts, sparklines) rely on SVG and canvas rendering and may not yet be fully accessible to screen readers. We are developing accessible text-based data alternatives for all chart views.',
      '• Some complex data tables in the Whale Tracker and Alerts views may benefit from additional ARIA table roles and navigation cues. This is under active review.',
      '• The AI Analyst voice synthesis feature may not be fully accessible in all screen reader configurations. A transcript mode is planned.',
    ],
  },
  {
    title: '6. Accessibility Features',
    body: [
      'High contrast: Vantix\'s dark theme uses high-contrast foreground colors designed to meet WCAG AA contrast requirements against the dark canvas background (#070709).',
      'Reduced motion: Vantix respects the prefers-reduced-motion media query. Ambient animations and page transition effects are suppressed for users who have enabled this preference.',
      'Text sizing: Vantix uses relative font units (rem/em) that scale proportionally with the browser\'s base font size setting.',
      'Focus indicators: CSS focus-visible rings are visible on all interactive elements for keyboard and switch-access users.',
      'Semantic HTML: navigational landmarks (main, nav, footer, aside) are used throughout the application to enable landmark-based navigation with assistive technologies.',
    ],
  },
  {
    title: '7. Feedback & Contact',
    body: [
      'We welcome your feedback on the accessibility of Vantix. If you experience barriers to access, or notice content or functionality that is not accessible to you, please contact our Accessibility Coordinator:',
      'Email: accessibility@vantix.io',
      'We aim to respond to all accessibility feedback within 5 business days, and to propose a remedy or a viable alternative within 30 days.',
    ],
  },
  {
    title: '8. Formal Complaints (IS 5568)',
    body: [
      'This accessibility statement applies to vantix.io and all subpaths of the web application. It was prepared in accordance with Israeli Government Decision 2409 (2014) and the IS 5568 standard (2021 amendment).',
      'If you are not satisfied with our response to an accessibility complaint, you may contact the Commission for Equal Rights of Persons with Disabilities within the Israeli Ministry of Justice.',
      'This statement was last reviewed and updated in September 2026.',
    ],
  },
];

export function AccessibilityView() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto py-10 px-6 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-gold">
              <Accessibility size={16} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Accessibility Statement</h1>
              <p className="text-xs text-muted mt-0.5">Last updated: September 2026 · IS 5568 / WCAG 2.1 AA</p>
            </div>
          </div>
          <div className="p-4 rounded-xl border border-gold/20 bg-gold/5">
            <p className="text-xs text-muted/80 leading-relaxed">
              <span className="font-semibold text-muted">IS 5568 / WCAG 2.1 Level AA</span> — Vantix is committed to making its platform accessible to all users, including people with disabilities. This statement reflects our current accessibility posture and our ongoing commitment to continuous improvement.
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
          © 2026 Vantix. Accessibility inquiries: accessibility@vantix.io
        </p>
      </div>
    </div>
  );
}
