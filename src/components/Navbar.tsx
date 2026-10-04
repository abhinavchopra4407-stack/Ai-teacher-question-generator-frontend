import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  LayoutDashboard, 
  FilePlus, 
  FolderArchive, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck,
  Bot
} from 'lucide-react';

interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
    { id: 'upload', label: 'Generate Questions', icon: FilePlus },
    { id: 'saved', label: 'Saved Papers', icon: FolderArchive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <button
              onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'landing')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-blue-600 bg-clip-text text-transparent">
                  TeachGenie<span className="text-cyan-600 font-extrabold ml-0.5">.AI</span>
                </span>
                <span className="block text-[10px] font-medium tracking-wider text-slate-500 uppercase">
                  Smart Paper Generator
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => setActivePage('login')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Log In
              </button>
              <button
                onClick={() => setActivePage('register')}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer flex items-center space-x-1.5"
              >
                <span>Register Free</span>
              </button>
            </div>
          )}

          {/* Right User Controls */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setActivePage('upload')}
                className="btn-primary px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>New Paper</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'}
                  </div>
                  <div className="text-left text-xs hidden lg:block">
                    <p className="font-semibold text-slate-800 leading-tight">{user?.full_name}</p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{user?.email}</p>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                      <p className="text-xs font-bold text-slate-800">{user?.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Authenticated Teacher
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setActivePage('settings');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 flex items-center space-x-2 cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                        setActivePage('login');
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 font-medium border-t border-slate-100 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile menu toggle button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {isAuthenticated ? (
            <>
              <div className="p-3 bg-blue-50 rounded-lg flex items-center space-x-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'T'}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{user?.full_name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  setActivePage('login');
                }}
                className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-rose-600 hover:bg-rose-50 border-t border-slate-100 mt-2"
              >
                <LogOut className="w-5 h-5 text-rose-500" />
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setActivePage('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setActivePage('register');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center py-2.5 rounded-lg text-sm font-semibold btn-primary"
              >
                Register Free Account
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
