import { Trash2, Clock, Building2, Code2 } from 'lucide-react';
import { AuditRecord, SCORE_CONFIG } from './types';

interface Props {
  audits: AuditRecord[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AuditList({ audits, activeId, onSelect, onNew, onDelete }: Props) {
  return (
    <div className="flex flex-col gap-1 w-full">
      {audits.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No tests yet.</p>
      )}
        {audits.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(audit => {
          const isActive = audit.id === activeId;
          const score = SCORE_CONFIG[audit.project.overallScore];
          const failCount = audit.findings.filter(f => f.conformance === 'fail').length;
          return (
            <div
              key={audit.id}
              onClick={() => onSelect(audit.id)}
              className={`group relative rounded-xl border p-3 cursor-pointer transition-all ${
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-gray-800">
                    {audit.project.productName || 'Untitled Test'}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDate(audit.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); onDelete(audit.id); }}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all shrink-0 mt-0.5"
                  title="Delete test"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${score.color} bg-white border`}>
                  {score.label}
                </span>
                {audit.project.softwareType === 'cots' ? (
                  <span className="flex items-center gap-0.5 text-xs text-purple-600 font-medium">
                    <Building2 className="w-3 h-3" /> COTS
                  </span>
                ) : (
                  <span className="flex items-center gap-0.5 text-xs text-blue-500 font-medium">
                    <Code2 className="w-3 h-3" /> In-house
                  </span>
                )}
                {failCount > 0 && (
                  <span className="text-xs text-red-600 font-medium">{failCount} issue{failCount !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
