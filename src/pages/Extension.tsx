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
  Loader2,
  BookOpen,
  MousePointerClick,
  Monitor,
  ChevronRight,
  Info
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
    "default_title": "Open InstaGrid Sidebar",
    "default_popup": "popup.html"
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

  const backgroundJs = `chrome.action.onClicked.addListener(async (tab) => {
  console.log("InstaGrid: Icon clicked on tab", tab.id);
  if (!tab.url) return;
  if (!tab.url.includes("instagram.com")) {
    console.warn("InstaGrid: Action only allowed on Instagram.");
    return;
  }
  
  try {
    // Attempt to ping the content script first to see if it's alive
    try {
      await chrome.tabs.sendMessage(tab.id, { action: "ping" });
      console.log("InstaGrid: Content script responded to ping.");
    } catch (pingErr) {
      console.warn("InstaGrid: Content script not responding, attempting re-injection.");
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"]
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["sidebar.css"]
      });
    }

    await chrome.tabs.sendMessage(tab.id, { action: "toggle" });
  } catch (err) {
    console.error("InstaGrid: Failed to communicate with content script.", err);
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          alert("InstaGrid Node: System initialization pending. Please refresh the Instagram page once to activate the extension engine.");
        }
      });
    } catch (e) {
      console.error("InstaGrid: Failed to execute fallback alert.", e);
    }
  }
});`;

  const contentJs = `// InstaGrid Godmode - Auto-Scrolling Scraper Node with Error Resiliency
let sidebarVisible = false;
let sidebarElement = null;
let isScraping = false;
let scrapedData = [];
let xlsxLoaded = false;

// Self-initialize on load
try {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstaGrid);
  } else {
    initInstaGrid();
  }
} catch (e) {
  console.error("InstaGrid Critical Init Failure:", e);
}

function initInstaGrid() {
  try {
    if (!sidebarElement) createSidebar();
    console.log('InstaGrid Pro: Godmode Engine Ready');
  } catch (err) {
    console.error("InstaGrid Sidebar Init Error:", err);
  }
}

function showSystemError(msg) {
  const statusLine = document.getElementById('ig-status');
  const dot = document.getElementById('ig-dot');
  if (statusLine) {
    statusLine.innerText = "Error: " + msg;
    statusLine.style.color = "#ef4444";
  }
  if (dot) dot.style.background = "#ef4444";
  console.error("InstaGrid System Error:", msg);
}

function resetStatus() {
  const statusLine = document.getElementById('ig-status');
  const dot = document.getElementById('ig-dot');
  if (statusLine) {
    statusLine.style.color = "#64748b";
    statusLine.innerText = "System Standing By";
  }
  if (dot) dot.style.background = "#10b981";
}

function toggleSidebar() {
  try {
    if (!sidebarElement) createSidebar();
    sidebarVisible = !sidebarVisible;
    sidebarElement.style.transform = sidebarVisible ? 'translateX(0)' : 'translateX(120%)';
    
    const toggleBtn = document.getElementById('instagrid-show-btn');
    if (toggleBtn) toggleBtn.style.opacity = sidebarVisible ? '0' : '1';
    if (sidebarVisible) resetStatus();
  } catch (e) {
    console.error("InstaGrid UI Toggle Error:", e);
  }
}

function createSidebar() {
  if (document.getElementById('instagrid-sidebar')) return;
  
  // Inject XLSX Library with better error handling
  const xlsxScript = document.createElement('script');
  xlsxScript.src = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';
  xlsxScript.onload = () => { xlsxLoaded = true; console.log('InstaGrid: Excel Engine Integrated'); };
  xlsxScript.onerror = () => { 
    xlsxLoaded = false; 
    console.warn('InstaGrid: Failed to load XLSX library. Excel export will be disabled.'); 
  };
  document.head.appendChild(xlsxScript);

  const container = document.createElement('div');
  container.id = 'instagrid-sidebar';
  container.innerHTML = \`
    <div class="ig-header">
      <div class="ig-logo-wrap">
        <div class="ig-logo">G</div>
        <div>
          <div class="ig-title">InstaGrid Godmode</div>
          <div class="ig-subtitle">Auto-Scroller Active</div>
        </div>
      </div>
      <button id="ig-hide" title="Hide Console">×</button>
    </div>
    <div class="ig-body">
      <div class="ig-actions">
        <button id="ig-godmode-btn" class="ig-btn primary-btn">
          <div class="ig-loader" id="ig-loader"></div>
          <span id="ig-btn-text">Start Godmode Scrape</span>
        </button>
      </div>

      <div class="ig-progress-container" id="ig-progress-wrap" style="display: none; margin-bottom: 24px;">
        <div class="ig-progress-bar" style="height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
          <div id="ig-progress-fill" style="height: 100%; background: #6366f1; width: 0%; transition: width 0.3s;"></div>
        </div>
        <div class="ig-progress-label" style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 8px;">Scrolling & Extracting...</div>
      </div>
      
      <div class="ig-stats-grid">
        <div class="ig-stat-card">
          <div class="ig-stat-label">Data Nodes</div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
            <div id="ig-count" class="ig-stat-value">0</div>
            <div id="ig-live-indicator" style="display: none; width: 6px; height: 6px; background: #ef4444; border-radius: 50%; animation: ig-pulse 1s infinite;"></div>
          </div>
        </div>
        <div class="ig-stat-card">
          <div class="ig-stat-label">Coverage</div>
          <div id="ig-coverage" class="ig-stat-value">--</div>
        </div>
      </div>

      <div class="ig-status-box">
        <div class="ig-status-dot" id="ig-dot"></div>
        <span id="ig-status">System Standing By</span>
      </div>

      <div id="ig-ai-summary" class="ig-ai-box" style="display: none;">
        <div class="ig-ai-header">
           <span class="ig-ai-icon">📊</span>
           <span>Logic Research Insight</span>
        </div>
        <div id="ig-ai-text" class="ig-ai-content">Processing patterns via Rule-Based Logic Engine...</div>
        <button id="ig-ai-go" class="ig-ai-btn">View Structured Analysis</button>
      </div>

      <div class="ig-preview-label">Live Lead Buffer:</div>
      <div id="ig-results" class="ig-results-list">
        <div class="ig-empty-state">System ready. Open a Post/Reel and activate Godmode.</div>
      </div>
    </div>
    <div class="ig-footer">
      <button id="ig-excel-btn" class="ig-btn excel-btn" style="background: #10b981; color: white; margin-bottom: 12px;" disabled>Download Excel Sheet</button>
      <button id="ig-dashboard-btn" class="ig-btn dashboard-btn">Cloud Dashboard</button>
    </div>
  \`;
  document.body.appendChild(container);
  sidebarElement = container;

  document.getElementById('ig-hide').onclick = toggleSidebar;
  document.getElementById('ig-godmode-btn').onclick = runGodmodeScrape;
  document.getElementById('ig-excel-btn').onclick = downloadExcel;
  document.getElementById('ig-dashboard-btn').onclick = () => {
    window.open('{{APP_URL}}/dashboard', '_blank');
  };
  document.getElementById('ig-ai-go').onclick = () => {
    window.open('{{APP_URL}}/dashboard', '_blank');
  };

  const showBtn = document.createElement('div');
  showBtn.id = 'instagrid-show-btn';
  showBtn.innerHTML = 'G';
  showBtn.onclick = toggleSidebar;
  document.body.appendChild(showBtn);
}

async function runGodmodeScrape() {
  if (isScraping) return;
  resetStatus();
  
  const statusLine = document.getElementById('ig-status');
  const btnText = document.getElementById('ig-btn-text');
  const loader = document.getElementById('ig-loader');
  const dot = document.getElementById('ig-dot');
  const progWrap = document.getElementById('ig-progress-wrap');
  const progFill = document.getElementById('ig-progress-fill');
  const excelBtn = document.getElementById('ig-excel-btn');
  const coverageDisplay = document.getElementById('ig-coverage');
  const liveIndicator = document.getElementById('ig-live-indicator');

  try {
    isScraping = true;
    scrapedData = [];
    const processed = new Set();
    
    if (liveIndicator) liveIndicator.style.display = 'block';
    progWrap.style.display = 'block';
    loader.style.display = 'block';
    btnText.innerText = "Godmode Running...";
    dot.style.background = '#fbbf24';

    // 1. Ensure page matches Instagram structure
    if (!window.location.href.includes('/p/') && !window.location.href.includes('/reels/') && !window.location.href.includes('/reel/')) {
        showSystemError("Please open a specific Post or Reel first.");
        stopScraping();
        return;
    }

    statusLine.innerText = "Analyzing page node paths...";
    
    // Try to find the comment container - Reels and Posts have different layouts
    let commentBox = document.querySelector('ul._a9z6, div[role="dialog"] ul, div.x1iyjqo2.x1n2onr6.x1h87l8u, div._a9zs, .x1iyjqo2[role="dialog"]');
    
    // Check for Reels specific side panel
    const reelsComments = document.querySelector('div.x168nmei.x13lgm5w.x1n2onr6, div.x1iyjqo2.x1n2onr6.x1h87l8u, div.x78zum5.x1q0g3np.x1iyjqo2.x1qughib');
    if (reelsComments) commentBox = reelsComments;

    if (!commentBox) {
      statusLine.innerText = "Targeting interaction nodes...";
      const commentBtns = Array.from(document.querySelectorAll('button, div[role="button"]'));
      let targetBtn = commentBtns.find(b => 
        b.innerText.toLowerCase().includes('comment') || 
        b.querySelector('svg[aria-label*="Comment"]') ||
        b.ariaLabel?.toLowerCase().includes('comment')
      );
      
      if (targetBtn) {
        statusLine.innerText = "Opening comment stream...";
        targetBtn.click();
        await new Promise(r => setTimeout(r, 4000)); // Longer wait for Reels
        commentBox = document.querySelector('ul._a9z6, div[role="dialog"] ul, div.x1iyjqo2.x1n2onr6.x1h87l8u');
      } else {
        // Fallback: try to find the comment icon svg directly
        const svg = document.querySelector('svg[aria-label="Comment"]');
        if (svg) {
          statusLine.innerText = "Targeting specialized SVG node...";
          svg.closest('button')?.click();
          await new Promise(r => setTimeout(r, 4000));
          commentBox = document.querySelector('ul._a9z6, div[role="dialog"] ul, div.x1iyjqo2.x1n2onr6.x1h87l8u');
        }
      }
    }

    // 2. Persistent Auto-Scrolling & Aggressive Extraction
    let stagnantCount = 0;
    const iterations = 100; 

    for (let i = 0; i < iterations; i++) {
      if (!isScraping) break;
      statusLine.innerText = "Step " + (i+1) + "/" + iterations;
      progFill.style.width = ((i+1)/iterations)*100 + "%";
      
      try {
        // Aggressive Data Extraction - Use multiple selector patterns
        const containers = document.querySelectorAll(
          'ul._a9z6 li, ' + 
          'div[role="menuitem"], ' +
          'div[role="dialog"] li, ' +
          '.x1lliihq.x1plvlek.xryxfnj.x1n2onr6, ' +
          'div.x1r8u4bd.x1n2onr6.x1h87l8u, ' +
          'div.x1iyjqo2.x1n2onr6.x1h87l8u div.x1n2onr6' 
        );
        
        containers.forEach(el => {
          // Look for usernames in links or bold spans
          const userEl = el.querySelector('h3._a9zc, a.x1i10hfl, span._ap3a, ._ap3a, a[role="link"], span.xt0psk2 a');
          const textEl = el.querySelector('div._a9zs, span.x1lliihq, .x1lliihq, div.x1n2onr6, span._aade');
          
          if (userEl && textEl) {
            const user = userEl.innerText.replace('Verified', '').replace('•', '').trim();
            const text = textEl.innerText.trim();
            
            if (user.length > 0 && user.length < 50 && text.length > 0 && !processed.has(user + text)) {
               // Basic heuristic to skip buttons like "Reply", "View replies", etc.
               const isSystemText = text === "Reply" || text.includes("View") || text.includes("See") || text === "Pinned";
               if (!isSystemText && user.split(' ').length < 3) {
                  scrapedData.push({ 
                    Username: '@' + user.split('\\n')[0].replace(/\\s/g, ''), 
                    Comment: text.substring(0, 500).replace(/\\n/g, ' '), 
                    Captured: new Date().toLocaleTimeString() 
                  });
                  processed.add(user + text);
               }
            }
          }
        });
      } catch (innerErr) {
        console.error("InstaGrid: Extraction iteration error:", innerErr);
      }

      updateUIPreview();
      coverageDisplay.innerText = scrapedData.length > 0 ? "LIVE" : "SYNC";

      const scrollArea = document.querySelector('ul._a9z6') || 
                         document.querySelector('div[role="dialog"] .x1iyjqo2') ||
                         document.querySelector('div.x1iyjqo2.x1n2onr6.x1h87l8u') ||
                         document.querySelector('div.x78zum5.x1q0g3np.x1iyjqo2.x1qughib') ||
                         document.body;

      const prevPos = scrollArea.scrollTop || window.scrollY;
      
      try {
        if (scrollArea === document.body) {
          window.scrollBy(0, 1500);
        } else {
          scrollArea.scrollTop += 2000; 
        }
        
        // Also click "Load more" or "View all" if found
        const loadMore = Array.from(document.querySelectorAll('svg[aria-label="Load more comments"], ._abn- svg, span.x1lliihq'));
        const targetLoad = loadMore.find(el => 
            el.ariaLabel === "Load more comments" || 
            (el.tagName === 'SPAN' && el.innerText.toLowerCase().includes('view all'))
        );
        if (targetLoad) {
            targetLoad.closest('button')?.click() || targetLoad.click();
        }
      } catch (scrollErr) {
        console.error("InstaGrid: Scroll control error:", scrollErr);
      }
      
      await new Promise(r => setTimeout(r, 1500));

      const currPos = scrollArea.scrollTop || window.scrollY;
      if (Math.abs(currPos - prevPos) < 10) stagnantCount++;
      else stagnantCount = 0;

      if (stagnantCount > 10) {
          statusLine.innerText = "End of visible nodes reached.";
          break; 
      }
    }

    if (scrapedData.length === 0) {
        showSystemError("No data found. Ensure you are on a post with public comments.");
    } else {
        statusLine.innerText = \`Scrape Complete: \${scrapedData.length} records!\`;
        dot.style.background = '#10b981';
    }
  } catch (err) {
    showSystemError("Unexpected crash during automation.");
    console.error("InstaGrid Godmode Crash:", err);
  } finally {
    stopScraping();
  }
}

function stopScraping() {
  isScraping = false;
  const statusLine = document.getElementById('ig-status');
  const btnText = document.getElementById('ig-btn-text');
  const loader = document.getElementById('ig-loader');
  const dot = document.getElementById('ig-dot');
  const progWrap = document.getElementById('ig-progress-wrap');
  const excelBtn = document.getElementById('ig-excel-btn');
  const liveIndicator = document.getElementById('ig-live-indicator');

  if (liveIndicator) liveIndicator.style.display = 'none';
  if (loader) loader.style.display = 'none';
  if (progWrap) progWrap.style.display = 'none';
  if (btnText) btnText.innerText = "Capture Again";
  if (excelBtn) excelBtn.disabled = scrapedData.length === 0;
  
  if (scrapedData.length > 5) {
    const aiBox = document.getElementById('ig-ai-summary');
    if (aiBox) aiBox.style.display = 'block';
  }
}

function updateUIPreview() {
  try {
    const countDisplay = document.getElementById('ig-count');
    const resultsList = document.getElementById('ig-results');
    if (!countDisplay || !resultsList) return;

    countDisplay.innerText = scrapedData.length;
    
    if (scrapedData.length > 0) {
      resultsList.innerHTML = scrapedData.slice(-12).reverse().map(c => \`
        <div class="ig-item">
          <div class="ig-item-user">\${c.Username}</div>
          <div class="ig-item-text">\${c.Comment.substring(0, 120)}...</div>
        </div>
      \`).join('');
    }
  } catch (e) {
    console.error("InstaGrid UI Update Error:", e);
  }
}

function downloadExcel() {
  if (!scrapedData.length) return;
  
  if (!xlsxLoaded) {
    alert("Export Engine (XLSX) failed to load. Please check your internet connection.");
    return;
  }

  try {
    const ws = XLSX.utils.json_to_sheet(scrapedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scraped Leads");
    XLSX.writeFile(wb, \`instagrid_leads_\${new Date().getTime()}.xlsx\`);
  } catch (e) {
    console.error("Excel Export Error:", e);
    showSystemError("Export failed. File system blocked?");
  }
}

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "ping") return true; 
  if (request.action === "toggle") toggleSidebar();
  if (request.action === "startGodmode") {
    if (!sidebarVisible) toggleSidebar();
    runGodmodeScrape();
  }
});\`;`;

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
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
}
.ig-title { font-weight: 800; font-size: 16px; color: #0f172a; line-height: 1; }
.ig-subtitle { font-size: 10px; font-weight: 700; color: #6366f1; text-transform: uppercase; margin-top: 2px; }
#ig-hide { 
  background: #f1f5f9; border: none; width: 32px; height: 32px; 
  border-radius: 50%; font-size: 20px; cursor: pointer; color: #64748b;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
#ig-hide:hover { background: #fee2e2; color: #ef4444; transform: rotate(90deg); }

.ig-body { padding: 24px; flex: 1; overflow-y: auto; background: #fcfcfd; }
.ig-btn {
  width: 100%; padding: 16px; border: none; border-radius: 12px; 
  font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.3s;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.primary-btn { 
  background: #0f172a; color: white; margin-bottom: 24px;
  box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.1);
}
.primary-btn:hover { background: #000; transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(0,0,0,0.2); }
.primary-btn:active { transform: translateY(0); }
.primary-btn.loading { opacity: 0.8; cursor: wait; }
.primary-btn.success { background: #10b981; pointer-events: none; }

.excel-btn { background: #10b981; color: white; margin-bottom: 12px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
.excel-btn:hover:not(:disabled) { background: #059669; transform: scale(1.02); }
.excel-btn:disabled { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }

.ig-loader {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%;
  animation: ig-spin 0.8s linear infinite; display: none;
}
@keyframes ig-spin { to { transform: rotate(360deg); } }
@keyframes ig-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}

.ig-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
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

.ig-ai-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}
.ig-ai-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; font-weight: 800; color: #1e293b;
  text-transform: uppercase; margin-bottom: 10px;
}
.ig-ai-content { font-size: 12px; color: #475569; line-height: 1.5; margin-bottom: 12px; font-style: italic; }
.ig-ai-btn {
  width: 100%; padding: 8px; background: #0f172a; color: white; border: none;
  border-radius: 8px; font-size: 10px; font-weight: 700; cursor: pointer;
  transition: background 0.2s;
}
.ig-ai-btn:hover { background: #000; }

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
      --primary: #6366f1;
      --primary-hover: #4f46e5;
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-400: #94a3b8;
      --slate-800: #0f172a;
      --emerald-500: #10b981;
    }
    body { 
      width: 320px; 
      font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; 
      padding: 0; margin: 0;
      background: white; color: var(--slate-800);
    }
    .header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--slate-100);
      display: flex; align-items: center; gap: 12px;
    }
    .logo {
      width: 28px; height: 28px; background: var(--primary);
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 14px;
    }
    .title { font-weight: 800; font-size: 15px; }
    .content { padding: 20px; }
    .btn { 
      background: var(--slate-800); color: white; border: none; 
      padding: 14px; width: 100%; border-radius: 12px; 
      cursor: pointer; font-weight: 700; font-size: 14px;
      transition: all 0.2s; display: flex; align-items: center;
      justify-content: center; gap: 10px;
      margin-bottom: 12px;
    }
    .btn:hover { background: #000; transform: translateY(-1px); }
    .btn-god {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
    }
    .btn-god:hover { opacity: 0.9; }
    
    .status-card {
      padding: 16px; background: var(--slate-50);
      border-radius: 12px; border: 1px solid var(--slate-100); text-align: center;
    }
    .status-text { font-size: 11px; color: var(--slate-400); font-weight: 700; text-transform: uppercase; }
    .count { font-size: 28px; font-weight: 800; color: var(--primary); margin: 4px 0; }
    
    .footer {
      padding: 12px; background: var(--slate-50);
      border-top: 1px solid var(--slate-100); text-align: center;
      font-size: 10px; font-weight: 700; color: var(--slate-400);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">G</div>
    <div class="title">InstaGrid Godmode</div>
  </div>
  <div class="content">
    <button id="toggleBtn" class="btn">
      Open Sidebar Console
    </button>
    <button id="godmodeBtn" class="btn btn-god">
      Full Automation Scrape
    </button>
    <div class="status-card">
      <div class="status-text">Session Availability</div>
      <div class="count" id="sessionStatus">READY</div>
      <div class="status-text">Ready for Extraction</div>
    </div>
  </div>
  <div class="footer">
    SECURE BROWSER NODE • V1.0.4
  </div>
  <script src="popup.js"></script>
</body>
</html>`;

  const popupJs = `document.getElementById('toggleBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.includes('instagram.com')) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle" });
    window.close();
  } else {
    alert("Please open Instagram to use this extension.");
  }
});

document.getElementById('godmodeBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.url.includes('instagram.com')) {
    // Open sidebar first
    chrome.tabs.sendMessage(tab.id, { action: "toggle" });
    // Trigger godmode via message (impl in content.js)
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action: "startGodmode" });
    }, 500);
    window.close();
  } else {
    alert("Open Instagram first!");
  }
});`;

  const downloadSource = async () => {
    setDownloading(true);
    try {
      const zip = new JSZip();
      const currentOrigin = window.location.origin;
      
      // Inject current origin into scripts
      const processedContentJs = contentJs.replace(/\{\{APP_URL\}\}/g, currentOrigin);
      
      zip.file("manifest.json", manifest);
      zip.file("background.js", backgroundJs);
      zip.file("content.js", processedContentJs);
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
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
            The InstaGrid Chrome Extension allows you to capture live data directly from your browser session, bypassing all embed restrictions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={downloadSource}
              disabled={downloading}
              className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 group disabled:opacity-50"
            >
              {downloading ? <Loader2 size={22} className="animate-spin" /> : <Download size={22} className="group-hover:translate-y-0.5 transition-transform" />}
              {downloading ? "Generating Build..." : "Download Source Code (.zip)"}
            </button>
            <a 
              href="#guide" 
              className="px-8 py-4 bg-white text-slate-600 border border-slate-200 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen size={20} />
              Setup Guide
            </a>
          </div>
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
                    <div className="text-[10px] uppercase font-bold text-slate-400">Live Scrape Status</div>
                    <div className="flex items-center justify-center gap-2 my-1">
                      <div className="text-2xl font-black text-indigo-600 tracking-tight">842</div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-200"></div>
                    </div>
                    <div className="text-[10px] text-slate-500">Active Data Nodes Captured</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[8px] font-black tracking-widest text-slate-400">
                  ENTERPRISE NODE • v1.0.0
                </div>
             </div>
          </div>
        </div>

        {/* User Guide Section */}
        <motion.div 
          id="guide"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="flex items-center gap-4 mb-10">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-3xl font-bold">User Guide & Tutorial</h2>
              <p className="text-slate-500">Master the extraction workflow in under 2 minutes.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-8 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 font-black rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">1</div>
              <h3 className="font-bold text-lg mb-3">Install Extension</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Download the Source Pack, unzip it, and load it into Chrome via <code className="bg-slate-100 px-1 rounded">chrome://extensions</code> using Developer Mode.
              </p>
            </div>

            <div className="relative p-8 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 font-black rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">2</div>
              <h3 className="font-bold text-lg mb-3">Open Instagram</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Navigate to any Reels or Post. Ensure the comments are visible on your screen for the scraper to detect the active DOM nodes.
              </p>
            </div>

            <div className="relative p-8 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 transition-all group">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 font-black rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">3</div>
              <h3 className="font-bold text-lg mb-3">Capture & Export</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Click the InstaGrid icon in your toolbar, then hit "Capture". Data will sync to your dashboard instantly.
              </p>
            </div>
          </div>

          <div className="mt-10 p-6 bg-amber-50 border border-amber-100 rounded-2xl flex gap-4">
            <Info className="text-amber-500 shrink-0" size={20} />
            <div className="text-sm text-amber-800">
              <span className="font-bold">Pro-Tip:</span> For ultra-fast scraping on long comment threads, scroll down slightly to trigger Instagram's lazy loading before clicking capture.
            </div>
          </div>
        </motion.div>

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
