export type Severity = 'blocker' | 'serious' | 'moderate' | 'minor';
export type Conformance = 'pass' | 'fail' | 'na';
export type OverallScore = 'compliant' | 'under-remediation' | 'non-compliant' | 'not-assessed';
export type RiskLevel = 'low' | 'medium' | 'high';
export type WCAGPrinciple = 'perceivable' | 'operable' | 'understandable' | 'robust';
export type ConformanceTarget = 'wcag22' | 'rgaa41';
export type ConformanceTargets = ConformanceTarget[];

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export const TEMPLATE_VARIABLES = [
  { key: '{{productName}}',      label: 'Product / Application name' },
  { key: '{{vendorName}}',       label: 'Vendor name' },
  { key: '{{serviceOwnerName}}', label: 'Service Owner name' },
  { key: '{{serviceOwnerEmail}}',label: 'Service Owner email' },
  { key: '{{auditorName}}',      label: 'Auditor name' },
  { key: '{{dateFrom}}',         label: 'Audit date (from)' },
  { key: '{{rescanDate}}',       label: 'Rescan date' },
  { key: '{{year}}',             label: 'Current year' },
] as const;

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-initial',
    name: 'Initial VPAT Request',
    description: 'First contact asking the Service Owner to request a VPAT from the vendor.',
    subject: 'Action Required: Accessibility VPAT Request — {{productName}}',
    body: `Dear {{serviceOwnerName}},

I hope this email finds you well.

As part of Capgemini's ongoing commitment to digital accessibility and compliance, we are conducting an annual accessibility review of {{productName}}, supplied by {{vendorName}}.

Under WCAG 2.2 and our internal Accessibility Policy, we are required to obtain a current Voluntary Product Accessibility Template (VPAT) / Accessibility Conformance Report (ACR) from the vendor for all third-party software solutions.

Could you please contact {{vendorName}} and request their latest VPAT / ACR document? If the vendor does not have one, please ask them to provide a timeline for when one will be available.

Please could you forward the VPAT to our accessibility team once received, or let us know if there are any difficulties in obtaining it.

If you have any questions, please do not hesitate to get in touch.

Kind regards,
{{auditorName}}
Capgemini Digital Accessibility Team`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-followup',
    name: 'Follow-up Reminder',
    description: 'A polite chase if no response has been received after the initial request.',
    subject: 'Follow-up: VPAT Request — {{productName}}',
    body: `Dear {{serviceOwnerName}},

I am following up on my previous email regarding the Accessibility VPAT for {{productName}} ({{vendorName}}).

We have not yet received a response or confirmation that a VPAT has been requested from the vendor. As this forms part of our mandatory accessibility compliance process, we would appreciate an update at your earliest convenience.

Could you please let us know:
1. Whether you have been able to contact {{vendorName}} regarding the VPAT?
2. If so, what response you received and the expected timeline for receiving the document?

If there is anything we can do to assist or if you have any questions, please do not hesitate to contact us.

Thank you for your attention to this matter.

Kind regards,
{{auditorName}}
Capgemini Digital Accessibility Team`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-risk',
    name: 'Risk Register Warning',
    description: 'Formal notice that the application will be added to the risk register due to non-compliance.',
    subject: 'Urgent: Accessibility Non-Compliance — {{productName}} to be added to Risk Register',
    body: `Dear {{serviceOwnerName}},

I am writing to inform you that, despite our previous communications, we have not received a Voluntary Product Accessibility Template (VPAT) for {{productName}} ({{vendorName}}).

As a result of this outstanding action, {{productName}} will be formally added to Capgemini's Accessibility Risk Register. This means:

• The application will be flagged as high-risk from an accessibility compliance perspective.
• The risk will be escalated to your line management and relevant stakeholders.
• Continued use of the application without a valid VPAT may be subject to review and potential procurement challenge.

To prevent this escalation, please provide us with either:
a) A current VPAT / Accessibility Conformance Report from {{vendorName}}, or
b) A confirmed timeline from the vendor for when a VPAT will be made available.

We would like to resolve this matter without escalation and are happy to assist you in contacting the vendor if required.

Please respond to this email by return as a matter of urgency.

Kind regards,
{{auditorName}}
Capgemini Digital Accessibility Team`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export interface AuditPage {
  id: string;
  number: number;
  pageType: string;
  url: string;
  comment: string;
}

