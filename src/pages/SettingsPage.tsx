import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  Key, 
  Lock, 
  ShieldCheck, 
  Save, 
  Eye,
  EyeOff
} from 'lucide-react';

interface SettingsPageProps {
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ showToast }) => {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await authService.updateProfile({
        full_name: fullName,
        custom_gemini_api_key: apiKey
      });
      await refreshUser();
      showToast('Profile Updated', 'Your profile details and API key preferences have been saved.', 'success');
    } catch (err: any) {
      showToast('Update Failed', err.response?.data?.detail || 'Could not update profile.', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('Error', 'New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Error', 'Password must be at least 6 characters.', 'error');
      return;
    }

    setLoadingPass(true);
    try {
      await authService.updateProfile({
        current_password: currentPassword,
        new_password: newPassword
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password Updated', 'Your account password has been changed securely.', 'success');
    } catch (err: any) {
      showToast('Password Error', err.response?.data?.detail || 'Current password is invalid.', 'error');
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex items-center space-x-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
          <p className="text-xs text-slate-500">Manage your profile, password security, and custom API key configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
            <UserIcon className="w-5 h-5 text-blue-600" />
            <span>Profile Information</span>
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block font-bold text-slate-700 flex items-center justify-between">
                <span>Custom Gemini API Key (Optional)</span>
                <span className="text-[10px] text-indigo-600 font-normal">Optional Teacher Key</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={user?.has_custom_key ? "•••••••••••• (Configured)" : "Enter AI key for custom quota..."}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If left blank, TeachGenie AI uses the server's default high-speed AI engine.
              </p>
            </div>

            <button
              type="submit"
              disabled={loadingProfile}
              className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loadingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-3 flex items-center space-x-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <span>Password Security</span>
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loadingPass}
              className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold flex items-center justify-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{loadingPass ? 'Updating...' : 'Change Password'}</span>
            </button>
          </form>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5 text-xs text-emerald-900">
            <div className="flex items-center space-x-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Database-Level Security Active</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Your saved documents and question papers are protected by isolated user-level authorization checks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
