import { useState, useEffect, useRef } from "react";
import { Toaster, toast } from "sonner";
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  FileOutput,
  ShieldCheck,
  Save,
  Plus,
  X,
  ChevronLeft,
  LogOut,
  User,
  List,
  Upload,
  Mail,
} from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { AuditSetup } from "./components/AuditSetup";
import { AuditFindings } from "./components/AuditFindings";
import { ReportView } from "./components/ReportView";
import { PortfolioDashboard } from "./components/PortfolioDashboard";
import { AuditListView } from "./components/AuditListView";
import { EmailTemplates } from "./components/EmailTemplates";
import { EmailComposer } from "./components/EmailComposer";
import { LoginScreen } from "./components/LoginScreen";
import { ShareModal } from "./components/ShareModal";
import { supabase } from "./supabaseClient";
import {
  exportAuditToExcel,
  exportAllAuditsToExcel,
  importAuditFromExcel,
} from "./excelUtils";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import {
  AuditRecord,
  EmailTemplate,
  DEFAULT_PROJECT,
  DEFAULT_PAGES,
  DEFAULT_EMAIL_TEMPLATES,
} from "./components/types";

const SERVER = `https://${projectId}.supabase.co/functions/v1/make-server-1ee6cbef`;

interface AuthSession {
  accessToken: string;
  email: string;
  name: string;
}

type Tab = "dashboard" | "setup" | "findings" | "report";
type View = "portfolio" | "audits" | "audit" | "templates";

const TEMPLATES_KEY = "accessibility-auditor-templates";

function loadTemplates(): EmailTemplate[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_EMAIL_TEMPLATES;
}

function saveTemplates(templates: EmailTemplate[]) {
  localStorage.setItem(
    TEMPLATES_KEY,
    JSON.stringify(templates),
  );
}

const STORAGE_KEY = "accessibility-auditor-v2";

interface StoredState {
  audits: AuditRecord[];
  activeAuditId: string | null;
}

function loadState(): StoredState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    const v1 = localStorage.getItem("accessibility-auditor-v1");
    if (v1) {
      const old = JSON.parse(v1);
      const record: AuditRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        project: old.project ?? { ...DEFAULT_PROJECT },
        findings: old.findings ?? [],
        pages: old.pages ?? DEFAULT_PAGES,
      };
      return { audits: [record], activeAuditId: record.id };
    }
  } catch {}
  return { audits: [], activeAuditId: null };
}

function saveState(state: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function createAuditRecord(): AuditRecord {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    project: { ...DEFAULT_PROJECT },
    findings: [],
    pages: DEFAULT_PAGES.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
    })),
  };
}

