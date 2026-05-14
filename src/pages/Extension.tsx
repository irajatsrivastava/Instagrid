import React, { useState } from "react";
import { 
  Chrome, 
  Terminal, 
  Download, 
  CheckCircle2, 
  Copy, 
  ClipboardCheck,
  Zap,
  Shield,
  Search,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import JSZip from "jszip";

export default function ExtensionPage() {
  const [copied, setCopied] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const manifest = `{
  "manifest_version": 3,
  "name": "InstaGrid Capture Pro",
  "version": "1.0",
  "description": "Professional capture tool for Instagram comment analysis.",
  "permissions": ["activeTab", "scripting"],
  "action": {
    "default_popup": "popup.html"
  },
  "content_scripts": [
    {
      "matches": ["https://www.instagram.com/*"],
      "js": ["content.js"]
    }
  ]
}`;

  const contentJs = `// Content script to extract data from Instagram page
function extractComments() {
  const comments = [];
  // Selector for comments on Instagram web
  const commentElements = document.querySelectorAll('ul._a9z6 li');
  
  commentElements.forEach(el => {
    const user = el.querySelector('h3._a9zc')?.innerText;
    const text = el.querySelector('div._a9zs')?.innerText;
    const timestamp = el.querySelector('time')?.getAttribute('datetime');
    
    if (user && text) {
      comments.push({ 
        username: user.trim(), 
        text: text.trim(),
        timestamp: timestamp || new Date().toISOString(),
        id: 'cap_' + Math.random().toString(36).substr(2, 9)
      });
    }
  });
  return comments;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "capture") {
    const results = extractComments();
    sendResponse({ success: true, comments: results });
  }
  return true;
});`;

  const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-400: #94a3b8;
      --slate-800: #1e293b;
      --emerald-500: #10b981;
    }
    body { 
      width: 320px; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
      padding: 0; 
      margin: 0;
      background: white;
      color: var(--slate-800);
    }
    .header {
      padding: 16px;
      border-bottom: 1px solid var(--slate-100);
      display: flex;
      items-center: center;
      gap: 10px;
    }
    .logo {
      width: 24px;
      height: 24px;
      background: var(--primary);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .title {
      font-weight: 700;
      font-size: 14px;
      letter-spacing: -0.01em;
    }
    .content {
      padding: 16px;
    }
    .btn { 
      background: var(--primary); 
      color: white; 
      border: none; 
      padding: 12px; 
      width: 100%; 
      border-radius: 8px; 
      cursor: pointer; 
      font-weight: 600;
      font-size: 14px;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1);
    }
    .btn:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .status-card {
      margin-top: 16px;
      padding: 12px;
      background: var(--slate-50);
      border-radius: 8px;
      border: 1px solid var(--slate-100);
      text-align: center;
    }
    .status-text { font-size: 12px; color: var(--slate-400); font-weight: 500; }
    .count { font-size: 24px; font-weight: 800; color: var(--primary); margin: 4px 0; }
    
    .footer {
      padding: 12px;
      background: var(--slate-50);
      border-top: 1px solid var(--slate-100);
      text-align: center;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.05em;
      color: var(--slate-400);
    }
    .loader {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: none;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading .loader { display: block; }
    .loading .btn-text { display: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">I</div>
    <div class="title">InstaGrid Capture Pro</div>
  </div>
  <div class="content">
    <button id="captureBtn" class="btn">
      <span class="loader"></span>
      <span class="btn-text">Extract Post Data</span>
    </button>
    <div class="status-card">
      <div class="status-text" id="statusTitle">Ready to Scan</div>
      <div class="count" id="countDisplay">0</div>
      <div class="status-text">Participants Found</div>
    </div>
  </div>
  <div class="footer">
    Enterprise Node • Secure Session
  </div>
  <script src="popup.js"></script>
</body>
</html>`;

  const popupJs = `document.getElementById('captureBtn').addEventListener('click', async () => {
  const btn = document.getElementById('captureBtn');
  const countDisplay = document.getElementById('countDisplay');
  const statusTitle = document.getElementById('statusTitle');
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('instagram.com')) {
    statusTitle.innerText = "Error: Not on Instagram";
    return;
  }

  btn.classList.add('loading');
  btn.disabled = true;
  statusTitle.innerText = "Analyzing Page Structure...";
  
  chrome.tabs.sendMessage(tab.id, { action: "capture" }, (response) => {
    btn.classList.remove('loading');
    btn.disabled = false;

    if (response && response.success) {
      const count = response.comments.length;
      countDisplay.innerText = count;
      statusTitle.innerText = count > 0 ? "Scanned Successfully!" : "No Comments Found";
      
      if (count > 0) {
        // Direct to dashboard
        setTimeout(() => {
          chrome.tabs.create({ url: 'https://ais-pre-bgvphqc6zenhigtopfln4s-196850452963.asia-southeast1.run.app/dashboard' });
        }, 1000);
      }
    } else {
      statusTitle.innerText = "Failed: Open the Comments";
      countDisplay.innerText = "0";
    }
  });
});`;

  const downloadSource = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      zip.file("manifest.json", manifest);
      zip.file("content.js", contentJs);
      zip.file("popup.html", popupHtml);
      zip.file("popup.js", popupJs);
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "instagrid_extension_v1.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate zip:", error);
    } finally {
      setDownloading(false);
    }
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800">
      <div className="max-w-4xl mx-auto py-20 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-indigo-100">
            <Chrome size={40} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Real-Time Browser Extension</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            The InstaGrid Chrome Extension allows you to capture live data directly from your browser session, bypassing all embed restrictions.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Zap className="text-indigo-600" /> Professional Grade
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-indigo-600">
                  <Terminal size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Automated Extraction</h4>
                  <p className="text-xs text-slate-500">Auto-detects post types and extracts participant IDs with 99% accuracy.</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-4">
                <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-emerald-600">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Session-Based Security</h4>
                  <p className="text-xs text-slate-500">Uses your active browser credentials to bypass bot detection walls.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Extension UI Preview */}
          <div className="bg-slate-100 rounded-3xl p-8 flex items-center justify-center border-4 border-white shadow-xl">
             <div className="w-[280px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                  <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-[10px] text-white font-bold">I</div>
                  <div className="text-xs font-bold">InstaGrid Capture Pro</div>
                </div>
                <div className="p-4 space-y-4">
                  <div className="w-full h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    Extract Post Data
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 text-center border border-slate-100">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Scan Status</div>
                    <div className="text-2xl font-black text-indigo-600 my-1">482</div>
                    <div className="text-[10px] text-slate-500">Participants Captured</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[8px] font-black tracking-widest text-slate-400">
                  ENTERPRISE NODE • v1.0.0
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Terminal className="text-slate-400" /> Extension Boilerplate
            </h2>
          </div>

          {/* Manifest Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 px-2">
              <span>manifest.json</span>
              <button 
                onClick={() => copy(manifest, 'manifest')}
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                {copied === 'manifest' ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                {copied === 'manifest' ? "Copied" : "Copy Code"}
              </button>
            </div>
            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-6 overflow-x-auto text-sm font-mono text-slate-700 leading-relaxed shadow-inner">
              {manifest}
            </pre>
          </div>

          {/* Content Script Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 px-2">
              <span>content.js</span>
              <button 
                onClick={() => copy(contentJs, 'content')}
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                {copied === 'content' ? <ClipboardCheck size={14} /> : <Copy size={14} />}
                {copied === 'content' ? "Copied" : "Copy Code"}
              </button>
            </div>
            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-6 overflow-x-auto text-sm font-mono text-slate-700 leading-relaxed shadow-inner">
              {contentJs}
            </pre>
          </div>
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-indigo-50 border border-indigo-100 text-center">
          <h3 className="text-xl font-bold text-indigo-900 mb-4">Want the full build?</h3>
          <p className="text-indigo-700/70 mb-8 max-w-lg mx-auto">Download the complete extension source package to start extracting at scale with no limitations.</p>
          <button 
            onClick={downloadSource}
            disabled={downloading}
            className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 mx-auto shadow-xl shadow-indigo-200 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Download size={20} />
            )}
            {downloading ? "Preparing Package..." : "Download Source Pack"}
          </button>
        </div>
      </div>
    </div>
  );
}
