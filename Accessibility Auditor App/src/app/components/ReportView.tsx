import { useState } from 'react';
import { Mail, Download, Send, Copy, CheckCheck, FileText, ExternalLink, Building2, Code2, FileCheck } from 'lucide-react';
import { AuditProject, AuditFinding, AuditPage, WCAG_CRITERIA, SEVERITY_CONFIG, SCORE_CONFIG, RISK_CONFIG, VPAT_STATUS_CONFIG } from './types';
import { toast } from 'sonner';

interface Props {
  project: AuditProject;
  findings: AuditFinding[];
  pages: AuditPage[];
}

function buildEmailBody(project: AuditProject, findings: AuditFinding[], pages: AuditPage[]): string {
  const failed = findings.filter(f => f.conformance === 'fail');
  const passed = findings.filter(f => f.conformance === 'pass');
  const na = findings.filter(f => f.conformance === 'na');

  const bySeverity = {
    blocker: failed.filter(f => f.severity === 'blocker').length,
    serious: failed.filter(f => f.severity === 'serious').length,
    moderate: failed.filter(f => f.severity === 'moderate').length,
    minor: failed.filter(f => f.severity === 'minor').length,
  };

  const score = SCORE_CONFIG[project.overallScore].label;
  const risk = RISK_CONFIG[project.riskLevel].label;
  const conformanceRate = passed.length + failed.length > 0
    ? Math.round((passed.length / (passed.length + failed.length)) * 100)
    : 0;

  const issueLines = failed.map(f => {
    const criterion = WCAG_CRITERIA.find(c => c.id === f.criterionId);
    if (!criterion) return '';
    const sev = f.severity ? SEVERITY_CONFIG[f.severity].label : 'Unrated';
    return `• [${sev}] ${criterion.criterion} ${criterion.name}${f.pageComponent ? ` — ${f.pageComponent}` : ''}${f.recommendations ? `\n  Recommendation: ${f.recommendations}` : ''}`;
  }).filter(Boolean).join('\n\n');

  return `Subject: Accessibility Audit Report — ${project.productName || 'Product'} (${project.dateFrom || 'Date TBC'})

Dear Product Owner,

Please find below the accessibility audit report for ${project.productName || '[Product Name]'}.

═══════════════════════════════════════
AUDIT OVERVIEW
═══════════════════════════════════════
Product:           ${project.productName || '—'}
Conducted by:      ${project.conductedBy || '—'}
Date:              ${project.dateFrom || '—'}${project.dateTo ? ` → ${project.dateTo}` : ''}
Conformance target: WCAG 2.2 Level A & AA
Overall Score:     ${score}
Risk Level:        ${risk}${project.context ? ` (Context: ${project.context})` : ''}

═══════════════════════════════════════
SUMMARY OF RESULTS
═══════════════════════════════════════
Passed:          ${passed.length}
Failed:          ${failed.length}
Not Applicable:  ${na.length}
Conformance rate: ${conformanceRate}%

Issues by severity:
  Blocker:  ${bySeverity.blocker}
  Serious:  ${bySeverity.serious}
  Moderate: ${bySeverity.moderate}
  Minor:    ${bySeverity.minor}

${issueLines ? `═══════════════════════════════════════
ISSUES FOUND
═══════════════════════════════════════
${issueLines}` : 'No issues were recorded.'}

${project.comments ? `═══════════════════════════════════════
NOTES
═══════════════════════════════════════
${project.comments}` : ''}

═══════════════════════════════════════
PAGES AUDITED
═══════════════════════════════════════
${pages.filter(p => p.url || p.pageType).map(p => `${p.number}. ${p.pageType}${p.url ? ` — ${p.url}` : ''}`).join('\n') || 'No pages listed.'}

${project.rescanDate ? `Next rescan scheduled: ${project.rescanDate}` : ''}

Please do not hesitate to contact us if you have any questions.

Kind regards,
${project.conductedBy || 'The Accessibility Team'}`;
}

