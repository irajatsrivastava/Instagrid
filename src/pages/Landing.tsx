import React from "react";
import { 
  Instagram, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Shield, 
  BarChart3, 
  Globe,
  Chrome,
  FileSpreadsheet
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/FirebaseProvider";

export default function Landing() {
  const { signIn, user } = useAuth();

  return (
    <div className="bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Zap size={14} /> Powering 10k+ Researchers
            </div>
            <h1 className="text-6xl md:text-8xl font-bold leading-[0.9] tracking-tighter mb-8 bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Export Any <br />
              <span className="text-indigo-600 italic">Instagram</span> List <br />
              to Excel.
            </h1>
            <p className="text-lg text-slate-500 max-w-md mb-10 leading-relaxed">
              Professional-grade extraction for comments, participants, and influencers. Zero setup. Advanced AI-powered context recovery.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link to="/dashboard" className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                  Go to Dashboard <ArrowRight size={20} />
                </Link>
              ) : (
                <button 
                  onClick={signIn}
                  className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                >
                  Start Scanning Free <ArrowRight size={20} />
                </button>
              )}
              <Link to="/extension" className="px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                <Chrome size={20} /> Get Extension
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-4 text-slate-400 text-sm font-medium">
              <div className="flex -space-x-2">
                {[1,2,3,4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-8 h-8 rounded-full border-2 border-slate-50" alt="user" />
                ))}
              </div>
              <span>Trusted by creators worldwide</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 transform rotate-2 hover:rotate-0 transition-transform duration-500 overflow-hidden">
               {/* Mockup UI */}
               <div className="h-8 border-b border-slate-100 flex items-center gap-1 px-2 mb-4">
                 <div className="w-2 h-2 rounded-full bg-red-400"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                 <div className="w-2 h-2 rounded-full bg-green-400"></div>
               </div>
               <div className="space-y-4">
                 <div className="h-10 bg-slate-50 rounded-lg border border-slate-100 flex items-center px-4">
                   <div className="w-full h-2 bg-slate-200 rounded"></div>
                 </div>
                 <div className="space-y-2">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="h-12 border-b border-slate-50 flex items-center justify-between px-2">
                       <div className="flex items-center gap-3">
                         <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                         <div className="w-32 h-2 bg-slate-100 rounded"></div>
                       </div>
                       <div className="w-12 h-2 bg-slate-50 rounded"></div>
                     </div>
                   ))}
                 </div>
                 <div className="h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                   <FileSpreadsheet size={16} className="mr-2" /> EXPORT TO EXCEL
                 </div>
               </div>
            </div>
            
            {/* Floaties */}
            <motion.div 
              animate={{ y: [0, -20, 0] }} 
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -top-10 -right-10 p-4 bg-indigo-600 rounded-2xl shadow-xl text-white flex items-center gap-3 z-10"
            >
              <BarChart3 size={24} />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold opacity-70">Extraction Rate</p>
                <p className="text-xl font-bold">99.8%</p>
              </div>
            </motion.div>

            <motion.div 
              animate={{ y: [0, 20, 0] }} 
              transition={{ repeat: Infinity, duration: 5, delay: 1 }}
              className="absolute -bottom-10 -left-10 p-4 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 z-10"
            >
              <Globe size={24} className="text-emerald-500" />
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400">Regional Nodes</p>
                <p className="text-xl font-bold text-slate-800">Global</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-4">Features</h2>
            <p className="text-4xl font-bold text-slate-900 tracking-tight">Built for Professionals.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 mb-6">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Logic Recovery</h3>
              <p className="text-slate-500 leading-relaxed">Advanced logic-based engine extracts and analyzes data even when traditional scrapers are blocked by Instagram's wall.</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 mb-6">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Secure & Private</h3>
              <p className="text-slate-500 leading-relaxed">No login required to Instagram. We use public nodes to fetch data, keeping your account 100% safe.</p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm border border-slate-100 mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-4">Analytics Ready</h3>
              <p className="text-slate-500 leading-relaxed">Export formatted Excel files with timestamps and sanitized IDs, ready for any analysis or CRM import.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
         <div className="max-w-7xl mx-auto rounded-3xl bg-slate-900 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 to-transparent"></div>
            <div className="relative p-12 md:p-24 text-center">
               <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Ready to master your <br />Instagram data?</h2>
               <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={signIn} className="px-10 py-5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                    Get Started Now
                  </button>
                  <Link to="/extension" className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
                    View Extension
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-200">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Instagram size={20} />
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">InstaGrid Excel Pro</span>
            </div>
            <div className="flex gap-8 text-sm font-medium text-slate-500">
               <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
               <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
               <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
            </div>
            <p className="text-xs text-slate-400">© 2026 InstaGrid Systems. All rights reserved.</p>
         </div>
      </footer>
    </div>
  );
}
