import { useMemo } from 'react';
import { AuditRecord, SCORE_CONFIG } from './types';
import { Code2, Building2, ShieldCheck, Users, FileCheck, AlertTriangle } from 'lucide-react';

interface Props {
  audits: AuditRecord[];
  onOpenAudit: (id: string) => void;
}

const NAV_HEADER = 'bg-[#121A38] text-white text-sm font-semibold px-4 py-2.5';
const NAV_ROW = 'px-4 py-2.5 text-sm border-b border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors';
const SECTION_TITLE = 'text-lg font-bold text-[#121A38] mb-1';
const DIVIDER = 'border-b-2 border-[#0058AB] mb-4';

type ComplianceRow = { label: string; count: number; color?: string };
type ProgressRow = { label: string; count: number };

function StatsTable({ title, rows }: { title: string; rows: (ComplianceRow | ProgressRow)[] }) {
  return (
    <div className="flex-1 min-w-0">
      <h3 className={SECTION_TITLE}>{title}</h3>
      <div className={DIVIDER} />
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className={NAV_HEADER}>
            <th className="text-left font-semibold py-2 px-3 rounded-tl-sm">
              {title.includes('Compliance') ? 'Compliance status' : 'Progress status'}
            </th>
            <th className="text-left font-semibold py-2 px-3 rounded-tr-sm w-20">Count</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-2.5 text-gray-800">{row.label}</td>
              <td className="px-3 py-2.5 font-semibold text-gray-900">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: number | string; sub?: string; color: string;
}) {
  return (
    <div className={`rounded-xl border-2 p-5 flex items-start gap-3 ${color}`}>
      <div className="shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm font-medium mt-0.5">{label}</div>
        {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export function PortfolioDashboard({ audits, onOpenAudit }: Props) {
  const stats = useMemo(() => {
    const hg = audits.filter(a => a.project.softwareType === 'home-grown');
    const cots = audits.filter(a => a.project.softwareType === 'cots');

    // HG compliance
    const hgCompliance: ComplianceRow[] = [
      { label: 'Compliant',            count: hg.filter(a => a.project.overallScore === 'compliant').length },
      { label: 'Non-Compliant',        count: hg.filter(a => a.project.overallScore === 'non-compliant').length },
      { label: 'Remediation ongoing',  count: hg.filter(a => a.project.overallScore === 'under-remediation').length },
      { label: 'Not Assessed',         count: hg.filter(a => a.project.overallScore === 'not-assessed').length },
    ];

    // HG progress – derive from findings & score
    const hgProgress: ProgressRow[] = [
      { label: 'Identified for audit',      count: hg.filter(a => a.project.overallScore === 'not-assessed').length },
      { label: 'Audit in progress',         count: hg.filter(a => a.findings.length > 0 && a.project.overallScore === 'not-assessed').length },
      { label: 'Remediation ongoing',       count: hg.filter(a => a.project.overallScore === 'under-remediation').length },
      { label: 'Compliant',                 count: hg.filter(a => a.project.overallScore === 'compliant').length },
    ];

    // COTS compliance
    const cotsCompliance: ComplianceRow[] = [
      { label: 'Compliant',       count: cots.filter(a => a.project.overallScore === 'compliant').length },
      { label: 'Non-Compliant',   count: cots.filter(a => a.project.overallScore === 'non-compliant').length },
      { label: 'Under Remediation', count: cots.filter(a => a.project.overallScore === 'under-remediation').length },
      { label: 'Not Assessed',    count: cots.filter(a => a.project.overallScore === 'not-assessed').length },
    ];

    // COTS VPAT progress
    const contacted = cots.filter(a => a.project.vpatStatus !== 'not-requested' || !!a.project.serviceOwnerEmail);
    const cotsProgress: ProgressRow[] = [
      { label: 'Service owners contacted',  count: cots.filter(a => !!a.project.serviceOwnerEmail || a.project.vpatStatus !== 'not-requested').length },
      { label: 'VPAT requested',            count: cots.filter(a => ['requested', 'received', 'reviewed'].includes(a.project.vpatStatus)).length },
      { label: 'VPAT received',             count: cots.filter(a => ['received', 'reviewed'].includes(a.project.vpatStatus)).length },
      { label: 'VPAT reviewed',             count: cots.filter(a => a.project.vpatStatus === 'reviewed').length },
    ];

    return { hg, cots, hgCompliance, hgProgress, cotsCompliance, cotsProgress };
  }, [audits]);

  const totalAudits = audits.length;
  const hgCount = stats.hg.length;
  const cotsCount = stats.cots.length;

  return (
    <div className="space-y-8">
      {/* Top summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<ShieldCheck className="w-6 h-6 text-blue-600" />}
          label="Total audits" value={totalAudits}
          color="border-blue-100 bg-blue-50"
        />
        <SummaryCard
          icon={<Code2 className="w-6 h-6 text-blue-600" />}
          label="Home Grown" value={hgCount}
          sub={`${stats.hg.filter(a => a.project.overallScore === 'compliant').length} compliant`}
          color="border-blue-100 bg-blue-50"
        />
        <SummaryCard
          icon={<Building2 className="w-6 h-6 text-purple-600" />}
          label="COTS" value={cotsCount}
          sub={`${stats.cots.filter(a => a.project.overallScore === 'compliant').length} compliant`}
          color="border-purple-100 bg-purple-50"
        />
        <SummaryCard
          icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
          label="Non-Compliant"
          value={audits.filter(a => a.project.overallScore === 'non-compliant').length}
          color="border-red-100 bg-red-50"
        />
      </div>

      {/* ── Home Grown section ── */}
      {stats.hg.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Code2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-[#121A38]">
              Accessibility status: HG (Home Grown) applications
            </h2>
            <span className="ml-auto text-sm text-gray-500">{stats.hg.length} application{stats.hg.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex gap-8 mb-6">
            <StatsTable title="Compliance overview" rows={stats.hgCompliance} />
            <StatsTable title="Progress overview" rows={stats.hgProgress} />
          </div>

          {/* Per-audit list */}
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className={NAV_HEADER + ' rounded-none'}>
                  <th className="text-left font-semibold px-4 py-2.5">Application</th>
                  <th className="text-left font-semibold px-4 py-2.5">Context</th>
                  <th className="text-left font-semibold px-4 py-2.5">Conducted by</th>
                  <th className="text-left font-semibold px-4 py-2.5">Date</th>
                  <th className="text-left font-semibold px-4 py-2.5">Score</th>
                  <th className="text-left font-semibold px-4 py-2.5">Issues</th>
                  <th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {stats.hg.map(audit => {
                  const score = SCORE_CONFIG[audit.project.overallScore];
                  const fails = audit.findings.filter(f => f.conformance === 'fail').length;
                  return (
                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{audit.project.productName || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{audit.project.context || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-600">{audit.project.conductedBy || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500">{audit.project.dateFrom || '—'}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${score.color} bg-white`}>{score.label}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {fails > 0 ? <span className="text-red-600 font-medium">{fails}</span> : <span className="text-gray-400">0</span>}
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => onOpenAudit(audit.id)} className="text-xs text-[#0058AB] hover:underline font-medium">
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── COTS section ── */}
      {stats.cots.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-5">
            <Building2 className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-[#121A38]">
              Accessibility status: COTS (Commercial off-the-Shelf)
            </h2>
            <span className="ml-auto text-sm text-gray-500">{stats.cots.length} application{stats.cots.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex gap-8 mb-6">
            <StatsTable title="Compliance overview" rows={stats.cotsCompliance} />
            <StatsTable title="Progress overview (VPAT)" rows={stats.cotsProgress} />
          </div>

          {/* Per-vendor VPAT tracking table */}
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className={NAV_HEADER + ' rounded-none'}>
                  <th className="text-left font-semibold px-4 py-2.5">Application</th>
                  <th className="text-left font-semibold px-4 py-2.5">Vendor</th>
                  <th className="text-left font-semibold px-4 py-2.5">Service owner</th>
                  <th className="text-left font-semibold px-4 py-2.5">Scope</th>
                  <th className="text-left font-semibold px-4 py-2.5">VPAT status</th>
                  <th className="text-left font-semibold px-4 py-2.5">Compliance</th>
                  <th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {stats.cots.map(audit => {
                  const score = SCORE_CONFIG[audit.project.overallScore];
                  const vpatColors: Record<string, string> = {
                    'not-requested': 'text-gray-400',
                    'requested':     'text-yellow-600 font-medium',
                    'received':      'text-blue-600 font-medium',
                    'reviewed':      'text-green-600 font-medium',
                  };
                  const vpatLabels: Record<string, string> = {
                    'not-requested': 'Not requested',
                    'requested':     'Requested',
                    'received':      'Received',
                    'reviewed':      'Reviewed',
                  };
                  const scopeLabels: Record<string, string> = {
                    'vpat-request':   'VPAT request',
                    'customization':  'Customisation',
                    'both':           'VPAT + Customisation',
                  };
                  return (
                    <tr key={audit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-gray-900">{audit.project.productName || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-700">{audit.project.vendorName || '—'}</td>
                      <td className="px-4 py-2.5">
                        {audit.project.serviceOwnerName ? (
                          <div>
                            <div className="text-gray-800">{audit.project.serviceOwnerName}</div>
                            {audit.project.serviceOwnerEmail && (
                              <div className="text-xs text-gray-400">{audit.project.serviceOwnerEmail}</div>
                            )}
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">
                        {scopeLabels[audit.project.cotsScope] || '—'}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={vpatColors[audit.project.vpatStatus] || 'text-gray-500'}>
                          {vpatLabels[audit.project.vpatStatus] || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${score.color} bg-white`}>{score.label}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button onClick={() => onOpenAudit(audit.id)} className="text-xs text-[#0058AB] hover:underline font-medium">
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Empty state */}
      {audits.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldCheck className="w-16 h-16 text-blue-100 mb-4" />
          <p className="text-gray-600 font-medium">No audits yet</p>
          <p className="text-gray-400 text-sm mt-1">Click <strong>+ New Test</strong> in the top-right to create your first audit.</p>
        </div>
      )}
    </div>
  );
}