function buildHtmlReport(project: AuditProject, findings: AuditFinding[], pages: AuditPage[]): string {
  const failed = findings.filter(f => f.conformance === 'fail');
  const passed = findings.filter(f => f.conformance === 'pass');
  const na = findings.filter(f => f.conformance === 'na');

  const score = SCORE_CONFIG[project.overallScore];
  const risk = RISK_CONFIG[project.riskLevel];

  const issueRows = failed.map(f => {
    const criterion = WCAG_CRITERIA.find(c => c.id === f.criterionId);
    if (!criterion) return '';
    const sev = f.severity ? SEVERITY_CONFIG[f.severity] : null;
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace;font-size:13px">${criterion.criterion}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:14px">${criterion.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px">${f.pageComponent || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">
        ${sev ? `<span style="padding:2px 8px;border-radius:12px;font-size:12px;font-weight:600;background:${sev.dot === 'bg-red-500' ? '#fee2e2' : sev.dot === 'bg-orange-500' ? '#ffedd5' : sev.dot === 'bg-yellow-500' ? '#fef9c3' : '#f1f5f9'};color:${sev.dot === 'bg-red-500' ? '#b91c1c' : sev.dot === 'bg-orange-500' ? '#c2410c' : sev.dot === 'bg-yellow-500' ? '#854d0e' : '#475569'}">${sev.label}</span>` : '—'}
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151">${f.recommendations || '—'}</td>
    </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Accessibility Audit Report — ${project.productName}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:40px 20px;color:#111827">
<h1 style="color:#0058AB;border-bottom:3px solid #0058AB;padding-bottom:12px">Accessibility Audit Report</h1>
<h2 style="color:#374151">${project.productName || '[Product Name]'}</h2>
<table style="width:100%;border-collapse:collapse;margin-bottom:32px;font-size:14px">
  <tr><td style="padding:8px;background:#e8f0f8;font-weight:600;width:200px">Product</td><td style="padding:8px;border-bottom:1px solid #c5d8ef">${project.productName || '—'}</td></tr>
  <tr><td style="padding:8px;background:#e8f0f8;font-weight:600">Conducted by</td><td style="padding:8px;border-bottom:1px solid #c5d8ef">${project.conductedBy || '—'}</td></tr>
  <tr><td style="padding:8px;background:#e8f0f8;font-weight:600">Date</td><td style="padding:8px;border-bottom:1px solid #c5d8ef">${project.dateFrom || '—'}${project.dateTo ? ` → ${project.dateTo}` : ''}</td></tr>
  <tr><td style="padding:8px;background:#e8f0f8;font-weight:600">Conformance target</td><td style="padding:8px;border-bottom:1px solid #c5d8ef">WCAG 2.2 Level A & AA</td></tr>
  <tr><td style="padding:8px;background:#e8f0f8;font-weight:600">Overall Score</td><td style="padding:8px;border-bottom:1px solid #c5d8ef;font-weight:700;color:${project.overallScore === 'compliant' ? '#15803d' : project.overallScore === 'non-compliant' ? '#b91c1c' : project.overallScore === 'under-remediation' ? '#b45309' : '#374151'}">${score.label}</td></tr>
  <tr><td style="padding:8px;background:#e8f0f8;font-weight:600">Risk Level</td><td style="padding:8px;border-bottom:1px solid #c5d8ef;font-weight:700">${risk.label}${project.context ? ` (${project.context})` : ''}</td></tr>
</table>
<h3 style="color:#0058AB">Summary</h3>
<div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap">
  <div style="padding:16px 24px;background:#f0fdf4;border-radius:12px;text-align:center"><div style="font-size:32px;font-weight:700;color:#15803d">${passed.length}</div><div style="font-size:13px;color:#166534">Passed</div></div>
  <div style="padding:16px 24px;background:#fef2f2;border-radius:12px;text-align:center"><div style="font-size:32px;font-weight:700;color:#b91c1c">${failed.length}</div><div style="font-size:13px;color:#991b1b">Failed</div></div>
  <div style="padding:16px 24px;background:#f9fafb;border-radius:12px;text-align:center"><div style="font-size:32px;font-weight:700;color:#374151">${na.length}</div><div style="font-size:13px;color:#6b7280">N/A</div></div>
</div>
${failed.length > 0 ? `<h3 style="color:#0058AB">Issues Found</h3>
<table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #e5e7eb">
  <thead><tr style="background:#e8f0f8">
    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #c5d8ef">Criterion</th>
    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #c5d8ef">Name</th>
    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #c5d8ef">Page / Component</th>
    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #c5d8ef">Severity</th>
    <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #c5d8ef">Recommendations</th>
  </tr></thead>
  <tbody>${issueRows}</tbody>
</table>` : '<p style="color:#374151">No issues were recorded.</p>'}
${project.comments ? `<h3 style="color:#0058AB">Notes</h3><p>${project.comments}</p>` : ''}
<p style="margin-top:40px;font-size:12px;color:#9ca3af">Generated by Accessibility Auditor · WCAG 2.2 Level A & AA · ${new Date().toLocaleDateString()}</p>
</body></html>`;
}

function buildVpatLetter(project: AuditProject): string {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  return `Date: ${today}

To: ${project.serviceOwnerName || '[Service Owner Name]'}
Email: ${project.serviceOwnerEmail || '[service.owner@capgemini.com]'}

Subject: VPAT Request — ${project.vendorName || '[Vendor Name]'} / ${project.productName || '[Product Name]'}

Dear ${project.serviceOwnerName || '[Service Owner Name]'},

I am writing on behalf of the Digital Accessibility team to request a Voluntary Product Accessibility Template (VPAT) for the following product:

  Product:  ${project.productName || '[Product Name]'}
  Vendor:   ${project.vendorName || '[Vendor Name]'}

As part of our ongoing commitment to digital accessibility and compliance with WCAG 2.2 Level A & AA, we require the VPAT to:

  • Understand the vendor's stated level of accessibility conformance
  • Identify areas where the product may not meet our accessibility standards
  • Inform our remediation planning and procurement decisions

We would be grateful if you could raise this request with the vendor at your earliest convenience and share the VPAT with us once received.

If you have any questions or need further information, please do not hesitate to contact us.

${project.conductedBy ? `Kind regards,\n${project.conductedBy}\nDigital Accessibility Team` : 'Kind regards,\nDigital Accessibility Team'}`;
}

export function ReportView({ project, findings, pages }: Props) {
  const [copied, setCopied] = useState(false);
  const [vpatCopied, setVpatCopied] = useState(false);
  const [emailPreviewOpen, setEmailPreviewOpen] = useState(false);
  const [vpatPreviewOpen, setVpatPreviewOpen] = useState(false);

  const emailBody = buildEmailBody(project, findings, pages);

  function handleCopyEmail() {
    navigator.clipboard.writeText(emailBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Email content copied to clipboard!');
  }

  function handleSendEmail() {
    const subject = encodeURIComponent(`Accessibility Audit Report — ${project.productName || 'Product'}`);
    const body = encodeURIComponent(emailBody);
    const to = encodeURIComponent(project.poEmail || '');
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
    toast.success('Opening your email client…');
  }

  function handleDownloadHtml() {
    const html = buildHtmlReport(project, findings, pages);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-audit-${project.productName || 'report'}-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML report downloaded!');
  }

  function handleDownloadCsv() {
    const failed = findings.filter(f => f.conformance === 'fail');
    const headers = ['Criterion', 'Name', 'Principle', 'Level', 'Page/Component', 'Method', 'Severity', 'Recommendations', 'Notes', 'Windows', 'Android', 'iOS', 'Mac', 'Jira', 'AzDo'];
    const rows = findings.map(f => {
      const c = WCAG_CRITERIA.find(cr => cr.id === f.criterionId);
      if (!c) return null;
      return [c.criterion, c.name, c.principle, c.level, f.pageComponent, f.method, f.severity || '', f.recommendations, f.notes, f.windows, f.android, f.ios, f.mac, f.jiraTicket, f.azdoTicket].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',');
    }).filter(Boolean);
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accessibility-findings-${project.productName || 'export'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  }

  const vpatLetter = buildVpatLetter(project);

  function handleCopyVpat() {
    navigator.clipboard.writeText(vpatLetter);
    setVpatCopied(true);
    setTimeout(() => setVpatCopied(false), 2000);
    toast.success('VPAT request letter copied!');
  }

  function handleSendVpat() {
    const subject = encodeURIComponent(`VPAT Request — ${project.vendorName || project.productName || 'Product'}`);
    const body = encodeURIComponent(vpatLetter);
    const to = encodeURIComponent(project.serviceOwnerEmail || '');
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  }

  const failed = findings.filter(f => f.conformance === 'fail');
  const passed = findings.filter(f => f.conformance === 'pass');

  const isCots = project.softwareType === 'cots';
  const showVpat = isCots && (project.cotsScope === 'vpat-request' || project.cotsScope === 'both');
  const showFindings = !isCots || project.cotsScope === 'customization' || project.cotsScope === 'both';

  return (
    <div className="space-y-6">
      {/* Software type banner */}
      <div className={`rounded-xl border-2 p-4 flex items-center gap-3 ${isCots ? 'border-purple-200 bg-purple-50' : 'border-[#0058AB]/30 bg-[#0058AB]/10'}`}>
        {isCots ? <Building2 className="w-5 h-5 text-purple-600 shrink-0" /> : <Code2 className="w-5 h-5 text-[#0058AB] shrink-0" />}
        <div className="text-sm">
          <span className={`font-semibold ${isCots ? 'text-purple-700' : 'text-[#0058AB]'}`}>
            {isCots ? 'COTS — Commercial Off the Shelf' : 'Home Grown Software'}
          </span>
          {isCots && (
            <span className="ml-2 text-purple-600">
              · Scope: {project.cotsScope === 'vpat-request' ? 'VPAT Request' : project.cotsScope === 'customization' ? 'Customisation' : 'VPAT Request + Customisation'}
            </span>
          )}
          {isCots && project.vendorName && <span className="ml-2 text-gray-500">· Vendor: {project.vendorName}</span>}
        </div>
      </div>

      {/* VPAT Request section for COTS */}
      {showVpat && (
        <div className="bg-white rounded-xl border border-purple-200 p-6">
          <div className="flex items-center gap-2 mb-1">
            <FileCheck className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-gray-800">VPAT Request Letter</h2>
            {project.vpatStatus && (
              <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full border ${
                project.vpatStatus === 'reviewed' ? 'bg-green-50 text-green-700 border-green-200' :
                project.vpatStatus === 'received' ? 'bg-[#0058AB]/10 text-[#0058AB] border-[#0058AB]/30' :
                project.vpatStatus === 'requested' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                VPAT: {VPAT_STATUS_CONFIG[project.vpatStatus].label}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Send this letter to the Capgemini service owner, asking them to request a VPAT from the vendor on your behalf.
          </p>
          {(project.serviceOwnerName || project.serviceOwnerEmail) && (
            <div className="mb-4 text-sm text-gray-600 flex gap-4">
              {project.serviceOwnerName && <span><strong>Service owner:</strong> {project.serviceOwnerName}</span>}
              {project.serviceOwnerEmail && <span><strong>Email:</strong> {project.serviceOwnerEmail}</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setVpatPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <Mail className="w-4 h-4" /> Preview Letter
            </button>
            <button
              onClick={handleSendVpat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <Send className="w-4 h-4" /> Send to Service Owner
            </button>
            <button
              onClick={handleCopyVpat}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {vpatCopied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {vpatCopied ? 'Copied!' : 'Copy Letter'}
            </button>
          </div>
          {project.vpatNotes && (
            <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-800">
              <strong>Notes:</strong> {project.vpatNotes}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {showFindings && (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-800 mb-2">Generate & Send Report</h2>
        <p className="text-sm text-gray-500 mb-5">Export the audit findings and send to the Product Owner or relevant stakeholders.</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setEmailPreviewOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0058AB] text-white text-sm font-medium hover:bg-[#004a91] transition-colors"
          >
            <Mail className="w-4 h-4" /> Preview Email Report
          </button>
          <button
            onClick={handleSendEmail}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <Send className="w-4 h-4" /> Send to PO {project.poEmail ? `(${project.poEmail})` : ''}
          </button>
          <button
            onClick={handleDownloadHtml}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Download HTML Report
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handleCopyEmail}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Email Text'}
          </button>
        </div>
      </div>
      )}

      {/* Report preview */}
      {showFindings && <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-5 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Report Preview</h3>
          <span className="text-xs text-gray-500">WCAG 2.2 Level A & AA</span>
        </div>

        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-[#0058AB] border-b-2 border-[#0058AB] pb-3">Accessibility Audit Report</h1>
            <h2 className="text-xl text-gray-700 mt-2">{project.productName || '[Product Name]'}</h2>
          </div>

          {/* Meta table */}
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <tbody className="divide-y">
              {[
                ['Product', project.productName || '—'],
                ['Conducted by', project.conductedBy || '—'],
                ['Date', `${project.dateFrom || '—'}${project.dateTo ? ` → ${project.dateTo}` : ''}`],
                ['Conformance target', 'WCAG 2.2 Level A & AA'],
                ['Overall Score', SCORE_CONFIG[project.overallScore].label],
                ['Risk Level', `${RISK_CONFIG[project.riskLevel].label}${project.context ? ` (${project.context})` : ''}`],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="px-4 py-2.5 bg-[#0058AB]/10 font-medium text-gray-700 w-48">{k}</td>
                  <td className="px-4 py-2.5">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div>
            <h3 className="font-semibold text-[#0058AB] mb-3">Summary of Results</h3>
            <div className="flex gap-4 flex-wrap">
              <SummaryCard label="Passed" value={passed.length} color="bg-green-50 text-green-700" />
              <SummaryCard label="Failed" value={failed.length} color="bg-red-50 text-red-700" />
              <SummaryCard label="N/A" value={findings.filter(f => f.conformance === 'na').length} color="bg-gray-50 text-gray-600" />
            </div>
          </div>

          {/* Issues */}
          {failed.length > 0 && (
            <div>
              <h3 className="font-semibold text-[#0058AB] mb-3">Issues Found ({failed.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-[#0058AB]/10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Criterion</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Page/Component</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Severity</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Recommendations</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-600">Tickets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {failed.map(f => {
                      const criterion = WCAG_CRITERIA.find(c => c.id === f.criterionId);
                      if (!criterion) return null;
                      return (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-xs text-gray-600">{criterion.criterion}</td>
                          <td className="px-3 py-2 text-gray-800">{criterion.name}</td>
                          <td className="px-3 py-2 text-gray-600 text-xs">{f.pageComponent || '—'}</td>
                          <td className="px-3 py-2">
                            {f.severity ? (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEVERITY_CONFIG[f.severity].color}`}>
                                {SEVERITY_CONFIG[f.severity].label}
                              </span>
                            ) : <span className="text-gray-400 text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">{f.recommendations || '—'}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-1.5">
                              {f.jiraTicket && (
                                <a href={f.jiraTicket} target="_blank" rel="noopener noreferrer" className="text-[#0058AB] hover:underline text-xs flex items-center gap-0.5">
                                  Jira <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                              {f.azdoTicket && (
                                <a href={f.azdoTicket} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline text-xs flex items-center gap-0.5">
                                  AzDo <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {project.comments && (
            <div>
              <h3 className="font-semibold text-[#0058AB] mb-2">Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{project.comments}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 border-t pt-4">
            Generated by Accessibility Auditor · WCAG 2.2 Level A & AA · {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>}

      {/* VPAT letter preview modal */}
      {vpatPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800">VPAT Request Letter</h3>
              <button onClick={() => setVpatPreviewOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">{vpatLetter}</pre>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button onClick={handleCopyVpat} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50">
                {vpatCopied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {vpatCopied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleSendVpat} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700">
                <Send className="w-4 h-4" /> Send to Service Owner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email preview modal */}
      {emailPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-800">Email Preview</h3>
              <button onClick={() => setEmailPreviewOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <div className="flex-1 overflow-auto p-5">
              <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed">{emailBody}</pre>
            </div>
            <div className="p-4 border-t flex gap-3 justify-end">
              <button onClick={handleCopyEmail} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-gray-700 hover:bg-gray-50">
                {copied ? <CheckCheck className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={handleSendEmail} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0058AB] text-white text-sm font-medium hover:bg-[#004a91]">
                <Send className="w-4 h-4" /> Open in Email Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-xl p-4 text-center min-w-24 ${color}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  );
}
