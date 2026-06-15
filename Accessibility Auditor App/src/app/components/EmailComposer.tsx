import { useState } from 'react';
import { X, Mail, Send, ChevronDown } from 'lucide-react';
import { EmailTemplate, AuditProject } from './types';

interface Props {
  templates: EmailTemplate[];
  project: AuditProject;
  auditorName: string;
  onClose: () => void;
}

function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

export function EmailComposer({ templates, project, auditorName, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string>(templates[0]?.id ?? '');
  const [toEmail, setToEmail] = useState(project.serviceOwnerEmail ?? '');
  const [extraNote, setExtraNote] = useState('');

  const vars: Record<string, string> = {
    productName:        project.productName || '(product name not set)',
    vendorName:         project.vendorName || '(vendor name not set)',
    serviceOwnerName:   project.serviceOwnerName || '(service owner name not set)',
    serviceOwnerEmail:  project.serviceOwnerEmail || '',
    auditorName:        auditorName || '(auditor name not set)',
    dateFrom:           project.dateFrom || '',
    rescanDate:         project.rescanDate || '',
    year:               new Date().getFullYear().toString(),
  };

  const selected = templates.find(t => t.id === selectedId);
  const filledSubject = selected ? fillTemplate(selected.subject, vars) : '';
  const filledBody = selected
    ? fillTemplate(selected.body, vars) + (extraNote ? `\n\n---\n${extraNote}` : '')
    : '';

  function openMailto() {
    const mailto = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(filledSubject)}&body=${encodeURIComponent(filledBody)}`;
    window.open(mailto, '_blank');
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#0058AB]" />
            <h3 className="font-semibold text-gray-800">Email Service Owner</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {templates.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              <p className="font-medium">No email templates found.</p>
              <p className="text-sm mt-1">Go to <strong>Email Templates</strong> in the main menu to create one.</p>
            </div>
          ) : (
            <>
              {/* Template selector */}
              <div>
                <label className={labelCls}>Template</label>
                <div className="relative">
                  <select
                    value={selectedId}
                    onChange={e => setSelectedId(e.target.value)}
                    className={inputCls + ' pr-8 appearance-none'}
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {selected?.description && (
                  <p className="text-xs text-gray-400 mt-1">{selected.description}</p>
                )}
              </div>

              {/* To */}
              <div>
                <label className={labelCls}>To</label>
                <input
                  type="email"
                  value={toEmail}
                  onChange={e => setToEmail(e.target.value)}
                  placeholder="serviceowner@capgemini.com"
                  className={inputCls}
                />
              </div>

              {/* Subject preview */}
              <div>
                <label className={labelCls}>Subject (preview)</label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{filledSubject || <span className="text-gray-400 italic">Select a template above</span>}</div>
              </div>

              {/* Body preview */}
              <div>
                <label className={labelCls}>Body (preview)</label>
                <pre className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-72 overflow-y-auto">
                  {filledBody || <span className="text-gray-400 italic">Select a template above</span>}
                </pre>
              </div>

              {/* Optional extra note */}
              <div>
                <label className={labelCls}>Additional note <span className="text-gray-400 font-normal normal-case">(optional — appended to the email)</span></label>
                <textarea
                  rows={2}
                  value={extraNote}
                  onChange={e => setExtraNote(e.target.value)}
                  placeholder="Add a personal note to append to this email…"
                  className={`${inputCls} resize-none`}
                />
              </div>

              <p className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                Clicking <strong>Open in Mail Client</strong> will open your default email application with the above content pre-filled. No email is sent automatically — you can review and edit before sending.
              </p>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
          {templates.length > 0 && (
            <button
              onClick={openMailto}
              disabled={!toEmail.trim() || !selectedId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0058AB] text-white text-sm font-medium hover:bg-[#004a91] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" /> Open in Mail Client
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0058AB]/40 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';
