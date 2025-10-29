import React, { useState, useMemo } from 'react';
import ATCOrgLogo from '../assets/ATCOrgLogo';
import { PowerIcon, UsersIcon, ShieldCheckIcon, RocketLaunchIcon, XMarkIcon, CheckIcon, TicketIcon, TrashIcon } from './common/Icons';
import type { User, Raffle, RaffleEntry } from '../types';

interface AdminPanelProps {
  userCallsign: string;
  onLogout: () => void;
  users: User[];
  onApproveUser: (userId: number) => void;
  onDenyUser: (userId: number) => void;
  onRemoveUser: (userId: number) => void;
  currentRaffle?: Raffle;
  raffleEntries: RaffleEntry[];
  pastRaffles: Raffle[];
  onStartRaffle: (prize: string, endDate: string) => void;
  onDrawWinner: () => void;
}

const MemberManagementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onApprove: (userId: number) => void;
  onDeny: (userId: number) => void;
  onRemove: (userId: number) => void;
}> = ({ isOpen, onClose, users, onApprove, onDeny, onRemove }) => {
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  if (!isOpen) return null;

  const pendingUsers = users.filter(u => u.accessStatus === 'pending');
  const approvedUsers = users.filter(u => u.accessStatus === 'approved');
  const deniedUsers = users.filter(u => u.accessStatus === 'denied');

  const UserList: React.FC<{title: string; list: User[]}> = ({ title, list, children }) => (
    <div>
      <h4 className="text-yellow-400 text-lg font-bold mb-2 border-b border-yellow-600/20 pb-1">{title} ({list.length})</h4>
      <div className="space-y-2">
        {list.length > 0 
          ? list.map(user => {
              if (typeof children === 'function') {
                return children({ user });
              }
              return (
                 <div key={user.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-md">
                      <span className="text-gray-300">{user.callsign}</span>
                  </div>
              );
            }) 
          : <p className="text-gray-500 italic text-sm">None</p>}
      </div>
    </div>
  );

  return (
    <>
      {userToRemove && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-[60]" onClick={() => setUserToRemove(null)}>
            <div className="bg-black border border-red-500/70 rounded-lg p-6 w-full max-w-sm animate-fade-in shadow-2xl shadow-red-600/30" onClick={e => e.stopPropagation()}>
              <h3 className="text-white font-bold text-xl mb-4">Confirm Removal</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to remove <span className="font-bold text-white">{userToRemove.callsign}</span> from the organization? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-4">
                <button onClick={() => setUserToRemove(null)} className="bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 px-4 rounded-md transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => {
                      onRemove(userToRemove.id);
                      setUserToRemove(null);
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
                >
                  Remove Member
                </button>
              </div>
            </div>
        </div>
      )}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
        <div className="bg-black border border-red-600/50 rounded-lg p-6 w-full max-w-lg h-[80vh] flex flex-col animate-fade-in shadow-2xl shadow-red-600/20" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-red-400 font-bold text-2xl">Member Management</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
              <XMarkIcon className="w-8 h-8"/>
            </button>
          </div>
          <div className="flex-grow overflow-y-auto pr-2 space-y-6">
            <UserList title="Pending Applications" list={pendingUsers}>
              {({user}: {user: User}) => (
                  <div key={user.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-md">
                      <span className="text-gray-300 font-semibold">{user.callsign}</span>
                      <div className="flex gap-2">
                          <button onClick={() => onApprove(user.id)} className="p-2 bg-green-500/20 hover:bg-green-500/40 text-green-300 rounded-full transition-colors" aria-label={`Approve ${user.callsign}`}>
                              <CheckIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => onDeny(user.id)} className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-full transition-colors" aria-label={`Deny ${user.callsign}`}>
                              <XMarkIcon className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
              )}
            </UserList>
            
             <UserList title="Approved Members" list={approvedUsers} >
              {({user}: {user: User}) => (
                  <div key={user.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-md">
                      <span className="text-gray-300">{user.callsign}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-400 font-bold">APPROVED</span>
                        <button 
                          onClick={() => setUserToRemove(user)}
                          className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-full transition-colors"
                          aria-label={`Remove ${user.callsign}`}
                          >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                  </div>
              )}
            </UserList>

             <UserList title="Denied Access" list={deniedUsers}>
               {({user}: {user: User}) => (
                  <div key={user.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-md">
                      <span className="text-gray-500 line-through">{user.callsign}</span>
                       <span className="text-xs text-red-400 font-bold">DENIED</span>
                  </div>
              )}
            </UserList>

          </div>
        </div>
      </div>
    </>
  );
};

const RaffleManagementModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentRaffle?: Raffle;
  raffleEntries: RaffleEntry[];
  pastRaffles: Raffle[];
  onStartRaffle: (prize: string, endDate: string) => void;
  onDrawWinner: () => void;
}> = ({ isOpen, onClose, currentRaffle, raffleEntries, pastRaffles, onStartRaffle, onDrawWinner }) => {
    const [prize, setPrize] = useState('');
    const [endDate, setEndDate] = useState('');

    if (!isOpen) return null;

    const handleStart = (e: React.FormEvent) => {
        e.preventDefault();
        onStartRaffle(prize, new Date(endDate).toISOString());
        setPrize('');
        setEndDate('');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-black border border-red-600/50 rounded-lg p-6 w-full max-w-2xl h-[85vh] flex flex-col animate-fade-in shadow-2xl shadow-red-600/20" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-red-400 font-bold text-2xl">Raffle Management</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <XMarkIcon className="w-8 h-8"/>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                    {/* Current/New Raffle Section */}
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <h4 className="text-yellow-400 text-lg font-bold mb-3 border-b border-yellow-600/20 pb-2">
                            {currentRaffle ? 'Active Raffle' : 'Start New Raffle'}
                        </h4>
                        {currentRaffle ? (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-400">Prize:</p>
                                    <p className="text-xl font-bold text-white">{currentRaffle.prize}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Ends:</p>
                                    <p className="text-md font-mono text-gray-300">{new Date(currentRaffle.endDate).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Entries: <span className="text-white font-bold">{raffleEntries.length}</span></p>
                                    <div className="max-h-32 overflow-y-auto bg-black/50 rounded-md p-2 mt-1">
                                        {raffleEntries.length > 0 ? (
                                            raffleEntries.map(entry => <p key={entry.userCallsign} className="text-sm text-gray-300">{entry.userCallsign}</p>)
                                        ) : <p className="text-gray-500 italic">No entries yet.</p>}
                                    </div>
                                </div>
                                <button onClick={onDrawWinner} className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    Draw Winner & End Raffle
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleStart} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Prize</label>
                                    <input type="text" value={prize} onChange={e => setPrize(e.target.value)} required className="w-full bg-black/80 border border-yellow-600/30 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">End Date & Time</label>
                                    <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full bg-black/80 border border-yellow-600/30 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-yellow-500" />
                                </div>
                                <button type="submit" className="w-full mt-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
                                    Start Raffle
                                </button>
                            </form>
                        )}
                    </div>
                    
                    {/* Past Winners Section */}
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                        <h4 className="text-yellow-400 text-lg font-bold mb-3 border-b border-yellow-600/20 pb-2">Past Winners</h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {pastRaffles.length > 0 ? (
                                pastRaffles.map(raffle => (
                                    <div key={raffle.id} className="bg-black/50 p-3 rounded-md">
                                        <p className="font-bold text-white">{raffle.prize}</p>
                                        <p className="text-sm text-gray-400">Ended: {new Date(raffle.endDate).toLocaleDateString()}</p>
                                        <p className="text-sm text-yellow-400">Winner: <span className="font-bold">{raffle.winner}</span></p>
                                    </div>
                                ))
                            ) : <p className="text-gray-500 italic">No past raffles.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AdminPanel: React.FC<AdminPanelProps> = ({ userCallsign, onLogout, users, onApproveUser, onDenyUser, onRemoveUser, currentRaffle, raffleEntries, pastRaffles, onStartRaffle, onDrawWinner }) => {
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isRaffleModalOpen, setIsRaffleModalOpen] = useState(false);

  const AdminCard: React.FC<{ title: string, children: React.ReactNode, icon: React.ReactNode }> = ({ title, children, icon }) => (
    <div className="bg-black/50 border border-red-600/30 rounded-lg p-4 backdrop-blur-sm shadow-lg shadow-red-600/10">
      <div className="flex items-center text-red-400 text-lg font-bold mb-3 border-b border-red-600/20 pb-2 uppercase tracking-widest">
        {icon}
        <h2 className="ml-3">{title}</h2>
      </div>
      <div className="text-gray-300 text-sm space-y-2">
        {children}
      </div>
    </div>
  );

  return (
    <>
      <MemberManagementModal 
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        users={users}
        onApprove={onApproveUser}
        onDeny={onDenyUser}
        onRemove={onRemoveUser}
      />
      <RaffleManagementModal
        isOpen={isRaffleModalOpen}
        onClose={() => setIsRaffleModalOpen(false)}
        currentRaffle={currentRaffle}
        raffleEntries={raffleEntries}
        pastRaffles={pastRaffles}
        onStartRaffle={onStartRaffle}
        onDrawWinner={onDrawWinner}
      />
      <div className="w-full max-w-md mx-auto h-screen bg-black overflow-hidden flex flex-col font-orbitron">
        {/* Simulated Phone Shell */}
        <div className="w-full h-full bg-black backdrop-blur-xl border-4 border-red-900/50 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-red-600/20">
          
          {/* Header */}
          <header className="flex-shrink-0 bg-black/30 border-b border-red-600/30 p-3 flex justify-between items-center z-10">
            <div className="flex items-center space-x-3">
              <ATCOrgLogo className="w-12 h-12" />
              <div>
                <h1 className="text-lg font-bold text-red-400 tracking-widest uppercase">ADMIN PANEL</h1>
                <p className="text-xs text-gray-400">User: {userCallsign}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={onLogout} className="text-red-400 hover:text-red-300 transition-colors flex items-center" aria-label="Logout">
                  <span className="text-sm mr-2">LOGOUT</span>
                  <PowerIcon className="w-6 h-6" />
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-grow overflow-y-auto p-4 space-y-6">
              <AdminCard title="Member Management" icon={<UsersIcon className="w-6 h-6"/>}>
                  <p>Approve, deny, or remove member applications.</p>
                  <button onClick={() => setIsMemberModalOpen(true)} className="w-full mt-2 bg-yellow-500/80 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors text-sm">Manage Members</button>
              </AdminCard>
              
              <AdminCard title="Raffle Control" icon={<TicketIcon className="w-6 h-6"/>}>
                  <p>Create, manage, and draw winners for the monthly raffle.</p>
                  <button onClick={() => setIsRaffleModalOpen(true)} className="w-full mt-2 bg-yellow-500/80 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors text-sm">Manage Raffle</button>
              </AdminCard>

              <AdminCard title="Fleet Control" icon={<RocketLaunchIcon className="w-6 h-6"/>}>
                  <p>Update ship statuses, add new vessels, or decommission old ones.</p>
                  <button className="w-full mt-2 bg-yellow-500/80 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors text-sm opacity-50 cursor-not-allowed">Manage Fleet</button>
              </AdminCard>

              <AdminCard title="Operations Command" icon={<ShieldCheckIcon className="w-6 h-6"/>}>
                  <p>Create new operations, update objectives, and assign key personnel.</p>
                  <button className="w-full mt-2 bg-yellow-500/80 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors text-sm opacity-50 cursor-not-allowed">Manage Operations</button>
              </AdminCard>
              
              <AdminCard title="System Diagnostics" icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}>
                  <p>Check API connection status and server health.</p>
                  <div className="text-center p-2 mt-2 bg-black/50 rounded-md border border-green-500/30">
                      <p className="text-green-400 font-bold">ALL SYSTEMS NOMINAL</p>
                  </div>
              </AdminCard>
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;