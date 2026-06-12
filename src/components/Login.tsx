import React, { useState } from "react";
import { Shield, Key, Sparkles, Building, ChevronRight, CheckCircle2 } from "lucide-react";
import { User, UserRole } from "../types";

const LOCAL_FALLBACK_USERS: User[] = [
  {
    id: "u-1",
    name: "Support Admin",
    email: "admin@corporate.com",
    role: UserRole.IT_ADMIN,
    department: "Administration",
    isMfaEnabled: true
  },
  {
    id: "u-2",
    name: "Samuel Awodele",
    email: "samuel.awodele@corporate.com",
    role: UserRole.IT_SUPPORT,
    department: "Administration",
    isMfaEnabled: true
  },
  {
    id: "u-3",
    name: "Chioma Okafor",
    email: "chioma.okafor@corporate.com",
    role: UserRole.STAFF,
    department: "Asset Management",
    isMfaEnabled: false
  },
  {
    id: "u-4",
    name: "Folayan Alabi",
    email: "folayan.alabi@corporate.com",
    role: UserRole.MANAGEMENT,
    department: "Investment Banking",
    isMfaEnabled: true
  },
  {
    id: "u-5",
    name: "Root Administrator",
    email: "sysadmin@corporate.com",
    role: UserRole.SYS_ADMIN,
    department: "Corporate Services",
    isMfaEnabled: true
  }
];

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
}

export default function Login({ onLoginSuccess, users }: LoginProps) {
  const [password, setPassword] = useState("••••••••••••");
  const [isEntraMode, setIsEntraMode] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaStep, setMfaStep] = useState(false);
  const [authError, setAuthError] = useState("");
  const [logoFailed, setLogoFailed] = useState(false);

  const displayUsers = users && users.length > 0 ? users : LOCAL_FALLBACK_USERS;
  const [selectedEmail, setSelectedEmail] = useState("admin@corporate.com");

  // Sync selection when user list gets loaded
  React.useEffect(() => {
    if (displayUsers.length > 0 && !displayUsers.some(u => u.email === selectedEmail)) {
      setSelectedEmail(displayUsers[0].email);
    }
  }, [displayUsers, selectedEmail]);

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    
    const matchedUser = displayUsers.find(u => u.email === selectedEmail);
    if (!matchedUser) {
      setAuthError("Invalid corporate credentials");
      return;
    }

    if (matchedUser.isMfaEnabled) {
      setMfaStep(true);
    } else {
      onLoginSuccess(matchedUser);
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode === "123456" || mfaCode.length === 6) {
      const matchedUser = displayUsers.find(u => u.email === selectedEmail);
      if (matchedUser) {
        onLoginSuccess(matchedUser);
      }
    } else {
      setAuthError("Invalid MFA Verification Code. Use '123456' for test.");
    }
  };

  const triggerEntraLogin = () => {
    setIsEntraMode(true);
    setAuthError("");
    setTimeout(() => {
      // Simulate Microsoft Directory lookup
      const matches = displayUsers.find(u => u.email === selectedEmail);
      setIsEntraMode(false);
      if (matches) {
        if (matches.isMfaEnabled) {
          setMfaStep(true);
        } else {
          onLoginSuccess(matches);
        }
      } else {
        setAuthError("No active Entra ID matches for this domain.");
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden" id="login-container">
      {/* Background visual geometric grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
      
      {/* Gold secondary glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md bg-slate-930 rounded-xl border border-slate-800 shadow-2xl p-8 relative z-10 mx-auto" id="login-card">
        {/* Company Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="mb-4 relative">
            {!logoFailed ? (
              <img 
                src="https://imgur.com/r53TTWv.png" 
                alt="Logo" 
                className="h-14 object-contain" 
                referrerPolicy="no-referrer"
                onError={() => {
                  setLogoFailed(true);
                }}
              />
            ) : (
              /* Minimal fallback label when image fails to load */
              <h1 className="text-xl tracking-widest text-[#C4A052] font-semibold mt-1">C O R P O R A T E</h1>
            )}
          </div>
          <h2 className="text-white font-medium text-lg tracking-tight">IT Support &amp; Maintenance Portal</h2>
          <p className="text-slate-400 text-xs mt-1">Enterprise Service Management System</p>
        </div>

        {authError && (
          <div className="p-3 bg-red-950/40 border border-red-800 rounded-lg text-red-400 text-xs mb-6 text-center" id="auth-error">
            {authError}
          </div>
        )}

        {!mfaStep ? (
          <form onSubmit={handleStandardSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 text-xs font-semibold mb-2">Corporate Account / Role Switcher</label>
              <div className="relative">
                <select
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  className="w-full text-sm bg-slate-900 border border-slate-700 rounded-lg py-2.5 px-3.5 text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer"
                  id="user-select"
                >
                  {displayUsers.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500" />
                Select a user preset to test different workspace roles.
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-slate-300 text-xs font-semibold">Corporate Password</label>
                <button type="button" className="text-[11px] text-[#C4A052] hover:underline" onClick={() => alert("Verification codes can be bypassed in development module.")}>
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm bg-slate-900 border border-slate-700 rounded-lg py-2 px-3.5 text-slate-400 focus:outline-none focus:border-amber-500"
                required
                id="user-pass"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1e293b] text-slate-100 hover:bg-slate-800 border border-slate-700 font-medium py-2.5 rounded-lg text-sm transition-colors mt-2 text-center flex items-center justify-center gap-2 cursor-pointer"
              id="btn-login-std"
            >
              <Key size={16} className="text-amber-500" />
              Sign In with Credentials
            </button>

            {/* Microsoft Entra ID Connection Line */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">OR</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              type="button"
              onClick={triggerEntraLogin}
              disabled={isEntraMode}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-all text-center flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
              id="btn-login-entra"
            >
              {isEntraMode ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Contacting Microsoft Entra Directory...
                </>
              ) : (
                <>
                  <Building size={16} />
                  Login with Microsoft Entra ID
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMfaSubmit} className="space-y-4" id="mfa-form">
            <div className="flex flex-col items-center text-center p-4 bg-slate-900 rounded-lg border border-slate-800 mb-2">
              <Shield className="text-amber-500 mb-2 animate-bounce" size={32} />
              <h3 className="text-white text-sm font-semibold">Multi-Factor Authentication</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                Enter the security access code generated by your corporate Microsoft Authenticator application.
              </p>
            </div>

            <div>
              <label className="block text-slate-300 text-xs font-semibold text-center mb-2">Authenticator Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-xl tracking-[0.5em] font-sans font-bold bg-slate-900 border border-slate-700 rounded-lg py-2 text-white focus:outline-none focus:border-amber-500"
                required
                id="mfa-input"
              />
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Tip: Enter any 6 digits (e.g. <span className="text-amber-500 font-mono">123456</span>) to proceed.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMfaStep(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-lg text-xs transition-colors cursor-pointer text-center"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#C4A052] hover:bg-amber-600 text-slate-950 font-semibold py-2.5 rounded-lg text-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1"
                id="btn-verify-mfa"
              >
                Verify &amp; Continue
                <ChevronRight size={14} />
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
            <CheckCircle2 size={12} className="text-emerald-500" />
            Audited Secure Workspace environment.
          </p>
        </div>
      </div>
    </div>
  );
}
