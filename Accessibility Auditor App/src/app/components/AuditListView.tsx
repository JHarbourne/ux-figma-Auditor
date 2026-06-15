import { AuditRecord, SCORE_CONFIG } from './types';
import { Code2, Building2, Plus, Trash2, Download, Share2, FileDown } from 'lucide-react';

interface Props {
  audits: AuditRecord[];
  onOpenAudit: (id: string) => void;
  onNewAudit: () => void;
  onDelete: (id: string) => void;
  onExportAudit: (audit: AuditRecord) => void;
  onExportAll: () => void;
  onShare: (audit: AuditRecord) => void;
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AuditListView({ audits, onOpenAudit, onNewAudit, onDelete, onExportAudit, onExportAll, onShare }: Props) {
  const sorted = audits.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#121A38]">All Audits</h2>
          <p className="text-sm text-gray-500 mt-0.5">{audits.length} audit{audits.length !== 1 ? 's' : ''} recorded</p>
        </div>
        <div className="flex items-center gap-2">
          {audits.length > 0 && (
            <button
              onClick={onExportAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 border hover:bg-gray-50 transition-colors"
              title="Export all audits to Excel"
            >
              <FileDown className="w-4 h-4" /> Export all
            </button>
          )}
          <button
            onClick={onNewAudit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[#0058AB] text-white hover:bg-[#004a91] transition-colors"
          >
            <Plus className="w-4 h-4" /> New Audit
          </button>
        </div>
      </div>

      {audits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 font-medium">No audits yet</p>
          <p className="text-gray-400 text-sm mt-1">Click <strong>New Audit</strong> to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#121A38] text-white text-sm font-semibold">
                <th className="text-left font-semibold px-4 py-3">Software / Product</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-left font-semibold px-4 py-3">Score</th>
                <th className="text-left font-semibold px-4 py-3">Issues</th>
                <th className="text-left font-semibold px-4 py-3">Last updated</th>
                <th className="px-4 py-3 w-36" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sorted.map(audit => {
                const score = SCORE_CONFIG[audit.project.overallScore];
                const fails = audit.findings.filter(f => f.conformance === 'fail').length;
                const isCots = audit.project.softwareType === 'cots';
                return (
                  <tr
                    key={audit.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => onOpenAudit(audit.id)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {audit.project.productName || <span className="text-gray-400 italic">Untitled</span>}
                    </td>
                    <td className="px-4 py-3">
                      {isCots ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                          <Building2 className="w-3 h-3" /> COTS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                          <Code2 className="w-3 h-3" /> Home Grown
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${score.color} bg-white`}>
                        {score.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {fails > 0
                        ? <span className="text-red-600 font-medium">{fails} issue{fails !== 1 ? 's' : ''}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(audit.updatedAt)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => onOpenAudit(audit.id)}
                          className="text-xs text-[#0058AB] hover:underline font-medium px-1"
                        >
                          Open →
                        </button>
                        <button
                          onClick={() => onShare(audit)}
                          className="p-1.5 text-gray-400 hover:text-[#0058AB] hover:bg-blue-50 rounded transition-colors"
                          title="Share via email"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onExportAudit(audit)}
                          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Export to Excel"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(audit.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
