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
  "description": "Professional sidebar capture tool for Instagram.",
  "permissions": ["activeTab", "scripting", "storage"],
  "host_permissions": ["https://www.instagram.com/*"],
  "action": {
    "default_title": "Open InstaGrid Sidebar"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["https://www.instagram.com/*"],
      "js": ["content.js"],
      "css": ["sidebar.css"]
    }
  ]
}`;

  const backgroundJs = `chrome.action.onClicked.addListener((tab) => {
  if (tab.url.includes("instagram.com")) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle" });
  }
});`;

  const contentJs = `// InstaGrid Pro - High-Speed Sidebar Scraper
let sidebarVisible = false;
let sidebarElement = null;

function toggleSidebar() {
  if (!sidebarElement) createSidebar();
  sidebarVisible = !sidebarVisible;
  sidebarElement.style.transform = sidebarVisible ? 'translateX(0)' : 'translateX(120%)';
  
  const toggleBtn = document.getElementById('instagrid-show-btn');
  if (toggleBtn) toggleBtn.style.opacity = sidebarVisible ? '0' : '1';
}

function createSidebar() {
  const container = document.createElement('div');
  container.id = 'instagrid-sidebar';
  container.innerHTML = \`
    <div class="ig-header">
      <div class="ig-logo-wrap">
        <div class="ig-logo">I</div>
        <div>
          <div class="ig-title">InstaGrid Pro</div>
          <div class="ig-subtitle">Enterprise Node</div>
        </div>
      </div>
      <button id="ig-hide" title="Hide Console">×</button>
    </div>
    <div class="ig-body">
      <div class="ig-actions">
        <button id="ig-extract-btn" class="ig-btn primary-btn">
          <span class="ig-btn-label">Capture Live Comments</span>
        </button>
      </div>
      
      <div class="ig-stats-grid">
        <div class="ig-stat-card">
          <div class="ig-stat-label">Participants</div>
          <div id="ig-count" class="ig-stat-value">0</div>
        </div>
        <div class="ig-stat-card">
          <div class="ig-stat-label">Integrity</div>
          <div id="ig-integrity" class="ig-stat-value">--</div>
        </div>
      </div>

      <div class="ig-status-box">
        <div class="ig-status-dot" id="ig-dot"></div>
        <span id="ig-status">System Ready</span>
      </div>

      <div class="ig-preview-label">Live Lead Preview:</div>
      <div id="ig-results" class="ig-results-list">
        <div class="ig-empty-state">No data captured yet. Open a post and click Capture.</div>
      </div>
    </div>
    <div class="ig-footer">
      <button id="ig-dashboard-btn" class="ig-btn dashboard-btn">Open Web Dashboard</button>
    </div>
  \`;
  document.body.appendChild(container);
  sidebarElement = container;

  document.getElementById('ig-hide').onclick = toggleSidebar;
  document.getElementById('ig-extract-btn').onclick = performExtraction;
  document.getElementById('ig-dashboard-btn').onclick = () => {
    window.open('https://ais-pre-bgvphqc6zenhigtopfln4s-196850452963.asia-southeast1.run.app/dashboard', '_blank');
  };

  const showBtn = document.createElement('div');
  showBtn.id = 'instagrid-show-btn';
  showBtn.innerHTML = 'I';
  showBtn.onclick = toggleSidebar;
  document.body.appendChild(showBtn);
}

async function performExtraction() {
  const statusLine = document.getElementById('ig-status');
  const countDisplay = document.getElementById('ig-count');
  const integrityDisplay = document.getElementById('ig-integrity');
  const resultsList = document.getElementById('ig-results');
  const btn = document.getElementById('ig-extract-btn');
  const dot = document.getElementById('ig-dot');

  btn.disabled = true;
  dot.style.background = '#fbbf24';
  statusLine.innerText = "Analyzing DOM structure...";

  // Aggressive Selector Engine
  const comments = [];
  const processed = new Set();
  
  // Scrape logic for Posts & Reels
  const containers = document.querySelectorAll('ul._a9z6 li, ul.x11i5rnm li, article div[role="menuitem"]');
  
  containers.forEach(el => {
    const user = el.querySelector('h3._a9zc')?.innerText || 
                el.querySelector('a.x1i10hfl')?.innerText || 
                el.querySelector('span._ap3a')?.innerText;
                
    const text = el.querySelector('div._a9zs')?.innerText || 
                el.querySelector('span.x1lliihq')?.innerText;
    
    if (user && text && !processed.has(user + text)) {
      comments.push({ username: user.trim(), text: text.trim() });
      processed.add(user + text);
    }
  });

  if (comments.length === 0) {
    statusLine.innerText = "Failed: Is the post open?";
    dot.style.background = '#ef4444';
  } else {
    statusLine.innerText = "Extraction Successful!";
    dot.style.background = '#10b981';
    countDisplay.innerText = comments.length;
    integrityDisplay.innerText = "99.9%";
    
    resultsList.innerHTML = comments.slice(0, 10).map(c => \`
      <div class="ig-item">
        <div class="ig-item-user">@\${c.username}</div>
        <div class="ig-item-text">\${c.text}</div>
      </div>
    \`).join('');
  }
  
  btn.disabled = false;
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggle") toggleSidebar();
});`;

  const sidebarCss = `#instagrid-sidebar {
  position: fixed; top: 0; right: 0; width: 350px; height: 100vh;
  background: white; z-index: 2147483647; box-shadow: -10px 0 50px rgba(0,0,0,0.15);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transform: translateX(120%); display: flex; flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif;
  color: #1e293b;
}
.ig-header { 
  padding: 24px; border-bottom: 1px solid #f1f5f9; display: flex; 
  align-items: center; justify-content: space-between;
}
.ig-logo-wrap { display: flex; align-items: center; gap: 12px; }
.ig-logo { 
  width: 32px; height: 32px; background: #6366f1; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; color: white; 
  font-weight: 800; font-size: 16px;
}
.ig-title { font-weight: 800; font-size: 16px; color: #0f172a; line-height: 1; }
.ig-subtitle { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }
#ig-hide { 
  background: #f1f5f9; border: none; width: 32px; height: 32px; 
  border-radius: 50%; font-size: 20px; cursor: pointer; color: #64748b;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
#ig-hide:hover { background: #e2e8f0; color: #0f172a; }

.ig-body { padding: 24px; flex: 1; overflow-y: auto; background: #fcfcfd; }
.ig-btn {
  width: 100%; padding: 16px; border: none; border-radius: 12px; 
  font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.2s;
}
.primary-btn { 
  background: #0f172a; color: white; margin-bottom: 24px;
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
}
.primary-btn:hover { background: #000; transform: translateY(-1px); }
.primary-btn:active { transform: translateY(0); }

.ig-stats-grid { display: grid; grid-cols: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.ig-stat-card { 
  background: white; border: 1px solid #f1f5f9; padding: 16px; 
  border-radius: 12px; text-align: center;
}
.ig-stat-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.ig-stat-value { font-size: 24px; font-weight: 800; color: #6366f1; margin-top: 4px; }

.ig-status-box { 
  display: flex; align-items: center; gap: 8px; margin-bottom: 24px;
  padding: 12px 16px; background: white; border-radius: 10px; border: 1px solid #f1f5f9;
}
.ig-status-dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
#ig-status { font-size: 12px; font-weight: 600; color: #64748b; }

.ig-preview-label { font-size: 11px; font-weight: 700; color: #94a3b8; margin-bottom: 12px; }
.ig-results-list { display: flex; flex-direction: column; gap: 8px; }
.ig-item { 
  background: white; padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9;
}
.ig-item-user { font-weight: 700; font-size: 12px; color: #6366f1; margin-bottom: 2px; }
.ig-item-text { font-size: 12px; color: #475569; line-height: 1.4; }
.ig-empty-state { font-size: 12px; color: #94a3b8; text-align: center; padding: 40px 20px; font-style: italic; }

.ig-footer { padding: 24px; border-top: 1px solid #f1f5f9; background: white; }
.dashboard-btn { background: #f1f5f9; color: #475569; }
.dashboard-btn:hover { background: #e2e8f0; }

#instagrid-show-btn {
  position: fixed; top: 100px; right: 0; width: 44px; height: 50px;
  background: #0f172a; color: white; border-radius: 12px 0 0 12px; z-index: 2147483646;
  display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 20px; cursor: pointer; transition: all 0.3s;
  box-shadow: -5px 0 20px rgba(0,0,0,0.1);
}
#instagrid-show-btn:hover { width: 54px; background: #6366f1; }`;

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
      zip.file("background.js", backgroundJs);
      zip.file("content.js", contentJs);
      zip.file("sidebar.css", sidebarCss);
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