export interface WCAGCriterion {
  id: string;
  criterion: string;
  name: string;
  principle: WCAGPrinciple;
  level: 'A' | 'AA';
  passCondition: string;
}

export interface AuditFinding {
  id: string;
  criterionId: string;
  pageComponent: string;
  method: string;
  conformance: Conformance | null;
  severity: Severity | null;
  recommendations: string;
  notes: string;
  windows: string;
  android: string;
  ios: string;
  mac: string;
  jiraTicket: string;
  azdoTicket: string;
}

export type SoftwareType = 'home-grown' | 'cots';
export type CotsScope = 'vpat-request' | 'customization' | 'both';
export type VpatStatus = 'not-requested' | 'requested' | 'received' | 'reviewed';

export type AuditPlatform = 'web' | 'mobile-ios' | 'mobile-android' | 'mobile-both' | 'desktop-app' | 'pdf-document' | 'kiosk' | 'cisco-touchpad' | 'other';

export const AUDIT_PLATFORM_CONFIG: Record<AuditPlatform, { label: string; icon: string }> = {
  'web':            { label: 'Web',                    icon: '🌐' },
  'mobile-ios':     { label: 'Mobile app (iOS)',        icon: '🍎' },
  'mobile-android': { label: 'Mobile app (Android)',    icon: '🤖' },
  'mobile-both':    { label: 'Mobile app (iOS & Android)', icon: '📱' },
  'desktop-app':    { label: 'Desktop application',    icon: '🖥️' },
  'pdf-document':   { label: 'PDF / Document',          icon: '📄' },
  'kiosk':          { label: 'Kiosk / Digital signage', icon: '🖨️' },
  'cisco-touchpad': { label: 'Cisco Touch Pad (meeting room)', icon: '📲' },
  'other':          { label: 'Other',                   icon: '⚙️' },
};

export type ContentType = 'images' | 'video' | 'audio' | 'live-streaming' | 'forms' | 'captcha' | 'animation' | 'timed-sessions' | 'drag-drop' | 'pdf' | 'word' | 'powerpoint';

export const CONTENT_TYPE_CONFIG: Record<ContentType, { label: string; description: string; criteria: string[] }> = {
  'images':          { label: 'Images', description: 'Photos, icons, illustrations, images of text', criteria: ['1.1.1', '1.4.5'] },
  'video':           { label: 'Video (pre-recorded)', description: 'Embedded video players, recorded content', criteria: ['1.2.1', '1.2.2', '1.2.3', '1.2.5'] },
  'audio':           { label: 'Audio', description: 'Podcasts, audio players, auto-playing sound', criteria: ['1.2.1', '1.4.2'] },
  'live-streaming':  { label: 'Live streaming', description: 'Live video or audio broadcasts', criteria: ['1.2.4'] },
  'forms':           { label: 'Forms', description: 'Input fields, dropdowns, checkboxes, submit actions', criteria: ['1.3.5', '3.2.2', '3.3.1', '3.3.2', '3.3.3', '3.3.4', '3.3.7', '4.1.3'] },
  'captcha':         { label: 'CAPTCHA / Authentication', description: 'Login puzzles, bot-prevention challenges', criteria: ['3.3.8'] },
  'animation':       { label: 'Animation / Moving content', description: 'Carousels, looping animations, flashing elements', criteria: ['2.2.2', '2.3.1'] },
  'timed-sessions':  { label: 'Timed sessions', description: 'Session timeouts, countdown timers', criteria: ['2.2.1'] },
  'drag-drop':       { label: 'Drag & Drop', description: 'Sortable lists, file drop zones, kanban boards', criteria: ['2.5.7'] },
  'pdf':             { label: 'PDF documents', description: 'Embedded or downloadable PDF files', criteria: ['1.3.1', '1.3.2', '2.4.2', '3.1.1'] },
  'word':            { label: 'Word documents', description: 'Downloadable .docx / .doc files', criteria: ['1.3.1', '1.3.2', '2.4.2', '3.1.1'] },
  'powerpoint':      { label: 'PowerPoint presentations', description: 'Downloadable .pptx / .ppt files', criteria: ['1.1.1', '1.3.1', '1.3.2', '2.4.2', '3.1.1'] },
};

