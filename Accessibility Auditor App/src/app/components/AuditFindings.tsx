import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Send, Filter, Search, Plus, X, Ticket } from 'lucide-react';
import {
  WCAG_CRITERIA, WCAGCriterion, AuditFinding, AuditPage,
  SEVERITY_CONFIG, CONFORMANCE_CONFIG, Severity, Conformance, WCAGPrinciple,
  ContentType, CONTENT_TYPE_CONFIG, CONTENT_SPECIFIC_CRITERIA,
  RGAA_CRITERIA, RGAACriterion, RGAA_THEMES,
} from './types';
import { toast } from 'sonner';

interface Props {
  findings: AuditFinding[];
  pages: AuditPage[];
  contentTypes: ContentType[];
  conformanceTargets: string[];
  onFindingsChange: (findings: AuditFinding[]) => void;
}

type FilterSeverity = Severity | 'all';
type FilterConformance = Conformance | 'unset' | 'all';

const PRINCIPLES: { id: WCAGPrinciple; label: string; color: string }[] = [
  { id: 'perceivable', label: 'Perceivable', color: 'bg-[#0058AB]/10 border-[#0058AB]/30 text-[#121A38]' },
  { id: 'operable', label: 'Operable', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { id: 'understandable', label: 'Understandable', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { id: 'robust', label: 'Robust', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
];

function getFinding(findings: AuditFinding[], criterionId: string): AuditFinding | undefined {
  return findings.find(f => f.criterionId === criterionId);
}

function createDefaultFinding(criterionId: string): AuditFinding {
  return {
    id: crypto.randomUUID(),
    criterionId,
    pageComponent: '',
    method: '',
    conformance: null,
    severity: null,
    recommendations: '',
    notes: '',
    windows: '',
    android: '',
    ios: '',
    mac: '',
    jiraTicket: '',
    azdoTicket: '',
  };
}

export function AuditFindings({ findings, pages, contentTypes, conformanceTargets, onFindingsChange }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterPrinciple, setFilterPrinciple] = useState<WCAGPrinciple | 'all'>('all');
  const [filterConformance, setFilterConformance] = useState<FilterConformance>('all');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all');
  const [search, setSearch] = useState('');
  const [jiraModal, setJiraModal] = useState<{ criterionId: string; type: 'jira' | 'azdo' } | null>(null);
  const [ticketUrl, setTicketUrl] = useState('');

  const filteredCriteria = useMemo(() => {
    return WCAG_CRITERIA.filter(c => {
      if (filterPrinciple !== 'all' && c.principle !== filterPrinciple) return false;
      const finding = getFinding(findings, c.id);
      if (filterConformance === 'unset' && finding?.conformance) return false;
      if (filterConformance !== 'all' && filterConformance !== 'unset' && finding?.conformance !== filterConformance) return false;
      if (filterSeverity !== 'all' && finding?.severity !== filterSeverity) return false;
      if (search) {
        const q = search.toLowerCase();
        return c.criterion.includes(q) || c.name.toLowerCase().includes(q) || c.passCondition.toLowerCase().includes(q);
      }
      return true;
    });
  }, [findings, filterPrinciple, filterConformance, filterSeverity, search]);

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function updateFinding(criterionId: string, updates: Partial<AuditFinding>) {
    const existing = getFinding(findings, criterionId);
    if (existing) {
      onFindingsChange(findings.map(f => f.criterionId === criterionId ? { ...f, ...updates } : f));
    } else {
      const newFinding = { ...createDefaultFinding(criterionId), ...updates };
      onFindingsChange([...findings, newFinding]);
    }
  }

  function setConformance(criterionId: string, val: Conformance) {
    const current = getFinding(findings, criterionId)?.conformance;
    if (current === val) {
      updateFinding(criterionId, { conformance: null, severity: null });
    } else {
      updateFinding(criterionId, { conformance: val, severity: val !== 'fail' ? null : getFinding(findings, criterionId)?.severity ?? null });
    }
  }

  function saveTicket(criterionId: string, type: 'jira' | 'azdo') {
    updateFinding(criterionId, type === 'jira' ? { jiraTicket: ticketUrl } : { azdoTicket: ticketUrl });
    setJiraModal(null);
    setTicketUrl('');
    toast.success(`${type === 'jira' ? 'Jira' : 'Azure DevOps'} ticket linked!`);
  }

  const grouped = PRINCIPLES.map(p => ({
    ...p,
    criteria: filteredCriteria.filter(c => c.principle === p.id),
  })).filter(g => g.criteria.length > 0);

  const activeCriteria = useMemo(() => {
    const covered = new Set(contentTypes.flatMap(t => CONTENT_TYPE_CONFIG[t]?.criteria ?? []));
    return new Set(
      WCAG_CRITERIA
        .filter(c => !CONTENT_SPECIFIC_CRITERIA.has(c.id) || covered.has(c.id))
        .map(c => c.id)
    );
  }, [contentTypes]);

  const stats = useMemo(() => ({
    total: activeCriteria.size,
    done: findings.filter(f => f.conformance !== null && activeCriteria.has(f.criterionId)).length,
  }), [findings, activeCriteria]);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600 font-medium">Audit progress</span>
          <span className="text-gray-500">{stats.done} / {stats.total} criteria assessed</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0058AB] rounded-full transition-all"
            style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search criteria…"
            className="flex-1 text-sm border-0 outline-none bg-transparent text-gray-700"
          />
          {search && <button onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={filterPrinciple} onChange={e => setFilterPrinciple(e.target.value as any)} className={selectCls}>
            <option value="all">All Principles</option>
            {PRINCIPLES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select value={filterConformance} onChange={e => setFilterConformance(e.target.value as any)} className={selectCls}>
            <option value="all">All Results</option>
            <option value="pass">Pass</option>
            <option value="fail">Fail</option>
            <option value="na">N/A</option>
            <option value="unset">Not assessed</option>
          </select>
          <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value as any)} className={selectCls}>
            <option value="all">All Severity</option>
            <option value="blocker">Blocker</option>
            <option value="serious">Serious</option>
            <option value="moderate">Moderate</option>
            <option value="minor">Minor</option>
          </select>
        </div>
      </div>

      {/* Grouped criteria */}
      {grouped.map(group => (
        <div key={group.id} className="bg-white rounded-xl border overflow-hidden">
          <div className={`px-5 py-3 border-b ${group.color} border-l-4`}>
            <h3 className="font-semibold">{group.label}</h3>
            <p className="text-xs mt-0.5 opacity-70">{group.criteria.length} criteria shown</p>
          </div>
          <div className="divide-y">
            {group.criteria.map(criterion => {
              const isActive = activeCriteria.has(criterion.id);
              const finding = getFinding(findings, criterion.id) || createDefaultFinding(criterion.id);
              const isExpanded = expanded.has(criterion.id) && isActive;
              const isEditing = editingId === criterion.id && isActive;

              if (!isActive) {
                return (
                  <div key={criterion.id} className="flex items-start gap-3 px-4 py-3 opacity-40 select-none bg-gray-50/60">
                    <div className="mt-0.5 text-gray-300 shrink-0"><ChevronRight className="w-4 h-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-gray-400">{criterion.criterion}</span>
                        <span className="text-sm font-medium text-gray-500">{criterion.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">{criterion.level}</span>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-400 font-medium border border-gray-200 shrink-0">N/A</span>
                  </div>
                );
              }

              return (
                <div key={criterion.id} className="group">
                  {/* Row */}
                  <div
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => toggleExpand(criterion.id)}
                  >
                    <div className="mt-0.5 text-gray-400 shrink-0">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-gray-500">{criterion.criterion}</span>
                        <span className="text-sm font-medium text-gray-800">{criterion.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{criterion.level}</span>
                        {finding.jiraTicket && (
                          <a href={finding.jiraTicket} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs px-1.5 py-0.5 rounded bg-[#0058AB]/10 text-[#0058AB] hover:underline flex items-center gap-1">
                            <Ticket className="w-3 h-3" /> Jira
                          </a>
                        )}
                        {finding.azdoTicket && (
                          <a href={finding.azdoTicket} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 hover:underline flex items-center gap-1">
                            <Ticket className="w-3 h-3" /> AzDo
                          </a>
                        )}
                      </div>
                      {finding.conformance === 'fail' && finding.recommendations && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{finding.recommendations}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {/* Conformance buttons */}
                      {(['pass', 'fail', 'na'] as Conformance[]).map(c => (
                        <button
                          key={c}
                          onClick={() => setConformance(criterion.id, c)}
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                            finding.conformance === c
                              ? CONFORMANCE_CONFIG[c].color + ' border-current'
                              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {CONFORMANCE_CONFIG[c].short}
                        </button>
                      ))}
                      {/* Severity (only when fail) */}
                      {finding.conformance === 'fail' && (
                        <select
                          value={finding.severity || ''}
                          onChange={e => updateFinding(criterion.id, { severity: e.target.value as Severity || null })}
                          onClick={e => e.stopPropagation()}
                          className={`text-xs rounded border px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#0058AB]/50 ${
                            finding.severity ? SEVERITY_CONFIG[finding.severity].color : 'border-gray-200 text-gray-400'
                          }`}
                        >
                          <option value="">Severity</option>
                          <option value="blocker">Blocker</option>
                          <option value="serious">Serious</option>
                          <option value="moderate">Moderate</option>
                          <option value="minor">Minor</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="px-11 pb-4 bg-gray-50 border-t">
                      {/* Pass condition */}
                      <div className="mt-3 p-3 rounded-lg bg-white border text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Pass condition: </span>{criterion.passCondition}
                      </div>

                      {/* Detail fields */}
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className={labelCls}>Page & Component</label>
                          <input
                            type="text"
                            value={finding.pageComponent}
                            onChange={e => updateFinding(criterion.id, { pageComponent: e.target.value })}
                            placeholder="e.g. Home page / Hero banner"
                            className={miniInputCls}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Method Used</label>
                          <input
                            type="text"
                            value={finding.method}
                            onChange={e => updateFinding(criterion.id, { method: e.target.value })}
                            placeholder="e.g. Keyboard navigation, Axe DevTools"
                            className={miniInputCls}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Recommendations</label>
                          <textarea
                            value={finding.recommendations}
                            onChange={e => updateFinding(criterion.id, { recommendations: e.target.value })}
                            placeholder="How to fix this issue…"
                            rows={2}
                            className={`${miniInputCls} resize-none`}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Notes / Screenshots</label>
                          <textarea
                            value={finding.notes}
                            onChange={e => updateFinding(criterion.id, { notes: e.target.value })}
                            placeholder="Observations, evidence, links to screenshots…"
                            rows={2}
                            className={`${miniInputCls} resize-none`}
                          />
                        </div>
                      </div>

                      {/* Platform columns */}
                      <div className="mt-3">
                        <label className={labelCls}>Platform Results</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {(['windows', 'android', 'ios', 'mac'] as const).map(platform => (
                            <div key={platform}>
                              <label className="block text-xs text-gray-400 mb-1 capitalize">{platform}</label>
                              <select
                                value={(finding as any)[platform] || ''}
                                onChange={e => updateFinding(criterion.id, { [platform]: e.target.value })}
                                className={miniInputCls}
                              >
                                <option value="">—</option>
                                <option value="pass">Pass</option>
                                <option value="fail">Fail</option>
                                <option value="na">N/A</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Integration buttons */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => { setJiraModal({ criterionId: criterion.id, type: 'jira' }); setTicketUrl(finding.jiraTicket || ''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0058AB]/30 bg-[#0058AB]/10 text-[#0058AB] text-xs hover:bg-[#0058AB]/20 transition-colors"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          {finding.jiraTicket ? 'Edit Jira Ticket' : 'Send to Jira'}
                        </button>
                        <button
                          onClick={() => { setJiraModal({ criterionId: criterion.id, type: 'azdo' }); setTicketUrl(finding.azdoTicket || ''); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 text-xs hover:bg-purple-100 transition-colors"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          {finding.azdoTicket ? 'Edit AzDo Ticket' : 'Send to Azure DevOps'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {grouped.length === 0 && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          No criteria match your filters.
        </div>
      )}

      {/* RGAA 4.1 additional criteria */}
      {conformanceTargets.includes('rgaa41') && RGAA_THEMES.map(theme => {
        const themeCriteria = RGAA_CRITERIA.filter(c => {
          if (c.theme !== theme) return false;
          if (search) {
            const q = search.toLowerCase();
            return c.criterion.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.passCondition.toLowerCase().includes(q);
          }
          return true;
        });
        if (themeCriteria.length === 0) return null;
        return (
          <div key={theme} className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-3 border-b bg-blue-50 border-blue-200 border-l-4 border-l-blue-400 flex items-center gap-2">
              <span className="text-base">🇫🇷</span>
              <div>
                <h3 className="font-semibold text-blue-900">RGAA — {theme}</h3>
                <p className="text-xs mt-0.5 text-blue-700 opacity-70">{themeCriteria.length} criteria</p>
              </div>
            </div>
            <div className="divide-y">
              {themeCriteria.map(criterion => {
                const finding = getFinding(findings, criterion.id) || createDefaultFinding(criterion.id);
                const isExpanded = expanded.has(criterion.id);
                return (
                  <div key={criterion.id} className="group">
                    <div
                      className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleExpand(criterion.id)}
                    >
                      <div className="mt-0.5 text-gray-400 shrink-0">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-blue-600">{criterion.criterion}</span>
                          <span className="text-sm font-medium text-gray-800">{criterion.name}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{criterion.level}</span>
                          {finding.jiraTicket && (
                            <a href={finding.jiraTicket} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-xs px-1.5 py-0.5 rounded bg-[#0058AB]/10 text-[#0058AB] hover:underline flex items-center gap-1">
                              <Ticket className="w-3 h-3" /> Jira
                            </a>
                          )}
                        </div>
                        {finding.conformance === 'fail' && finding.recommendations && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{finding.recommendations}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                        {(['pass', 'fail', 'na'] as Conformance[]).map(c => (
                          <button
                            key={c}
                            onClick={() => setConformance(criterion.id, c)}
                            className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                              finding.conformance === c
                                ? CONFORMANCE_CONFIG[c].color + ' border-current'
                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {CONFORMANCE_CONFIG[c].short}
                          </button>
                        ))}
                        {finding.conformance === 'fail' && (
                          <select
                            value={finding.severity || ''}
                            onChange={e => updateFinding(criterion.id, { severity: e.target.value as Severity || null })}
                            onClick={e => e.stopPropagation()}
                            className={`text-xs rounded border px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#0058AB]/50 ${
                              finding.severity ? SEVERITY_CONFIG[finding.severity].color : 'border-gray-200 text-gray-400'
                            }`}
                          >
                            <option value="">Severity</option>
                            <option value="blocker">Blocker</option>
                            <option value="serious">Serious</option>
                            <option value="moderate">Moderate</option>
                            <option value="minor">Minor</option>
                          </select>
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-11 pb-4 bg-gray-50 border-t">
                        <div className="mt-3 p-3 rounded-lg bg-white border text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Pass condition: </span>{criterion.passCondition}
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>Findings / Recommendations</label>
                            <textarea
                              rows={3}
                              value={finding.recommendations}
                              onChange={e => updateFinding(criterion.id, { recommendations: e.target.value })}
                              placeholder="Describe what failed and how to fix it…"
                              className={miniInputCls + ' resize-none'}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Notes</label>
                            <textarea
                              rows={3}
                              value={finding.notes}
                              onChange={e => updateFinding(criterion.id, { notes: e.target.value })}
                              placeholder="Additional context…"
                              className={miniInputCls + ' resize-none'}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => { setJiraModal({ criterionId: criterion.id, type: 'jira' }); setTicketUrl(finding.jiraTicket || ''); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0058AB]/30 bg-[#0058AB]/10 text-[#0058AB] text-xs hover:bg-[#0058AB]/20 transition-colors"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            {finding.jiraTicket ? 'Edit Jira Ticket' : 'Send to Jira'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Jira/AzDo modal */}
      {jiraModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">
                {jiraModal.type === 'jira' ? 'Link Jira Ticket' : 'Link Azure DevOps Work Item'}
              </h3>
              <button onClick={() => setJiraModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {jiraModal.type === 'jira'
                ? 'Paste the Jira ticket URL to link it to this finding. In production, this would create a ticket automatically via the Jira API.'
                : 'Paste the Azure DevOps work item URL to link it to this finding. In production, this would create a work item via the Azure DevOps REST API.'}
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ticket URL</label>
            <input
              type="url"
              value={ticketUrl}
              onChange={e => setTicketUrl(e.target.value)}
              placeholder={jiraModal.type === 'jira' ? 'https://yourorg.atlassian.net/browse/PROJ-123' : 'https://dev.azure.com/org/project/_workitems/edit/123'}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0058AB]/40"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setJiraModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button
                onClick={() => saveTicket(jiraModal.criterionId, jiraModal.type)}
                className="px-4 py-2 rounded-lg bg-[#0058AB] text-white text-sm font-medium hover:bg-[#004a91] transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> Link Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const selectCls = 'text-sm rounded-lg border border-gray-200 px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0058AB]/40 bg-white';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const miniInputCls = 'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0058AB]/40 bg-white';
