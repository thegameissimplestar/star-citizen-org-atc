import React, { useState } from 'react';
import ATCOrgLogo from '../assets/ATCOrgLogo';
import { XMarkIcon } from './common/Icons';

const inputStyle = "w-full bg-black/80 border border-yellow-600/30 text-white rounded-md py-3 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500 text-center tracking-widest text-lg";
const buttonStyle = "w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 px-4 rounded-md transition-colors uppercase tracking-widest";

interface LoginScreenProps {
  onLogin: (callsign: string, password: string) => boolean;
  onRegister: (callsign: string, password: string) => { success: boolean; message: string };
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onRegister }) => {
  const [callsign, setCallsign] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [newCallsign, setNewCallsign] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [registrationStatus, setRegistrationStatus] = useState<{ type: 'info' | 'success' | 'error', message: string } | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (callsign.trim() && password.trim()) {
      const success = onLogin(callsign.trim(), password.trim());
      if (!success) {
        setLoginError('Invalid credentials or access denied.');
      }
    }
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegistrationStatus(null);
    if (!newCallsign.trim() || !newPassword.trim()) {
        setRegistrationStatus({ type: 'error', message: "Gamer Tag and Password are required."});
        return;
    }
    const result = onRegister(newCallsign.trim(), newPassword.trim());
    if (result.success) {
        setRegistrationStatus({ type: 'success', message: result.message });
        setNewCallsign('');
        setNewPassword('');
    } else {
        setRegistrationStatus({ type: 'error', message: result.message });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-black overflow-hidden flex flex-col font-orbitron">
      <div className="w-full h-full bg-black border-4 border-yellow-900/50 rounded-3xl overflow-hidden flex flex-col justify-center items-center p-8 shadow-2xl shadow-yellow-600/20">
        <div className="text-center w-full max-w-xs animate-fade-in">
          <ATCOrgLogo className="w-40 h-40 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gold-shimmer tracking-widest uppercase mb-2">ATC Network</h1>
          <p className="text-gray-400 mb-8">Stanton Systems Terminal Access</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={callsign}
              onChange={(e) => setCallsign(e.target.value)}
              placeholder="ENTER GAMER TAG"
              className={inputStyle}
              required
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className={inputStyle}
              required
            />
             {loginError && <p className="text-red-500 text-xs text-center pt-2">{loginError}</p>}
            <button type="submit" className={`${buttonStyle} mt-6`}>
              Access Terminal
            </button>
          </form>

          <div className="mt-12">
            <button 
              onClick={() => {
                setIsJoinModalOpen(true);
                setRegistrationStatus(null); // Reset status on open
              }}
              className="text-gray-500 hover:text-yellow-400 transition-colors duration-300 tracking-wider"
            >
              New Recruit? <span className="underline">Join ATC</span>
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
      
      {isJoinModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsJoinModalOpen(false)}>
          <div className="bg-black border border-yellow-600/50 rounded-lg p-6 w-full max-w-md animate-fade-in shadow-2xl shadow-yellow-600/20 relative" onClick={e => e.stopPropagation()}>
             <button onClick={() => setIsJoinModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6"/>
             </button>
            <h3 className="text-white font-bold text-xl mb-6 border-b border-yellow-600/20 pb-3">ATC Enlistment Application</h3>
            <form onSubmit={handleRegister} className="space-y-4">
                <input
                    type="text"
                    value={newCallsign}
                    onChange={(e) => setNewCallsign(e.target.value)}
                    placeholder="CHOOSE GAMER TAG"
                    className={inputStyle}
                    required
                />
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="SET PASSWORD"
                    className={inputStyle}
                    required
                />
                 {registrationStatus && (
                    <div className={`text-center text-sm p-3 rounded-md ${
                        registrationStatus.type === 'success' ? 'bg-green-500/20 text-green-300' :
                        registrationStatus.type === 'error' ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-500/20 text-gray-300'
                    }`}>
                        {registrationStatus.message}
                    </div>
                )}
                <button type="submit" className={`${buttonStyle} mt-4`}>
                  Submit Application
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;