// Criteria that are ONLY relevant when a specific content type is present
export const CONTENT_SPECIFIC_CRITERIA = new Set(
  Object.values(CONTENT_TYPE_CONFIG).flatMap(c => c.criteria)
);

export interface RGAACriterion {
  id: string;
  criterion: string;
  name: string;
  level: 'A' | 'AA';
  theme: string;
  passCondition: string;
}

export interface AuditProject {
  productName: string;
  platform: AuditPlatform;
  conformanceTargets: ConformanceTarget[];
  contentTypes: ContentType[];
  softwareType: SoftwareType;
  // COTS-specific
  cotsScope: CotsScope;
  vendorName: string;
  serviceOwnerName: string;
  serviceOwnerEmail: string;
  vpatStatus: VpatStatus;
  vpatReceivedDate: string;
  vpatNotes: string;
  // Common
  dateFrom: string;
  dateTo: string;
  conductedBy: string;
  poEmail: string;
  rescanDate: string;
  comments: string;
  browsers: string;
  os: string;
  devices: string;
  assistiveTech: string;
  manualMethods: string;
  automatedTools: string;
  context: string;
  overallScore: OverallScore;
  riskLevel: RiskLevel;
}

export const VPAT_STATUS_CONFIG: Record<VpatStatus, { label: string; color: string }> = {
  'not-requested': { label: 'Not Requested', color: 'text-gray-500' },
  'requested':     { label: 'Requested', color: 'text-yellow-600' },
  'received':      { label: 'Received', color: 'text-blue-600' },
  'reviewed':      { label: 'Reviewed', color: 'text-green-600' },
};

export interface AuditRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  project: AuditProject;
  findings: AuditFinding[];
  pages: AuditPage[];
}

