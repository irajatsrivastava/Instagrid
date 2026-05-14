import React, { useState, useEffect } from "react";
import { 
  Instagram, 
  Download, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileSpreadsheet,
  FileJson,
  TableProperties,
  Copy,
  ClipboardCheck,
  History,
  Trash2
} from "lucide-react";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../components/FirebaseProvider";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { extractCommentsFromHtml } from "../services/geminiService";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error(`Firestore Error during ${operationType} on ${path}:`, error);
}

interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

interface ExportHistory {
  id: string;
  url: string;
  shortcode: string;
  commentCount: number;
  createdAt: any;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const filteredComments = comments.filter(c => 
    c.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "exports"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ExportHistory));
      setHistory(docs);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, "exports");
    }
  };

  const saveToHistory = async (shortcode: string, count: number) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "exports"), {
        userId: user.uid,
        url,
        shortcode,
        commentCount: count,
        createdAt: serverTimestamp(),
      });
      fetchHistory();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "exports");
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "exports", id));
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `exports/${id}`);
    }
  };

  const fetchComments = async () => {
    if (!url) return;
    if (!user) {
      setError("Please sign in to extract data.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setComments([]);

    try {
      const response = await fetch("/api/fetch-insta-html", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        const extracted = await extractCommentsFromHtml(data.html, data.shortcode);
        setComments(extracted);
        setSuccessMsg(data.html ? "Extracted live participants from public view!" : "Advanced extraction complete. Recovered contextual lead list.");
        saveToHistory(data.shortcode || 'unknown', extracted.length);
      } else {
        setError(data.error || "Failed to fetch post data");
      }
    } catch (err) {
      setError("An unexpected error occurred or Instagram restricted access. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (filteredComments.length === 0) return;

    const dataToExport = filteredComments.map((c, i) => ({
      "Index": (i + 1).toString().padStart(3, '0'),
      "Instagram ID": `@${c.username}`,
      "Comment": c.text,
      "Timestamp": new Date(c.timestamp).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Comments");
    
    const fileName = `instagrid_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToCSV = () => {
    if (filteredComments.length === 0) return;

    const dataToExport = filteredComments.map((c, i) => ({
      "Index": (i + 1).toString().padStart(3, '0'),
      "Instagram ID": `@${c.username}`,
      "Comment": c.text,
      "Timestamp": new Date(c.timestamp).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `instagrid_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = () => {
    if (filteredComments.length === 0) return;

    const dataToExport = filteredComments.map((c, i) => ({
      "index": i + 1,
      "username": c.username,
      "comment": c.text,
      "timestamp": c.timestamp,
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `instagrid_export_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = () => {
    if (filteredComments.length === 0) return;

    const header = "Index\tInstagram ID\tComment\tTimestamp\n";
    const body = filteredComments
      .map((c, i) => `${(i + 1).toString().padStart(3, '0')}\t@${c.username}\t${c.text.replace(/\t/g, ' ')}\t${new Date(c.timestamp).toLocaleString()}`)
      .join("\n");

    navigator.clipboard.writeText(header + body).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Scan History
                </h2>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600">×</button>
              </div>
              {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((item) => (
                    <div key={item.id} className="p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-between group">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-indigo-600 truncate">{item.shortcode}</p>
                        <p className="text-[10px] text-slate-400">{new Date(item.createdAt?.toDate?.() || Date.now()).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">{item.commentCount} comments</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setUrl(item.url)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600"
                          title="Reload URL"
                        >
                          <Search size={14} />
                        </button>
                        <button 
                          onClick={() => deleteHistoryItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No previous scans found.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h1 className="text-lg font-bold text-slate-800">Extraction Console</h1>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-50"
        >
          <History size={18} />
          <span>{showHistory ? "Hide History" : "View History"}</span>
        </button>
      </div>

      {/* Step 1: Source Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">1. Source Selection</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <input 
              type="text" 
              placeholder="Paste Instagram Reel or Post link here (e.g., instagram.com/p/...)" 
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-400 transition-all"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <div className="absolute right-3 top-3.5">
              <Search size={22} className="text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
            </div>
          </div>
          <div className="flex gap-2">
              <button 
                onClick={() => fetchComments()}
                disabled={loading || !url}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-black transition-colors whitespace-nowrap disabled:opacity-50 flex items-center justify-center gap-2 min-w-[200px]"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : "Analyze & Extract"}
              </button>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 font-medium border border-red-100"
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </motion.div>
          )}
          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-sm text-green-700 font-medium border border-green-100"
            >
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step 2: Data Preview */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm min-h-[400px]">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">2. Data Preview</h2>
              {comments.length > 0 && (
                <div className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Scanning Complete</div>
              )}
            </div>
            {comments.length > 0 && (
              <div className="relative mt-2">
                <input
                  type="text"
                  placeholder="Search keywords or users..."
                  className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 w-full md:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>
            )}
          </div>
          {comments.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 mr-2">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500" />
                <span className="text-xs text-slate-600">Filter Duplicates</span>
              </div>
              <button 
                onClick={copyToClipboard}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-bold flex items-center gap-2 transition-all border border-slate-200"
              >
                {copied ? <ClipboardCheck size={16} className="text-green-600" /> : <Copy size={16} />}
                {copied ? "Copied!" : "Copy All"}
              </button>
              <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block"></div>
              <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button 
                  onClick={exportToExcel}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  title="Export to Excel (.xlsx)"
                >
                  <FileSpreadsheet size={14} />
                  .XLSX
                </button>
                <button 
                  onClick={exportToCSV}
                  className="px-3 py-1.5 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all"
                  title="Export to CSV (.csv)"
                >
                  <TableProperties size={14} />
                  .CSV
                </button>
                <button 
                  onClick={exportToJSON}
                  className="px-3 py-1.5 hover:bg-slate-200 text-slate-600 rounded-md text-[10px] font-bold flex items-center gap-1.5 transition-all"
                  title="Export to JSON (.json)"
                >
                  <FileJson size={14} />
                  .JSON
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto max-h-[500px]">
          {filteredComments.length > 0 ? (
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-6 border-b border-slate-100">Index</th>
                  <th className="py-3 px-6 border-b border-slate-100">Instagram ID</th>
                  <th className="py-3 px-6 border-b border-slate-100">Comment Preview</th>
                  <th className="py-3 px-6 border-b border-slate-100 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700">
                {filteredComments.map((comment, idx) => (
                  <motion.tr 
                    key={comment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-3 px-6 font-mono text-slate-400">{(idx + 1).toString().padStart(3, '0')}</td>
                    <td className="py-3 px-6 font-bold text-indigo-600">@{comment.username}</td>
                    <td className="py-3 px-6 text-slate-500 italic truncate max-w-xs">{comment.text}</td>
                    <td className="py-3 px-6 text-right text-slate-400 font-mono text-xs">
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-slate-300">
              <Download size={48} className="mb-4 opacity-50" />
              <p className="text-sm font-medium">Capture a link above to see results</p>
            </div>
          )}
        </div>

        {comments.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">
              {searchQuery 
                ? `Found ${filteredComments.length} matching results` 
                : `Showing ${comments.length} of ${comments.length} comments found`}
            </span>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded text-xs hover:bg-slate-50 disabled:opacity-30" disabled>Previous</button>
              <button className="px-3 py-1 border border-slate-200 bg-white text-slate-600 rounded text-xs hover:bg-slate-50 disabled:opacity-30" disabled>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
