import { useState, useEffect } from 'react';
import { X, Link2, Mail, Copy, Check, Loader2 } from 'lucide-react';
import { AuditRecord } from './types';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SERVER = `https://${projectId}.supabase.co/functions/v1/make-server-1ee6cbef`;

interface Props {
  audit: AuditRecord;
  onClose: () => void;
}

export function ShareModal({ audit, onClose }: Props) {
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function createShare() {
      try {
        const res = await fetch(`${SERVER}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
          body: JSON.stringify({ audit }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Failed to create share link'); return; }

        const base = window.location.href.split('?')[0];
        setShareUrl(`${base}?share=${data.shareId}`);
      } catch (err) {
        setError('Failed to generate share link');
      } finally {
        setLoading(false);
      }
    }
    createShare();
  }, [audit]);

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmailShare() {
    const subject = encodeURIComponent(`Accessibility Audit: ${audit.project.productName || 'Untitled'}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease find the accessibility audit for ${audit.project.productName || 'the product'} at the link below.\n\n${shareUrl}\n\nYou can open the link to view and import the audit into the Accessibility Auditor tool.\n\nRegards`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Share audit</h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-xs">
              {audit.project.productName || 'Untitled Audit'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-4 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating shareable link…
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {shareUrl && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Shareable link</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 min-w-0">
                  <Link2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-600 truncate font-mono">{shareUrl}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-[#0058AB] text-white hover:bg-[#004a91] transition-colors shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Anyone with this link can view and import this audit.
              </p>
            </div>

            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={handleEmailShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-500" />
                Send via email
              </button>
              <p className="text-xs text-gray-400 text-center mt-1.5">
                Opens your email client with the link pre-filled
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