export const WCAG_CRITERIA: WCAGCriterion[] = [
  // Perceivable
  { id: '1.1.1', criterion: '1.1.1', name: 'Text Alternatives', principle: 'perceivable', level: 'A', passCondition: 'All meaningful images have accurate alt text; decorative images have no alt text and are ignored by screen reader.' },
  { id: '1.2.1', criterion: '1.2.1', name: 'Audio-only and Video-only (Pre-recorded)', principle: 'perceivable', level: 'A', passCondition: 'Audio-only: text transcript provided. Video-only: text or audio description provided.' },
  { id: '1.2.2', criterion: '1.2.2', name: 'Captions (Pre-recorded)', principle: 'perceivable', level: 'AA', passCondition: 'Captions are available for prerecorded videos with audio (unless the video itself is a text alternative).' },
  { id: '1.2.3', criterion: '1.2.3', name: 'Audio Description or Media Alternative (Pre-recorded)', principle: 'perceivable', level: 'A', passCondition: 'An audio description or text alternative is provided for prerecorded videos with visual information.' },
  { id: '1.2.4', criterion: '1.2.4', name: 'Captions (Live)', principle: 'perceivable', level: 'AA', passCondition: 'Live videos with speech include captions while the audio is playing.' },
  { id: '1.2.5', criterion: '1.2.5', name: 'Audio Description (Pre-recorded)', principle: 'perceivable', level: 'AA', passCondition: 'Prerecorded videos include an audio track that describes key visual details, actions, scene changes, or text shown on screen.' },
  { id: '1.3.1', criterion: '1.3.1', name: 'Info and Relationships', principle: 'perceivable', level: 'A', passCondition: 'Headings, lists, tables, and form labels are coded correctly so screen readers can understand the structure and relationships.' },
  { id: '1.3.2', criterion: '1.3.2', name: 'Meaningful Sequence', principle: 'perceivable', level: 'A', passCondition: 'The reading order of the page follows a logical sequence that matches the visual order.' },
  { id: '1.3.3', criterion: '1.3.3', name: 'Sensory Characteristics', principle: 'perceivable', level: 'A', passCondition: 'Instructions do not rely solely on sensory characteristics such as shape, color, size, visual location, orientation, or sound.' },
  { id: '1.3.4', criterion: '1.3.4', name: 'Orientation', principle: 'perceivable', level: 'AA', passCondition: 'Content does not restrict its view to a single display orientation, unless a specific display orientation is essential.' },
  { id: '1.3.5', criterion: '1.3.5', name: 'Identify Input Purpose', principle: 'perceivable', level: 'AA', passCondition: 'Form fields for personal info include proper autocomplete tags so browsers and assistive tech know what each field is for.' },
  { id: '1.4.1', criterion: '1.4.1', name: 'Use of Color', principle: 'perceivable', level: 'A', passCondition: 'Information or actions are also shown with text, icons, or patterns, not just color.' },
  { id: '1.4.2', criterion: '1.4.2', name: 'Audio Control', principle: 'perceivable', level: 'A', passCondition: 'If audio plays automatically for more than 3 seconds, users can pause, stop, or adjust its volume separately from the system volume.' },
  { id: '1.4.3', criterion: '1.4.3', name: 'Contrast (Minimum)', principle: 'perceivable', level: 'AA', passCondition: 'Text and images of text have at least 4.5:1 contrast with the background. Large text (18pt or 14pt bold) needs at least 3:1.' },
  { id: '1.4.4', criterion: '1.4.4', name: 'Resize Text', principle: 'perceivable', level: 'AA', passCondition: 'Text can be resized without assistive technology up to 200% without loss of content or functionality.' },
  { id: '1.4.5', criterion: '1.4.5', name: 'Images of Text', principle: 'perceivable', level: 'AA', passCondition: 'Information is presented using real text rather than images of text, except when a specific visual style is essential.' },
  { id: '1.4.10', criterion: '1.4.10', name: 'Reflow', principle: 'perceivable', level: 'AA', passCondition: 'Content reflows correctly when zoomed in up to 400% or viewed on a small screen, without requiring both horizontal and vertical scrolling.' },
  { id: '1.4.11', criterion: '1.4.11', name: 'Non-text Contrast', principle: 'perceivable', level: 'AA', passCondition: 'Visual elements such as icons, form fields, and focus indicators have at least a 3:1 contrast ratio against adjacent colors.' },
  { id: '1.4.12', criterion: '1.4.12', name: 'Text Spacing', principle: 'perceivable', level: 'AA', passCondition: 'Text remains readable and functional when spacing is increased. Line height 1.5×, paragraph spacing 2×, letter spacing 0.12×, word spacing 0.16×.' },
  { id: '1.4.13', criterion: '1.4.13', name: 'Content on Hover or Focus', principle: 'perceivable', level: 'AA', passCondition: 'When extra content appears on hover or focus (like tooltips), users can move the pointer over it without it disappearing.' },
  // Operable
  { id: '2.1.1', criterion: '2.1.1', name: 'Keyboard', principle: 'operable', level: 'A', passCondition: 'All functions on the page can be used with a keyboard alone, without needing a mouse or special timing between key presses.' },
  { id: '2.1.2', criterion: '2.1.2', name: 'No Keyboard Trap', principle: 'operable', level: 'A', passCondition: 'Users can move focus to and away from any element using only the keyboard. If special keys are needed to exit, clear instructions are provided.' },
  { id: '2.1.4', criterion: '2.1.4', name: 'Character Key Shortcuts', principle: 'operable', level: 'A', passCondition: 'If single-key shortcuts are used, users can turn them off, remap them, or they only work when the related element is focused.' },
  { id: '2.2.1', criterion: '2.2.1', name: 'Timing Adjustable', principle: 'operable', level: 'A', passCondition: 'If content has a time limit, users can turn it off, get a warning, or extend the time.' },
  { id: '2.2.2', criterion: '2.2.2', name: 'Pause, Stop, Hide', principle: 'operable', level: 'A', passCondition: 'Any moving or auto-updating content that starts automatically and runs for more than 5 seconds must have a way to pause, stop, or hide it.' },
  { id: '2.3.1', criterion: '2.3.1', name: 'Three Flashes or Below Threshold', principle: 'operable', level: 'A', passCondition: 'Web pages do not contain anything that flashes more than three times in any one second period.' },
  { id: '2.4.1', criterion: '2.4.1', name: 'Bypass Blocks', principle: 'operable', level: 'A', passCondition: 'A mechanism is available to bypass blocks of content that are repeated on multiple web pages ("Skip to main content").' },
  { id: '2.4.2', criterion: '2.4.2', name: 'Page Titled', principle: 'operable', level: 'A', passCondition: 'Web pages have titles that describe topic or purpose.' },
  { id: '2.4.3', criterion: '2.4.3', name: 'Focus Order', principle: 'operable', level: 'A', passCondition: 'When navigating with a keyboard, focus moves in a logical order that matches the visual layout and preserves meaning and usability.' },
  { id: '2.4.4', criterion: '2.4.4', name: 'Link Purpose (In Context)', principle: 'operable', level: 'A', passCondition: "Each link's purpose is clear from its text or nearby context, so users know where it leads without guessing." },
  { id: '2.4.5', criterion: '2.4.5', name: 'Multiple Ways', principle: 'operable', level: 'AA', passCondition: 'Provide at least two ways to find each page (e.g., navigation menu, search, sitemap, or links).' },
  { id: '2.4.6', criterion: '2.4.6', name: 'Headings and Labels', principle: 'operable', level: 'AA', passCondition: 'Headings and labels describe topic or purpose.' },
  { id: '2.4.7', criterion: '2.4.7', name: 'Focus Visible', principle: 'operable', level: 'AA', passCondition: 'Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.' },
  { id: '2.4.11', criterion: '2.4.11', name: 'Focus Not Obscured (Minimum) – New in 2.2', principle: 'operable', level: 'AA', passCondition: 'When a user interface component receives keyboard focus, no part of the component is hidden by author-created content.' },
  { id: '2.5.1', criterion: '2.5.1', name: 'Pointer Gestures', principle: 'operable', level: 'A', passCondition: 'All functions using multipoint or path-based gestures must also be operable with a single pointer.' },
  { id: '2.5.2', criterion: '2.5.2', name: 'Pointer Cancellation', principle: 'operable', level: 'A', passCondition: 'Actions triggered by a single pointer should only complete on release, not on press, so users can cancel or undo mistakes.' },
  { id: '2.5.3', criterion: '2.5.3', name: 'Label in Name', principle: 'operable', level: 'A', passCondition: 'For user interface components with labels that include text or images of text, the name contains the text that is presented visually.' },
  { id: '2.5.4', criterion: '2.5.4', name: 'Motion Actuation', principle: 'operable', level: 'A', passCondition: 'If a feature works by device or user motion, it must also be operable through a standard control, and motion activation can be turned off.' },
  { id: '2.5.7', criterion: '2.5.7', name: 'Dragging Movements – New in 2.2', principle: 'operable', level: 'AA', passCondition: 'If an action requires dragging, users must also be able to perform it with a simple click or tap instead of drag gestures.' },
  { id: '2.5.8', criterion: '2.5.8', name: 'Target Size (Minimum) – New in 2.2', principle: 'operable', level: 'AA', passCondition: 'Pointer targets (like buttons or icons) must be at least 24×24 CSS pixels, or spaced so users can easily select them without hitting nearby elements.' },
  // Understandable
  { id: '3.1.1', criterion: '3.1.1', name: 'Language of Page', principle: 'understandable', level: 'A', passCondition: 'The default human language of each web page can be programmatically determined.' },
  { id: '3.1.2', criterion: '3.1.2', name: 'Language of Parts', principle: 'understandable', level: 'AA', passCondition: 'Each passage or phrase in a different language must be programmatically identified.' },
  { id: '3.2.1', criterion: '3.2.1', name: 'On Focus', principle: 'understandable', level: 'A', passCondition: 'When any user interface component receives focus, it does not initiate a change of context.' },
  { id: '3.2.2', criterion: '3.2.2', name: 'On Input', principle: 'understandable', level: 'A', passCondition: 'Changing a form field or control should not automatically trigger a major change unless the user is warned beforehand.' },
  { id: '3.2.3', criterion: '3.2.3', name: 'Consistent Navigation', principle: 'understandable', level: 'AA', passCondition: 'Navigation menus and other repeated elements must appear in the same order on every page.' },
  { id: '3.2.4', criterion: '3.2.4', name: 'Consistent Identification', principle: 'understandable', level: 'AA', passCondition: 'Interactive elements that serve the same purpose must be labeled and identified in the same way across all pages.' },
  { id: '3.2.6', criterion: '3.2.6', name: 'Consistent Help – New in 2.2', principle: 'understandable', level: 'A', passCondition: 'If help options appear on multiple pages, they must always be in the same place and order unless the user changes it.' },
  { id: '3.3.1', criterion: '3.3.1', name: 'Error Identification', principle: 'understandable', level: 'A', passCondition: 'When a user makes a mistake in a form, the specific field with the error must be clearly identified, and the problem explained in text.' },
  { id: '3.3.2', criterion: '3.3.2', name: 'Labels or Instructions', principle: 'understandable', level: 'A', passCondition: 'Labels or instructions are provided when content requires user input.' },
  { id: '3.3.3', criterion: '3.3.3', name: 'Error Suggestion', principle: 'understandable', level: 'AA', passCondition: 'If a form error is found and a fix is known, show a suggestion to help the user correct it.' },
  { id: '3.3.4', criterion: '3.3.4', name: 'Error Prevention (Legal, Financial, Data)', principle: 'understandable', level: 'AA', passCondition: 'For pages where users make legal, financial, or data-changing actions, users can undo, the system checks errors, or users can review before submission.' },
  { id: '3.3.7', criterion: '3.3.7', name: 'Redundant Entry – New in 2.2', principle: 'understandable', level: 'A', passCondition: 'Users should not have to re-enter the same information within a single process. Data should be auto-filled or selectable.' },
  { id: '3.3.8', criterion: '3.3.8', name: 'Accessible Authentication (Minimum) – New in 2.2', principle: 'understandable', level: 'AA', passCondition: 'Users must be able to log in or verify their identity without relying only on memory or puzzles.' },
  // Robust
  { id: '4.1.2', criterion: '4.1.2', name: 'Name, Role, Value', principle: 'robust', level: 'A', passCondition: 'Every interactive element must tell assistive technology what it is, what it does, and what its current state is.' },
  { id: '4.1.3', criterion: '4.1.3', name: 'Status Messages', principle: 'robust', level: 'AA', passCondition: 'Status messages must be announced by screen readers automatically, without moving focus, so users know when something has changed.' },
];

