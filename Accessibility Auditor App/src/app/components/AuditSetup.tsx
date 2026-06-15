import { useState } from 'react';
import { Plus, Trash2, Building2, Code2, FileCheck, Settings2, Mail } from 'lucide-react';
import { AuditProject, AuditPage, VPAT_STATUS_CONFIG, CONTENT_TYPE_CONFIG, ContentType, ConformanceTarget, AUDIT_PLATFORM_CONFIG, AuditPlatform } from './types';

interface Props {
  project: AuditProject;
  pages: AuditPage[];
  onProjectChange: (project: AuditProject) => void;
  onPagesChange: (pages: AuditPage[]) => void;
  onEmailServiceOwner?: () => void;
}

const PAGE_TYPES = ['Home page', 'Landing page', 'Sub-landing page', 'Detail page', 'Functional page', 'Other'];

export function AuditSetup({ project, pages, onProjectChange, onPagesChange, onEmailServiceOwner }: Props) {
  const [activeSection, setActiveSection] = useState<'overview' | 'scope' | 'tools'>('overview');

  function updateProject(field: keyof AuditProject, value: string) {
    onProjectChange({ ...project, [field]: value });
  }

  function addPage() {
    const newPage: AuditPage = {
      id: crypto.randomUUID(),
      number: pages.length + 1,
      pageType: 'Landing page',
      url: '',
      comment: '',
    };
    onPagesChange([...pages, newPage]);
  }

  function updatePage(id: string, field: keyof AuditPage, value: string) {
    onPagesChange(pages.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  function removePage(id: string) {
    const updated = pages.filter(p => p.id !== id).map((p, i) => ({ ...p, number: i + 1 }));
    onPagesChange(updated);
  }

  const sections = [
    { id: 'overview', label: 'Audit Overview' },
    { id: 'scope', label: 'Scope of Audit' },
    { id: 'tools', label: 'Tools & Devices' },
  ] as const;

  return (
    <div className="flex gap-6">
      {/* Sidebar nav */}
      <nav className="w-48 shrink-0">
        <ul className="space-y-1">
          {sections.map(s => (
            <li key={s.id}>
              <button
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === s.id
                    ? 'bg-[#0058AB]/10 text-[#0058AB] font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex-1 space-y-6">
        {activeSection === 'overview' && (
          <div className="space-y-5">
            {/* Software Type Selector */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-800 mb-1">Software Type</h2>
              <p className="text-xs text-gray-500 mb-4">Select the type of software being audited — this determines the audit workflow.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => updateProject('softwareType', 'home-grown')}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    project.softwareType === 'home-grown'
                      ? 'border-[#0058AB] bg-[#0058AB]/10'
                      : 'border-gray-200 hover:border-[#0058AB]/30 hover:bg-gray-50'
                  }`}
                >
                  <Code2 className={`w-6 h-6 mt-0.5 shrink-0 ${project.softwareType === 'home-grown' ? 'text-[#0058AB]' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-semibold text-sm ${project.softwareType === 'home-grown' ? 'text-[#0058AB]' : 'text-gray-700'}`}>Home Grown</div>
                    <div className="text-xs text-gray-500 mt-0.5">Software built in-house. Full control over code, design, and remediation.</div>
                  </div>
                </button>
                <button
                  onClick={() => updateProject('softwareType', 'cots')}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    project.softwareType === 'cots'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className={`w-6 h-6 mt-0.5 shrink-0 ${project.softwareType === 'cots' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-semibold text-sm ${project.softwareType === 'cots' ? 'text-purple-700' : 'text-gray-700'}`}>COTS — Commercial Off the Shelf</div>
                    <div className="text-xs text-gray-500 mt-0.5">e.g. SuccessFactors, ServiceNow. Involves vendor VPAT and/or customisation audit.</div>
                  </div>
                </button>
              </div>

              {/* COTS-specific fields */}
              {project.softwareType === 'cots' && (
                <div className="mt-5 space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
                    <strong>COTS audits have two parts:</strong> requesting a VPAT from the vendor (via the Capgemini service owner), and auditing the customisation/configuration which is within our control.
                  </div>

                  {/* COTS scope */}
                  <Field label="Audit Scope">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                      {([
                        { value: 'vpat-request', icon: FileCheck, label: 'VPAT Request', desc: 'Request vendor VPAT via service owner' },
                        { value: 'customization', icon: Settings2, label: 'Customisation', desc: 'Audit our own config & customisation' },
                        { value: 'both', icon: Building2, label: 'Both', desc: 'VPAT request + customisation audit' },
                      ] as const).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateProject('cotsScope', opt.value)}
                          className={`flex flex-col items-start p-3 rounded-lg border-2 text-left transition-all ${
                            project.cotsScope === opt.value
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          <opt.icon className={`w-4 h-4 mb-1 ${project.cotsScope === opt.value ? 'text-purple-600' : 'text-gray-400'}`} />
                          <span className={`text-xs font-semibold ${project.cotsScope === opt.value ? 'text-purple-700' : 'text-gray-700'}`}>{opt.label}</span>
                          <span className="text-xs text-gray-500 mt-0.5">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Vendor / Product Name" required>
                      <input type="text" value={project.vendorName} onChange={e => updateProject('vendorName', e.target.value)} placeholder="e.g. SAP, ServiceNow" className={inputCls} />
                    </Field>
                    {(project.cotsScope === 'vpat-request' || project.cotsScope === 'both') && (
                      <>
                        <Field label="Service Owner Name (Capgemini)">
                          <input type="text" value={project.serviceOwnerName} onChange={e => updateProject('serviceOwnerName', e.target.value)} placeholder="Name of Capgemini contact" className={inputCls} />
                        </Field>
                        <Field label="Service Owner Email (Capgemini)">
                          <input type="email" value={project.serviceOwnerEmail} onChange={e => updateProject('serviceOwnerEmail', e.target.value)} placeholder="serviceowner@capgemini.com" className={inputCls} />
                        </Field>
                        <Field label="VPAT Status">
                          <select value={project.vpatStatus} onChange={e => updateProject('vpatStatus', e.target.value)} className={inputCls}>
                            <option value="not-requested">Not Requested</option>
                            <option value="requested">Requested</option>
                            <option value="received">Received</option>
                            <option value="reviewed">Reviewed</option>
                          </select>
                        </Field>
                        {(project.vpatStatus === 'received' || project.vpatStatus === 'reviewed') && (
                          <Field label="VPAT Received Date">
                            <input type="date" value={project.vpatReceivedDate} onChange={e => updateProject('vpatReceivedDate', e.target.value)} className={inputCls} />
                          </Field>
                        )}
                        <div className="md:col-span-2">
                          <Field label="VPAT Notes">
                            <textarea value={project.vpatNotes} onChange={e => updateProject('vpatNotes', e.target.value)} rows={2} placeholder="Notes on VPAT content, gaps, follow-up actions…" className={`${inputCls} resize-none`} />
                          </Field>
                        </div>
                        {onEmailServiceOwner && project.serviceOwnerEmail && (
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0058AB]/5 border border-[#0058AB]/20">
                              <div>
                                <p className="text-sm font-medium text-[#121A38]">Email Service Owner</p>
                                <p className="text-xs text-gray-500 mt-0.5">Send a VPAT reminder or follow-up to <strong>{project.serviceOwnerName || project.serviceOwnerEmail}</strong></p>
                              </div>
                              <button
                                onClick={onEmailServiceOwner}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[#0058AB] text-white hover:bg-[#004a91] transition-colors shrink-0 ml-3"
                              >
                                <Mail className="w-4 h-4" /> Email…
                              </button>
                            </div>
                          </div>
                        )}
                        {onEmailServiceOwner && !project.serviceOwnerEmail && (
                          <div className="md:col-span-2">
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Enter a <strong>Service Owner Email</strong> above to enable the email reminder feature.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </section>

          {/* Common audit details */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-800 mb-5">Audit Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Application / Product Name" required>
                  <input
                    type="text"
                    value={project.productName}
                    onChange={e => updateProject('productName', e.target.value)}
                    placeholder="e.g. HR Portal"
                    className={inputCls}
                  />
                </Field>
                <Field label="Platform / Medium">
                  <select
                    value={project.platform ?? 'web'}
                    onChange={e => onProjectChange({ ...project, platform: e.target.value as AuditPlatform })}
                    className={inputCls}
                  >
                    {(Object.entries(AUDIT_PLATFORM_CONFIG) as [AuditPlatform, typeof AUDIT_PLATFORM_CONFIG[AuditPlatform]][]).map(([val, cfg]) => (
                      <option key={val} value={val}>{cfg.icon} {cfg.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Audit Context (e.g. HR, Finance)">
                  <input
                    type="text"
                    value={project.context}
                    onChange={e => updateProject('context', e.target.value)}
                    placeholder="e.g. HR"
                    className={inputCls}
                  />
                </Field>
                <Field label="Date From">
                  <input type="date" value={project.dateFrom} onChange={e => updateProject('dateFrom', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Date To">
                  <input type="date" value={project.dateTo} onChange={e => updateProject('dateTo', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Audit Conducted By">
                  <input
                    type="text"
                    value={project.conductedBy}
                    onChange={e => updateProject('conductedBy', e.target.value)}
                    placeholder="Name / team"
                    className={inputCls}
                  />
                </Field>
                <Field label="Product Owner Email">
                  <input
                    type="email"
                    value={project.poEmail}
                    onChange={e => updateProject('poEmail', e.target.value)}
                    placeholder="po@example.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Rescan Date">
                  <input type="date" value={project.rescanDate} onChange={e => updateProject('rescanDate', e.target.value)} className={inputCls} />
                </Field>
                <div className="md:col-span-2">
                  <Field label="Comments / Executive Summary">
                    <textarea
                      value={project.comments}
                      onChange={e => updateProject('comments', e.target.value)}
                      rows={3}
                      placeholder="General notes about the audit scope and approach…"
                      className={`${inputCls} resize-none`}
                    />
                  </Field>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Conformance Target</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {([
                    { value: 'wcag22', label: 'WCAG 2.2 Level A & AA', description: 'International standard — recommended for most projects', flag: '🌐' },
                    { value: 'rgaa41', label: 'RGAA 4.1', description: 'Référentiel Général d\'Amélioration de l\'Accessibilité — required for French public sector', flag: '🇫🇷' },
                  ] as { value: ConformanceTarget; label: string; description: string; flag: string }[]).map(opt => {
                    const targets = project.conformanceTargets ?? ['wcag22'];
                    const checked = targets.includes(opt.value);
                    const toggle = () => {
                      const next = checked ? targets.filter(t => t !== opt.value) : [...targets, opt.value];
                      onProjectChange({ ...project, conformanceTargets: next.length ? next : ['wcag22'] });
                    };
                    return (
                      <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${checked ? 'border-[#0058AB] bg-[#0058AB]/10' : 'border-gray-200 hover:border-[#0058AB]/30 hover:bg-gray-50'}`}>
                        <input type="checkbox" checked={checked} onChange={toggle} className="mt-0.5 shrink-0 accent-[#0058AB]" />
                        <div>
                          <div className={`text-sm font-semibold ${checked ? 'text-[#0058AB]' : 'text-gray-700'}`}>{opt.flag} {opt.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{opt.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {(project.conformanceTargets ?? ['wcag22']).includes('rgaa41') && (
                  <p className="mt-3 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    RGAA 4.1 criteria will appear alongside WCAG 2.2 in the Findings tab, grouped by RGAA theme.
                  </p>
                )}
              </div>
            </section>

            {/* Content types */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="font-semibold text-gray-800 mb-1">Content Types Present</h2>
              <p className="text-xs text-gray-500 mb-4">
                Tick everything that appears on the pages being audited. WCAG criteria that only apply to unchecked content types will be auto-set to <strong>N/A</strong> in the Findings tab.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.entries(CONTENT_TYPE_CONFIG) as [ContentType, typeof CONTENT_TYPE_CONFIG[ContentType]][]).map(([key, cfg]) => {
                  const checked = (project.contentTypes ?? []).includes(key);
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none ${
                        checked
                          ? 'border-[#0058AB] bg-[#0058AB]/10'
                          : 'border-gray-200 hover:border-[#0058AB]/30 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const current = project.contentTypes ?? [];
                          const next = checked
                            ? current.filter(t => t !== key)
                            : [...current, key];
                          onProjectChange({ ...project, contentTypes: next });
                        }}
                        className="mt-0.5 shrink-0 accent-[#0058AB]"
                      />
                      <div>
                        <div className={`text-sm font-semibold ${checked ? 'text-[#0058AB]' : 'text-gray-700'}`}>{cfg.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{cfg.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{cfg.criteria.length} criteria</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {(project.contentTypes ?? []).length === 0 && (
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  No content types selected — all content-specific criteria will be marked N/A automatically.
                </p>
              )}
            </section>
          </div>
        )}

        {activeSection === 'scope' && (
          <section className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-800">Scope of Audit</h2>
              <button
                onClick={addPage}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0058AB] text-white text-sm hover:bg-[#004a91] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Page
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0058AB]/10 text-left">
                    <th className="px-3 py-2 text-gray-600 font-medium w-10">#</th>
                    <th className="px-3 py-2 text-gray-600 font-medium w-44">Page Type</th>
                    <th className="px-3 py-2 text-gray-600 font-medium">URL</th>
                    <th className="px-3 py-2 text-gray-600 font-medium">Comment</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pages.map(page => (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-gray-500">{page.number}</td>
                      <td className="px-3 py-2">
                        <select
                          value={page.pageType}
                          onChange={e => updatePage(page.id, 'pageType', e.target.value)}
                          className={`${inputCls} py-1`}
                        >
                          {PAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="url"
                          value={page.url}
                          onChange={e => updatePage(page.id, 'url', e.target.value)}
                          placeholder="https://…"
                          className={`${inputCls} py-1`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={page.comment}
                          onChange={e => updatePage(page.id, 'comment', e.target.value)}
                          placeholder="Optional note"
                          className={`${inputCls} py-1`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removePage(page.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Remove page"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === 'tools' && (
          <section className="bg-white rounded-xl border p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-gray-800 mb-5">Tools & Assistive Technologies Used</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0058AB]/10 text-left">
                      <th className="px-3 py-2 text-gray-600 font-medium w-48">Category</th>
                      <th className="px-3 py-2 text-gray-600 font-medium">Tools / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <ToolRow label="Manual methods" value={project.manualMethods} onChange={v => updateProject('manualMethods', v)} />
                    <ToolRow label="Automated tools" value={project.automatedTools} onChange={v => updateProject('automatedTools', v)} />
                    <ToolRow label="Assistive technologies" value={project.assistiveTech} onChange={v => updateProject('assistiveTech', v)} />
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-gray-800 mb-5">OS, Browsers & Devices Tested</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0058AB]/10 text-left">
                      <th className="px-3 py-2 text-gray-600 font-medium w-48">Category</th>
                      <th className="px-3 py-2 text-gray-600 font-medium">Version / Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <ToolRow label="Browsers" value={project.browsers} onChange={v => updateProject('browsers', v)} placeholder="Chrome, Firefox, Safari" />
                    <ToolRow label="OS" value={project.os} onChange={v => updateProject('os', v)} placeholder="Windows 11, macOS, iOS 17, Android 14" />
                    <ToolRow label="Devices" value={project.devices} onChange={v => updateProject('devices', v)} placeholder="Desktop, iPhone 15, Samsung Galaxy" />
                    <ToolRow label="Assistive technologies" value={project.assistiveTech} onChange={v => updateProject('assistiveTech', v)} placeholder="NVDA, JAWS, VoiceOver, TalkBack" />
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function ToolRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-2 text-gray-600">{label}</td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputCls}
        />
      </td>
    </tr>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0058AB]/40 focus:border-transparent bg-white';
