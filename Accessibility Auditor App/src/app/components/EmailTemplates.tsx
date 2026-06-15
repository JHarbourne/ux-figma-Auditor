import { useState } from 'react';
import { Plus, Pencil, Trash2, Mail, Copy, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { EmailTemplate, TEMPLATE_VARIABLES } from './types';

interface Props {
  templates: EmailTemplate[];
  onChange: (templates: EmailTemplate[]) => void;
}

function blankTemplate(): EmailTemplate {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    subject: '',
    body: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function EmailTemplates({ templates, onChange }: Props) {
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [showVars, setShowVars] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  function saveTemplate(tpl: EmailTemplate) {
    const updated = { ...tpl, updatedAt: new Date().toISOString() };
    const exists = templates.some(t => t.id === tpl.id);
    onChange(exists ? templates.map(t => t.id === tpl.id ? updated : t) : [...templates, updated]);
    setEditing(null);
  }

  function deleteTemplate(id: string) {
    if (!confirm('Delete this email template? This cannot be undone.')) return;
    onChange(templates.filter(t => t.id !== id));
  }

  function copyTemplate(tpl: EmailTemplate) {
    const copy: EmailTemplate = {
      ...tpl,
      id: crypto.randomUUID(),
      name: `${tpl.name} (copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onChange([...templates, copy]);
  }

  if (editing) {
    return (
      <TemplateEditor
        template={editing}
        showVars={showVars}
        onToggleVars={() => setShowVars(v => !v)}
        onSave={saveTemplate}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#121A38]">Email Templates</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Reusable templates for VPAT reminders and service owner communications. Use <code className="bg-gray-100 px-1 rounded text-xs">{'{{placeholders}}'}</code> that are auto-filled from audit data.
          </p>
        </div>
        <button
          onClick={() => setEditing(blankTemplate())}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[#0058AB] text-white hover:bg-[#004a91] transition-colors"
        >
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      {/* Variable reference */}
      <div className="bg-white rounded-xl border">
        <button
          onClick={() => setShowVars(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <span className="flex items-center gap-2"><Info className="w-4 h-4 text-[#0058AB]" /> Available placeholders</span>
          {showVars ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showVars && (
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {TEMPLATE_VARIABLES.map(v => (
              <div key={v.key} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <code className="text-xs font-mono text-[#0058AB] bg-[#0058AB]/10 px-1.5 py-0.5 rounded">{v.key}</code>
                <span className="text-xs text-gray-500">{v.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border text-center">
          <Mail className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No templates yet</p>
          <p className="text-gray-400 text-sm mt-1">Click <strong>New Template</strong> to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(tpl => (
            <div key={tpl.id} className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-start gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{tpl.name || <span className="text-gray-400 italic">Untitled</span>}</h3>
                  </div>
                  {tpl.description && <p className="text-sm text-gray-500 mt-0.5">{tpl.description}</p>}
                  <p className="text-xs text-gray-400 mt-1 font-mono truncate">Subject: {tpl.subject}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setPreviewId(previewId === tpl.id ? null : tpl.id)}
                    className="p-1.5 text-gray-400 hover:text-[#0058AB] hover:bg-blue-50 rounded transition-colors text-xs font-medium"
                    title="Preview"
                  >
                    {previewId === tpl.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyTemplate(tpl)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditing({ ...tpl })}
                    className="p-1.5 text-gray-400 hover:text-[#0058AB] hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteTemplate(tpl.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {previewId === tpl.id && (
                <div className="border-t px-5 py-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Body preview</p>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{tpl.body}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface EditorProps {
  template: EmailTemplate;
  showVars: boolean;
  onToggleVars: () => void;
  onSave: (tpl: EmailTemplate) => void;
  onCancel: () => void;
}

function TemplateEditor({ template, showVars, onToggleVars, onSave, onCancel }: EditorProps) {
  const [draft, setDraft] = useState<EmailTemplate>(template);
  const update = (key: keyof EmailTemplate, val: string) => setDraft(d => ({ ...d, [key]: val }));

  const isNew = !template.name;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="text-[#0058AB] hover:underline text-sm font-medium">← Back to templates</button>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-500">{isNew ? 'New template' : `Editing: ${template.name}`}</span>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Template Name <span className="text-red-400">*</span></label>
            <input type="text" value={draft.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Initial VPAT Request" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input type="text" value={draft.description} onChange={e => update('description', e.target.value)} placeholder="What is this template used for?" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Subject Line <span className="text-red-400">*</span></label>
          <input type="text" value={draft.subject} onChange={e => update('subject', e.target.value)} placeholder="e.g. Action Required: VPAT Request — {{productName}}" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Email Body <span className="text-red-400">*</span></label>
          <textarea
            rows={18}
            value={draft.body}
            onChange={e => update('body', e.target.value)}
            placeholder="Write your email here. Use {{placeholders}} for dynamic content."
            className={`${inputCls} resize-y font-mono text-sm leading-relaxed`}
          />
        </div>

        {/* Placeholder reference */}
        <div className="border rounded-lg overflow-hidden">
          <button
            onClick={onToggleVars}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors bg-gray-50/60"
          >
            <span className="flex items-center gap-2"><Info className="w-4 h-4 text-[#0058AB]" /> Available placeholders</span>
            {showVars ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showVars && (
            <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {TEMPLATE_VARIABLES.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => update('body', draft.body + v.key)}
                  title="Click to insert at end of body"
                  className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-[#0058AB]/10 transition-colors text-left"
                >
                  <code className="text-xs font-mono text-[#0058AB] bg-[#0058AB]/10 px-1.5 py-0.5 rounded shrink-0">{v.key}</code>
                  <span className="text-xs text-gray-500">{v.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors">Cancel</button>
          <button
            onClick={() => onSave(draft)}
            disabled={!draft.name.trim() || !draft.subject.trim() || !draft.body.trim()}
            className="px-4 py-2 rounded-lg bg-[#0058AB] text-white text-sm font-medium hover:bg-[#004a91] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0058AB]/40 bg-white';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';