export const DEFAULT_PROJECT: AuditProject = {
  productName: '',
  platform: 'web',
  conformanceTargets: ['wcag22'],
  contentTypes: [],
  softwareType: 'home-grown',
  cotsScope: 'customization',
  vendorName: '',
  serviceOwnerName: '',
  serviceOwnerEmail: '',
  vpatStatus: 'not-requested',
  vpatReceivedDate: '',
  vpatNotes: '',
  dateFrom: new Date().toISOString().slice(0, 10),
  dateTo: '',
  conductedBy: '',
  poEmail: '',
  rescanDate: '',
  comments: '',
  browsers: 'Chrome, Firefox, Safari',
  os: '',
  devices: '',
  assistiveTech: 'Screen reader',
  manualMethods: 'Keyboard navigation, focus order, landmarks, forms, error handling, zoom/reflow, text spacing',
  automatedTools: 'Axe DevTools',
  context: '',
  overallScore: 'not-assessed',
  riskLevel: 'low',
};

export const RGAA_CRITERIA: RGAACriterion[] = [
  // Theme 1 — Images
  { id: 'rgaa-1.1', criterion: 'RGAA 1.1', name: 'Decorative image — empty alt + role="presentation"', level: 'A', theme: 'Images', passCondition: 'Each decorative image has an empty alt attribute AND role="presentation" (or is a CSS background image).' },
  { id: 'rgaa-1.2', criterion: 'RGAA 1.2', name: 'SVG image accessibility', level: 'A', theme: 'Images', passCondition: 'Each informative SVG image has a <title> as its first child (or aria-label / aria-labelledby) and role="img".' },
  // Theme 2 — Frames
  { id: 'rgaa-2.1', criterion: 'RGAA 2.1', name: 'Frame / iframe has a title', level: 'A', theme: 'Frames', passCondition: 'Every <iframe> and <frame> element has a non-empty title attribute describing the frame\'s purpose.' },
  { id: 'rgaa-2.2', criterion: 'RGAA 2.2', name: 'Frame title is relevant', level: 'A', theme: 'Frames', passCondition: 'Each frame\'s title attribute accurately describes the content or purpose of the frame.' },
  // Theme 3 — Colors
  { id: 'rgaa-3.1', criterion: 'RGAA 3.1', name: 'Information not conveyed by color alone', level: 'A', theme: 'Colors', passCondition: 'No information is conveyed solely by color; a non-color alternative (text label, pattern, icon, shape) is always also present.' },
  // Theme 5 — Tables
  { id: 'rgaa-5.4', criterion: 'RGAA 5.4', name: 'Complex data table has a caption or summary', level: 'A', theme: 'Tables', passCondition: 'Each complex data table has a <caption> element, or aria-describedby pointing to a visible summary.' },
  { id: 'rgaa-5.6', criterion: 'RGAA 5.6', name: 'Header cells have scope attribute', level: 'A', theme: 'Tables', passCondition: 'Each <th> element has a scope attribute set to "col", "row", "colgroup", or "rowgroup".' },
  { id: 'rgaa-5.7', criterion: 'RGAA 5.7', name: 'Complex table — id/headers association correct', level: 'A', theme: 'Tables', passCondition: 'Where id/headers are used for complex tables, each data cell\'s headers attribute correctly references all relevant header ids.' },
  // Theme 6 — Links
  { id: 'rgaa-6.2', criterion: 'RGAA 6.2', name: 'Link title attribute is relevant', level: 'A', theme: 'Links', passCondition: 'Any link title attribute adds information beyond what is already in the link text; it is not a duplicate of the link text.' },
  // Theme 8 — Mandatory elements
  { id: 'rgaa-8.1', criterion: 'RGAA 8.1', name: 'Source code has no accessibility-critical errors', level: 'A', theme: 'Mandatory elements', passCondition: 'No duplicate id attributes, invalid ARIA roles, or malformed landmark structure that would block assistive technology.' },
  { id: 'rgaa-8.3', criterion: 'RGAA 8.3', name: 'Default language declared on <html>', level: 'A', theme: 'Mandatory elements', passCondition: 'The <html> element has a lang attribute set to the correct primary language of the page (e.g. lang="fr").' },
  { id: 'rgaa-8.4', criterion: 'RGAA 8.4', name: 'Language code is valid (BCP 47)', level: 'A', theme: 'Mandatory elements', passCondition: 'The lang attribute value is a valid BCP 47 language tag (e.g. "fr", "en", "fr-FR").' },
  { id: 'rgaa-8.7', criterion: 'RGAA 8.7', name: 'Language changes are marked', level: 'AA', theme: 'Mandatory elements', passCondition: 'Each passage of text in a language different from the page default has a lang attribute on its containing element.' },
  { id: 'rgaa-8.9', criterion: 'RGAA 8.9', name: 'Tags used for their semantic purpose', level: 'A', theme: 'Mandatory elements', passCondition: 'HTML elements are used for their semantic meaning, not purely for visual presentation (e.g. <blockquote> only for quotations).' },
  // Theme 9 — Structure
  { id: 'rgaa-9.1', criterion: 'RGAA 9.1', name: 'Heading hierarchy is coherent', level: 'A', theme: 'Structure', passCondition: 'Heading levels (h1–h6) form a logical, non-skipping hierarchy that reflects the structure of the page content.' },
  { id: 'rgaa-9.2', criterion: 'RGAA 9.2', name: 'Document uses landmark regions', level: 'A', theme: 'Structure', passCondition: 'The page uses HTML5 landmark elements (<header>, <nav>, <main>, <footer>) or equivalent ARIA landmark roles to identify major regions.' },
  { id: 'rgaa-9.3', criterion: 'RGAA 9.3', name: 'Lists are correctly structured', level: 'A', theme: 'Structure', passCondition: 'Lists use <ul>, <ol>, or <dl> markup; lists are not simulated with line breaks, dashes, or visual spacing alone.' },
  // Theme 10 — Presentation
  { id: 'rgaa-10.7', criterion: 'RGAA 10.7', name: 'Focus visible on all interactive elements', level: 'AA', theme: 'Presentation', passCondition: 'Every interactive element displays a clearly visible focus indicator when focused by keyboard; focus is never removed without a styled replacement.' },
  { id: 'rgaa-10.8', criterion: 'RGAA 10.8', name: 'Information not conveyed by shape, size or position alone', level: 'A', theme: 'Presentation', passCondition: 'Instructions do not rely solely on shape, size, or visual location ("the round button", "the field on the right") to identify UI elements.' },
  // Theme 11 — Forms
  { id: 'rgaa-11.10', criterion: 'RGAA 11.10', name: 'Form inputs use appropriate type attribute', level: 'A', theme: 'Forms', passCondition: 'Input fields use the most descriptive type attribute (email, tel, date, number, url, search) to aid users and activate correct mobile keyboards.' },
  { id: 'rgaa-11.13', criterion: 'RGAA 11.13', name: 'Autocomplete on personal data fields', level: 'AA', theme: 'Forms', passCondition: 'Fields collecting personal data (name, address, phone, email) have the correct autocomplete attribute value from the WCAG autocomplete token list.' },
  // Theme 12 — Navigation
  { id: 'rgaa-12.1', criterion: 'RGAA 12.1', name: 'Multiple navigation methods available', level: 'AA', theme: 'Navigation', passCondition: 'The site provides at least two of: navigation menu, site map, or search functionality.' },
  { id: 'rgaa-12.2', criterion: 'RGAA 12.2', name: 'Navigation menu is consistent across pages', level: 'AA', theme: 'Navigation', passCondition: 'The navigation menu appears in the same location and in the same order on all pages where it is present.' },
  { id: 'rgaa-12.7', criterion: 'RGAA 12.7', name: 'Skip navigation link present', level: 'A', theme: 'Navigation', passCondition: 'A "skip to main content" link (or equivalent) is the first focusable element on each page, allowing keyboard users to bypass repetitive navigation.' },
  // Theme 13 — Consultation
  { id: 'rgaa-13.7', criterion: 'RGAA 13.7', name: 'Downloadable documents are accessible', level: 'AA', theme: 'Consultation', passCondition: 'Each downloadable document (PDF, Office file, etc.) is either natively accessible or an accessible alternative version is provided.' },
  { id: 'rgaa-13.8', criterion: 'RGAA 13.8', name: 'Cryptic content has a text alternative', level: 'A', theme: 'Consultation', passCondition: 'ASCII art, emoticons, and text-based visual expressions that convey meaning are accompanied by a text alternative or contextual explanation.' },
  { id: 'rgaa-13.12', criterion: 'RGAA 13.12', name: 'Moving or auto-updating content can be controlled', level: 'A', theme: 'Consultation', passCondition: 'Any moving, scrolling, blinking, or automatically updating content can be paused, stopped, or hidden by the user.' },
];

