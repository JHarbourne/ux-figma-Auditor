import * as XLSX from 'xlsx';
import { AuditRecord, AuditFinding, DEFAULT_PROJECT, DEFAULT_PAGES, WCAG_CRITERIA } from './components/types';

// ── Export ────────────────────────────────────────────────────────────────────

export function exportAuditToExcel(audit: AuditRecord) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Project info
  const projectRows = [
    ['Field', 'Value'],
    ['Product Name', audit.project.productName],
    ['Software Type', audit.project.softwareType === 'cots' ? 'COTS' : 'Home Grown'],
    ['Overall Score', audit.project.overallScore],
    ['Risk Level', audit.project.riskLevel],
    ['Context', audit.project.context],
    ['Date From', audit.project.dateFrom],
    ['Date To', audit.project.dateTo],
    ['Conducted By', audit.project.conductedBy],
    ['PO Email', audit.project.poEmail],
    ['Rescan Date', audit.project.rescanDate],
    ['Browsers', audit.project.browsers],
    ['OS', audit.project.os],
    ['Devices', audit.project.devices],
    ['Assistive Tech', audit.project.assistiveTech],
    ['Manual Methods', audit.project.manualMethods],
    ['Automated Tools', audit.project.automatedTools],
    ['Comments', audit.project.comments],
    ...(audit.project.softwareType === 'cots' ? [
      ['Vendor Name', audit.project.vendorName],
      ['COTS Scope', audit.project.cotsScope],
      ['Service Owner Name', audit.project.serviceOwnerName],
      ['Service Owner Email', audit.project.serviceOwnerEmail],
      ['VPAT Status', audit.project.vpatStatus],
      ['VPAT Received Date', audit.project.vpatReceivedDate],
      ['VPAT Notes', audit.project.vpatNotes],
    ] : []),
  ];
  const wsProject = XLSX.utils.aoa_to_sheet(projectRows);
  wsProject['!cols'] = [{ wch: 22 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsProject, 'Project');

  // Sheet 2: Pages
  const pageRows = [
    ['#', 'Page Type', 'URL', 'Comment'],
    ...audit.pages.map(p => [p.number, p.pageType, p.url, p.comment]),
  ];
  const wsPages = XLSX.utils.aoa_to_sheet(pageRows);
  wsPages['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 50 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsPages, 'Pages');

  // Sheet 3: Findings
  const findingRows = [
    ['Criterion ID', 'Criterion', 'Name', 'Level', 'Principle', 'Page/Component', 'Method', 'Conformance', 'Severity', 'Recommendations', 'Notes', 'Windows', 'Android', 'iOS', 'Mac', 'Jira', 'AzDo'],
    ...audit.findings.map(f => {
      const crit = WCAG_CRITERIA.find(c => c.id === f.criterionId);
      return [
        f.criterionId,
        crit?.criterion ?? '',
        crit?.name ?? '',
        crit?.level ?? '',
        crit?.principle ?? '',
        f.pageComponent,
        f.method,
        f.conformance ?? '',
        f.severity ?? '',
        f.recommendations,
        f.notes,
        f.windows,
        f.android,
        f.ios,
        f.mac,
        f.jiraTicket,
        f.azdoTicket,
      ];
    }),
  ];
  const wsFindings = XLSX.utils.aoa_to_sheet(findingRows);
  wsFindings['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 6 }, { wch: 14 },
    { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
    { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 15 },
  ];
  XLSX.utils.book_append_sheet(wb, wsFindings, 'Findings');

  const fileName = `${audit.project.productName || 'audit'}_accessibility_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

// ── Export all audits ─────────────────────────────────────────────────────────

export function exportAllAuditsToExcel(audits: AuditRecord[]) {
  const wb = XLSX.utils.book_new();

  const rows = [
    ['Product Name', 'Software Type', 'Score', 'Risk', 'Issues', 'Conducted By', 'Date From', 'Date To', 'Context'],
    ...audits.map(a => [
      a.project.productName,
      a.project.softwareType === 'cots' ? 'COTS' : 'Home Grown',
      a.project.overallScore,
      a.project.riskLevel,
      a.findings.filter(f => f.conformance === 'fail').length,
      a.project.conductedBy,
      a.project.dateFrom,
      a.project.dateTo,
      a.project.context,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 30 }];
  XLSX.utils.book_append_sheet(wb, ws, 'All Audits');

  XLSX.writeFile(wb, `accessibility_audits_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Import ────────────────────────────────────────────────────────────────────

function cell(ws: XLSX.WorkSheet, addr: string): string {
  return ws[addr]?.v?.toString() ?? '';
}

export function importAuditFromExcel(file: File): Promise<AuditRecord> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });

        const wsProject = wb.Sheets['Project'];
        const wsPages = wb.Sheets['Pages'];
        const wsFindings = wb.Sheets['Findings'];

        if (!wsProject) throw new Error('Missing "Project" sheet');

        // Parse project key-value pairs
        const projectData: Record<string, string> = {};
        const projectRows = XLSX.utils.sheet_to_json<string[]>(wsProject, { header: 1 }) as string[][];
        for (const [key, val] of projectRows.slice(1)) {
          if (key) projectData[key] = val?.toString() ?? '';
        }

        const softwareType = projectData['Software Type'] === 'COTS' ? 'cots' : 'home-grown';
        const project = {
          ...DEFAULT_PROJECT,
          productName: projectData['Product Name'] ?? '',
          softwareType,
          overallScore: (projectData['Overall Score'] as any) ?? 'not-assessed',
          riskLevel: (projectData['Risk Level'] as any) ?? 'low',
          context: projectData['Context'] ?? '',
          dateFrom: projectData['Date From'] ?? '',
          dateTo: projectData['Date To'] ?? '',
          conductedBy: projectData['Conducted By'] ?? '',
          poEmail: projectData['PO Email'] ?? '',
          rescanDate: projectData['Rescan Date'] ?? '',
          browsers: projectData['Browsers'] ?? '',
          os: projectData['OS'] ?? '',
          devices: projectData['Devices'] ?? '',
          assistiveTech: projectData['Assistive Tech'] ?? '',
          manualMethods: projectData['Manual Methods'] ?? '',
          automatedTools: projectData['Automated Tools'] ?? '',
          comments: projectData['Comments'] ?? '',
          vendorName: projectData['Vendor Name'] ?? '',
          cotsScope: (projectData['COTS Scope'] as any) ?? 'vpat-request',
          serviceOwnerName: projectData['Service Owner Name'] ?? '',
          serviceOwnerEmail: projectData['Service Owner Email'] ?? '',
          vpatStatus: (projectData['VPAT Status'] as any) ?? 'not-requested',
          vpatReceivedDate: projectData['VPAT Received Date'] ?? '',
          vpatNotes: projectData['VPAT Notes'] ?? '',
        };

        // Parse pages
        const pages = wsPages
          ? (XLSX.utils.sheet_to_json<any>(wsPages, { header: 1 }) as any[][])
              .slice(1)
              .filter(r => r[0] != null)
              .map(r => ({
                id: crypto.randomUUID(),
                number: Number(r[0]),
                pageType: r[1]?.toString() ?? '',
                url: r[2]?.toString() ?? '',
                comment: r[3]?.toString() ?? '',
              }))
          : DEFAULT_PAGES.map(p => ({ ...p, id: crypto.randomUUID() }));

        // Parse findings
        const findings: AuditFinding[] = wsFindings
          ? (XLSX.utils.sheet_to_json<any>(wsFindings, { header: 1 }) as any[][])
              .slice(1)
              .filter(r => r[0] != null)
              .map(r => ({
                id: crypto.randomUUID(),
                criterionId: r[0]?.toString() ?? '',
                pageComponent: r[5]?.toString() ?? '',
                method: r[6]?.toString() ?? '',
                conformance: (r[7]?.toString() || null) as any,
                severity: (r[8]?.toString() || null) as any,
                recommendations: r[9]?.toString() ?? '',
                notes: r[10]?.toString() ?? '',
                windows: r[11]?.toString() ?? '',
                android: r[12]?.toString() ?? '',
                ios: r[13]?.toString() ?? '',
                mac: r[14]?.toString() ?? '',
                jiraTicket: r[15]?.toString() ?? '',
                azdoTicket: r[16]?.toString() ?? '',
              }))
          : [];

        const record: AuditRecord = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          project,
          findings,
          pages,
        };

        resolve(record);
      } catch (err: any) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