export default function App() {
  const [authSession, setAuthSession] =
    useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [view, setView] = useState<View>("portfolio");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [shareAudit, setShareAudit] =
    useState<AuditRecord | null>(null);
  const [emailComposerAudit, setEmailComposerAudit] =
    useState<AuditRecord | null>(null);
  const [templates, setTemplates] =
    useState<EmailTemplate[]>(loadTemplates);
  const importRef = useRef<HTMLInputElement>(null);

  function handleTemplatesChange(updated: EmailTemplate[]) {
    setTemplates(updated);
    saveTemplates(updated);
  }

  const topNav = [
    {
      id: "portfolio" as View,
      label: "Overview",
      icon: LayoutDashboard,
    },
    { id: "audits" as View, label: "Audits", icon: List },
    {
      id: "templates" as View,
      label: "Email Templates",
      icon: Mail,
    },
  ];

  const [{ audits, activeAuditId }, setStored] =
    useState<StoredState>(loadState);
  const [dirty, setDirty] = useState(false);

  // Restore session on mount; also handle ?share= URL param
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setAuthSession({
          accessToken: session.access_token,
          email: session.user.email ?? "",
          name:
            (session.user.user_metadata?.name as string) ||
            session.user.email ||
            "",
        });
      }
      setAuthLoading(false);
    });
  }, []);

  // Handle shared audit link after auth resolves
  useEffect(() => {
    if (authLoading || !authSession) return;
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get("share");
    if (!shareId) return;

    fetch(`${SERVER}/share/${shareId}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.audit) {
          const imported: AuditRecord = {
            ...data.audit,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setStored((prev) => ({
            audits: [...prev.audits, imported],
            activeAuditId: imported.id,
          }));
          setDirty(true);
          setView("audit");
          setActiveTab("dashboard");
          toast.success(
            `Shared audit "${imported.project.productName || "Untitled"}" imported!`,
          );
          // Clean URL
          window.history.replaceState(
            {},
            "",
            window.location.pathname,
          );
        }
      })
      .catch(() => toast.error("Failed to load shared audit"));
  }, [authLoading, authSession]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setAuthSession(null);
  }

  const activeAudit =
    audits.find((a) => a.id === activeAuditId) ?? null;

  function mutateAudit(
    id: string,
    updater: (a: AuditRecord) => AuditRecord,
  ) {
    setStored((prev) => ({
      ...prev,
      audits: prev.audits.map((a) =>
        a.id === id
          ? {
              ...updater(a),
              updatedAt: new Date().toISOString(),
            }
          : a,
      ),
    }));
    setDirty(true);
  }

  function handleNewTest() {
    const record = createAuditRecord();
    setStored((prev) => ({
      audits: [...prev.audits, record],
      activeAuditId: record.id,
    }));
    setActiveTab("setup");
    setView("audit");
    setDirty(true);
  }

  function handleOpenAudit(id: string) {
    setStored((prev) => ({ ...prev, activeAuditId: id }));
    setActiveTab("dashboard");
    setView("audit");
  }

  function handleDeleteAudit(id: string) {
    if (!confirm("Delete this audit? This cannot be undone."))
      return;
    setStored((prev) => {
      const remaining = prev.audits.filter((a) => a.id !== id);
      const newActive =
        prev.activeAuditId === id
          ? (remaining[0]?.id ?? null)
          : prev.activeAuditId;
      return { audits: remaining, activeAuditId: newActive };
    });
    setDirty(true);
  }

  function handleSave() {
    setStored((prev) => {
      saveState(prev);
      return prev;
    });
    setDirty(false);
    toast.success("All audits saved!");
  }

  async function handleImportExcel(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const record = await importAuditFromExcel(file);
      setStored((prev) => ({
        audits: [...prev.audits, record],
        activeAuditId: record.id,
      }));
      setDirty(true);
      setView("audit");
      setActiveTab("dashboard");
      toast.success(
        `Imported "${record.project.productName || "Untitled"}" from Excel`,
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to import Excel file");
    }
  }

  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      setStored((prev) => {
        saveState(prev);
        return prev;
      });
      setDirty(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [dirty, audits, activeAuditId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#0058AB] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authSession) {
    return (
      <>
        <Toaster position="top-right" />
        <LoginScreen onAuth={setAuthSession} />
      </>
    );
  }

  const failCount =
    activeAudit?.findings.filter(
      (f) => f.conformance === "fail",
    ).length ?? 0;
  const passCount =
    activeAudit?.findings.filter(
      (f) => f.conformance === "pass",
    ).length ?? 0;

  const tabs = [
    {
      id: "dashboard" as Tab,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    { id: "setup" as Tab, label: "Setup", icon: Settings },
    {
      id: "findings" as Tab,
      label: `Findings${failCount > 0 ? ` (${failCount})` : ""}`,
      icon: ClipboardList,
    },
    { id: "report" as Tab, label: "Report", icon: FileOutput },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Toaster position="top-right" />

      {/* Hidden file input for Excel import */}
      <input
        ref={importRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleImportExcel}
      />

      {/* ── Header ── */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-14 gap-4">
            {/* Logo + title */}
            <button
              onClick={() => setView("portfolio")}
              className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#0058AB]">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm hidden sm:inline">
                Accessibility Auditor
              </span>
            </button>

            {/* Top nav — Overview / Audits (hidden when inside an audit) */}
            {view !== "audit" && (
              <nav className="flex items-center gap-1 ml-1">
                {topNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        view === item.id
                          ? "bg-[#0058AB]/10 text-[#0058AB]"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            )}

            {/* Breadcrumb when viewing an audit */}
            {view === "audit" && activeAudit && (
              <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0">
                <span className="text-gray-300">/</span>
                <button
                  onClick={() => setView("audits")}
                  className="text-[#0058AB] hover:underline shrink-0"
                >
                  Audits
                </button>
                <span className="text-gray-300">/</span>
                <span className="truncate text-gray-700 font-medium">
                  {activeAudit.project.productName ||
                    "Untitled Audit"}
                </span>
              </div>
            )}

            <div className="flex-1" />

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              {view === "audit" &&
                passCount + failCount > 0 && (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 mr-1">
                    <span className="text-green-600 font-medium">
                      {passCount} pass
                    </span>
                    <span>·</span>
                    <span className="text-red-600 font-medium">
                      {failCount} fail
                    </span>
                  </div>
                )}

              {/* Import Excel */}
              <button
                onClick={() => importRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors border"
                title="Import audit from Excel"
              >
                <Upload className="w-3.5 h-3.5" /> Import
              </button>

              {/* New Audit */}
              <button
                onClick={handleNewTest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0058AB] text-white hover:bg-[#004a91] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New Audit
              </button>

              {/* Save */}
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  dirty
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <Save className="w-3.5 h-3.5" />{" "}
                {dirty ? "Save" : "Saved"}
              </button>

              {/* User / sign out */}
              <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200 ml-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="hidden sm:inline max-w-28 truncate">
                    {authSession.name}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Per-audit tabs (only in audit view) ── */}
      {view === "audit" && activeAudit && (
        <div className="bg-white border-b">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
            <nav className="flex gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-[#0058AB] text-[#0058AB]"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {tab.label}
                    </span>
                  </button>
                );
              })}
              <div className="ml-auto flex items-center">
                <button
                  onClick={() => setView("audits")}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> All
                  Audits
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6">
        {view === "portfolio" && (
          <PortfolioDashboard
            audits={audits}
            onOpenAudit={handleOpenAudit}
          />
        )}

        {view === "audits" && (
          <AuditListView
            audits={audits}
            onOpenAudit={handleOpenAudit}
            onNewAudit={handleNewTest}
            onDelete={handleDeleteAudit}
            onExportAudit={(audit) => exportAuditToExcel(audit)}
            onExportAll={() => exportAllAuditsToExcel(audits)}
            onShare={(audit) => setShareAudit(audit)}
          />
        )}

        {view === "templates" && (
          <EmailTemplates
            templates={templates}
            onChange={handleTemplatesChange}
          />
        )}

        {view === "audit" && activeAudit && (
          <>
            {activeTab === "dashboard" && (
              <Dashboard
                project={activeAudit.project}
                findings={activeAudit.findings}
                pages={activeAudit.pages}
                onScoreChange={(score) =>
                  mutateAudit(activeAudit.id, (a) => ({
                    ...a,
                    project: {
                      ...a.project,
                      overallScore: score,
                    },
                  }))
                }
                onRiskChange={(risk) =>
                  mutateAudit(activeAudit.id, (a) => ({
                    ...a,
                    project: { ...a.project, riskLevel: risk },
                  }))
                }
              />
            )}
            {activeTab === "setup" && (
              <AuditSetup
                project={activeAudit.project}
                pages={activeAudit.pages}
                onProjectChange={(project) =>
                  mutateAudit(activeAudit.id, (a) => ({
                    ...a,
                    project,
                  }))
                }
                onPagesChange={(pages) =>
                  mutateAudit(activeAudit.id, (a) => ({
                    ...a,
                    pages,
                  }))
                }
                onEmailServiceOwner={() =>
                  setEmailComposerAudit(activeAudit)
                }
              />
            )}
            {activeTab === "findings" && (
              <AuditFindings
                findings={activeAudit.findings}
                pages={activeAudit.pages}
                contentTypes={
                  activeAudit.project.contentTypes ?? []
                }
                conformanceTargets={
                  activeAudit.project.conformanceTargets ?? [
                    "wcag22",
                  ]
                }
                onFindingsChange={(findings) =>
                  mutateAudit(activeAudit.id, (a) => ({
                    ...a,
                    findings,
                  }))
                }
              />
            )}
            {activeTab === "report" && (
              <ReportView
                project={activeAudit.project}
                findings={activeAudit.findings}
                pages={activeAudit.pages}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t bg-white py-3 text-center text-xs text-gray-400">
        Accessibility Auditor · WCAG 2.2 Level A & AA ·{" "}
        {new Date().getFullYear()}
      </footer>

      {shareAudit && (
        <ShareModal
          audit={shareAudit}
          onClose={() => setShareAudit(null)}
        />
      )}

      {emailComposerAudit && (
        <EmailComposer
          templates={templates}
          project={emailComposerAudit.project}
          auditorName={authSession?.name ?? ""}
          onClose={() => setEmailComposerAudit(null)}
        />
      )}
    </div>
  );
}