export const RGAA_THEMES = [...new Set(RGAA_CRITERIA.map(c => c.theme))];

export const DEFAULT_PAGES: AuditPage[] = [
  { id: '1', number: 1, pageType: 'Home page', url: '', comment: '' },
  { id: '2', number: 2, pageType: 'Landing page', url: '', comment: '' },
  { id: '3', number: 3, pageType: 'Landing page', url: '', comment: '' },
  { id: '4', number: 4, pageType: 'Sub-landing page', url: '', comment: '' },
  { id: '5', number: 5, pageType: 'Detail page', url: '', comment: '' },
  { id: '6', number: 6, pageType: 'Functional page', url: '', comment: '' },
];

export const SEVERITY_CONFIG = {
  blocker: { label: 'Blocker', color: 'bg-red-100 text-red-800 border-red-200', dot: 'bg-red-500', definition: 'Prevents task completion entirely for some users (e.g., keyboard trap, missing form labels)' },
  serious: { label: 'Serious', color: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500', definition: 'Severely hinders use or understanding, limited workarounds available' },
  moderate: { label: 'Moderate', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', dot: 'bg-yellow-500', definition: 'Causes usability issues or confusion for some users, but task still possible' },
  minor: { label: 'Minor', color: 'bg-gray-100 text-gray-700 border-gray-200', dot: 'bg-gray-400', definition: 'Cosmetic or low impact issue' },
};

export const CONFORMANCE_CONFIG = {
  pass: { label: 'Pass', color: 'bg-green-100 text-green-800', short: 'P' },
  fail: { label: 'Fail', color: 'bg-red-100 text-red-800', short: 'F' },
  na: { label: 'N/A', color: 'bg-gray-100 text-gray-600', short: 'N/A' },
};

export const SCORE_CONFIG = {
  compliant: { label: 'Compliant', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: '✓' },
  'under-remediation': { label: 'Under Remediation', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200', icon: '⟳' },
  'non-compliant': { label: 'Non-Compliant', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: '✗' },
  'not-assessed': { label: 'Not Assessed', color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', icon: '?' },
};

export const RISK_CONFIG = {
  low: { label: 'Low', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  medium: { label: 'Medium', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  high: { label: 'High', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};
