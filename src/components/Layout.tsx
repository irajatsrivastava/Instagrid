import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Instagram, 
  LogOut, 
  User as UserIcon,
  Loader2,
  LayoutDashboard,
  Home,
  Chrome
} from "lucide-react";
import { useAuth } from "./FirebaseProvider";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signIn, signOut, loading: authLoading } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Navbar */}
      <nav className="h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <Instagram size={20} />
            </div>
            <span className="text-xl font-bold text-slate-800 tracking-tight hidden sm:inline">InstaGrid <span className="text-indigo-600 font-medium text-sm ml-1 uppercase">Excel Pro</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isActive('/') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Home size={16} /> Home
            </Link>
            <Link 
              to="/dashboard" 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isActive('/dashboard') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <LayoutDashboard size={16} /> Dashboard
            </Link>
            <Link 
              to="/extension" 
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${isActive('/extension') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              <Chrome size={16} /> Extension
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-4 md:border-l border-slate-200">
                <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-slate-300" />
                <span className="text-sm font-bold text-slate-700 hidden lg:inline">{user.displayName}</span>
                <button onClick={signOut} className="text-slate-400 hover:text-red-600 p-1" title="Sign Out">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={signIn}
              disabled={authLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-semibold transition-colors shadow-sm shadow-indigo-200 flex items-center gap-2"
            >
              {authLoading ? <Loader2 size={16} className="animate-spin" /> : <UserIcon size={16} />}
              Sign In
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 w-full flex flex-col items-center">
        <div className={location.pathname === '/' ? "w-full" : "max-w-7xl mx-auto w-full p-4 md:p-8"}>
            {children}
        </div>
      </main>

      {location.pathname !== '/' && (
        <footer className="h-12 bg-white border-t border-slate-100 px-8 items-center justify-between shrink-0 hidden md:flex">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              Engine: Active
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
              XLSX: Ready
            </div>
          </div>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-tighter">© 2026 InstaGrid Pro • Enterprise Edition</p>
        </footer>
      )}
    </div>
  );
};
