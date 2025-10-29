import React, { useState, ReactNode, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import Fleet from './components/Fleet';
import Operations from './components/Operations';
import Chat from './components/Chat';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import { HomeIcon, UsersIcon, RocketLaunchIcon, ShieldCheckIcon, SignalIcon, ChatBubbleLeftRightIcon, PowerIcon } from './components/common/Icons';
import ATCOrgLogo from './assets/ATCOrgLogo';
import type { User, Raffle, RaffleEntry, Ship, UserShip } from './types';
import { fetchFleet } from './services/geminiService';

type View = 'dashboard' | 'members' | 'fleet' | 'operations' | 'chat';

// Get next month's date for sample raffle
const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);

// Sample Data
const initialUsers: User[] = [
    { 
        id: 999, 
        callsign: 'ADMIN', 
        password: 'Gracin8386',
        accessStatus: 'approved', 
        avatarUrl: `https://picsum.photos/seed/ADMIN/100/100`,
        joinDate: new Date('2020-01-01T12:00:00Z').toISOString(),
        role: 'Org Leader',
        ships: [
          { id: 99901, model: 'Aegis Javelin', imageUrl: `https://picsum.photos/seed/Aegis-Javelin/200/100` },
          { id: 99902, model: 'Anvil Liberator' },
        ]
      },
    { 
        id: 1, 
        callsign: 'Recker', 
        password: 'password123', 
        accessStatus: 'approved', 
        avatarUrl: `https://picsum.photos/seed/Recker/100/100`,
        joinDate: new Date('2022-01-15T12:00:00Z').toISOString(),
        role: 'Combat Pilot / Squadron Leader',
        ships: [
          { id: 101, model: 'Aegis Sabre', imageUrl: `https://picsum.photos/seed/Aegis-Sabre/200/100` },
          { id: 102, model: 'Anvil F7C-M Super Hornet' },
          { id: 103, model: 'Origin 890 Jump' },
        ]
      },
      { 
        id: 2, 
        callsign: 'Viper', 
        password: 'password123', 
        accessStatus: 'approved', 
        avatarUrl: `https://picsum.photos/seed/Viper/100/100`,
        joinDate: new Date('2023-08-20T18:30:00Z').toISOString(),
        role: 'Explorer / Data Runner',
        ships: [
          { id: 201, model: 'Anvil Carrack', imageUrl: `https://picsum.photos/seed/Anvil-Carrack/200/100` },
          { id: 202, model: 'Drake Herald' },
        ]
      },
      { 
        id: 3, 
        callsign: 'Newbie', 
        password: 'password123', 
        accessStatus: 'pending', 
        avatarUrl: `https://picsum.photos/seed/Newbie/100/100`,
        joinDate: new Date().toISOString(),
        role: 'Recruit',
        ships: [
            { id: 301, model: 'Aurora MR' }
        ]
      },
      { 
        id: 4, 
        callsign: 'Washout', 
        password: 'password123', 
        accessStatus: 'denied', 
        avatarUrl: `https://picsum.photos/seed/Washout/100/100`,
        joinDate: new Date().toISOString(),
        role: 'N/A',
        ships: []
      },
];

const initialRaffles: Raffle[] = [
    { id: 1, prize: 'Aegis Redeemer Ship', endDate: nextMonth.toISOString(), isActive: true },
    { id: 2, prize: '1,000,000 aUEC', endDate: new Date('2024-07-31T23:59:59Z').toISOString(), isActive: false, winner: 'Viper' }
];


const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userCallsign, setUserCallsign] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [raffles, setRaffles] = useState<Raffle[]>(initialRaffles);
  const [raffleEntries, setRaffleEntries] = useState<RaffleEntry[]>([]);
  const [fleet, setFleet] = useState<Ship[]>([]);
  const [isFleetLoading, setIsFleetLoading] = useState(false);
  const [fleetError, setFleetError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && fleet.length === 0) { // Only fetch if logged in and fleet is not loaded
      const loadFleet = async () => {
        setIsFleetLoading(true);
        setFleetError(null);
        try {
          const fleetData = await fetchFleet();
          if (fleetData) {
            setFleet(fleetData);
          } else {
            setFleetError("Failed to fetch fleet data.");
          }
        } catch (err) {
          setFleetError("An unexpected error occurred while fetching fleet.");
          console.error(err);
        } finally {
          setIsFleetLoading(false);
        }
      };
      loadFleet();
    }
  }, [isAuthenticated]);


  // --- Raffle Logic ---
  const currentRaffle = raffles.find(r => r.isActive);
  const pastRaffles = raffles.filter(r => !r.isActive).sort((a,b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  const currentRaffleEntries = currentRaffle ? raffleEntries.filter(e => e.raffleId === currentRaffle.id) : [];
  const hasUserEnteredRaffle = currentRaffle ? currentRaffleEntries.some(e => e.userCallsign === userCallsign) : false;

  const handleEnterRaffle = () => {
    if (currentRaffle && !hasUserEnteredRaffle) {
        setRaffleEntries(prev => [...prev, { raffleId: currentRaffle.id, userCallsign }]);
    }
  };

  const handleStartRaffle = (prize: string, endDate: string) => {
    // Deactivate any existing raffle
    const updatedRaffles = raffles.map(r => ({ ...r, isActive: false }));
    const newRaffle: Raffle = {
        id: Date.now(),
        prize,
        endDate,
        isActive: true,
    };
    setRaffles([...updatedRaffles, newRaffle]);
  };
  
  const handleDrawWinner = () => {
    if (currentRaffle && currentRaffleEntries.length > 0) {
        const winnerEntry = currentRaffleEntries[Math.floor(Math.random() * currentRaffleEntries.length)];
        const winnerCallsign = winnerEntry.userCallsign;
        
        setRaffles(raffles.map(r => r.id === currentRaffle.id ? { ...r, isActive: false, winner: winnerCallsign } : r));
    } else if (currentRaffle) {
        // No entries, just end the raffle
        setRaffles(raffles.map(r => r.id === currentRaffle.id ? { ...r, isActive: false, winner: 'No entries' } : r));
    }
  };


  // --- Auth & User Management ---
  const handleLogin = (callsign: string, password: string): boolean => {
    const user = users.find(u => u.callsign.toLowerCase() === callsign.toLowerCase() && u.password === password);
    if (user && user.accessStatus === 'approved') {
        setUserCallsign(user.callsign);
        setIsAuthenticated(true);
        if (user.callsign === 'ADMIN') {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
        return true;
    }
    return false;
  };
  
  const handleRegister = (callsign: string, password: string): { success: boolean; message: string } => {
    if (users.some(u => u.callsign.toLowerCase() === callsign.toLowerCase())) {
        return { success: false, message: "Gamer Tag already taken." };
    }
    const newUser: User = {
        id: Date.now(),
        callsign,
        password,
        accessStatus: 'pending',
        avatarUrl: `https://picsum.photos/seed/${callsign}/100/100`,
        joinDate: new Date().toISOString(),
        role: 'Recruit',
        ships: [{ id: Date.now(), model: 'Aurora MR' }]
    };
    setUsers(prev => [...prev, newUser]);
    return { success: true, message: "Application submitted! Awaiting admin approval." };
  };

  const handleApproveUser = (userId: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, accessStatus: 'approved' } : u));
  };
  
  const handleDenyUser = (userId: number) => {
    setUsers(users.map(u => u.id === userId ? { ...u, accessStatus: 'denied' } : u));
  };

  const handleRemoveUser = (userId: number) => {
    setUsers(users.filter(u => u.id !== userId));
  };
  
  const handleUpdateAvatar = (callsignToUpdate: string, newAvatarUrl: string) => {
    setUsers(users.map(u => u.callsign === callsignToUpdate ? { ...u, avatarUrl: newAvatarUrl } : u));
  };
  
  const handleUpdateUserRole = (callsign: string, newRole: string) => {
    setUsers(users.map(u => u.callsign === callsign ? { ...u, role: newRole } : u));
  };

  const handleAddUserShip = (callsign: string, newShipData: { model: string; imageUrl?: string }) => {
    setUsers(users.map(u => {
      if (u.callsign === callsign) {
        const newShip: UserShip = {
          id: Date.now(),
          model: newShipData.model,
          imageUrl: newShipData.imageUrl,
        };
        return { ...u, ships: [...u.ships, newShip] };
      }
      return u;
    }));
  };

  const handleRemoveUserShip = (callsign: string, shipId: number) => {
    setUsers(users.map(u => {
      if (u.callsign === callsign) {
        return { ...u, ships: u.ships.filter(s => s.id !== shipId) };
      }
      return u;
    }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setUserCallsign('');
    setActiveView('dashboard');
    setFleet([]); // Reset fleet on logout
  };

  const renderView = (): ReactNode => {
    const approvedUsers = users.filter(u => u.accessStatus === 'approved');
    const totalPlayerShips = approvedUsers.reduce((acc, user) => acc + user.ships.length, 0);

    switch (activeView) {
      case 'dashboard':
        return <Dashboard 
                  raffle={currentRaffle}
                  hasUserEnteredRaffle={hasUserEnteredRaffle}
                  onEnterRaffle={handleEnterRaffle}
                  totalShips={totalPlayerShips}
                  totalMembers={approvedUsers.length}
                />;
      case 'members':
        return <Members 
                  users={approvedUsers} 
                  currentUserCallsign={userCallsign} 
                  onUpdateAvatar={handleUpdateAvatar}
                  onUpdateRole={handleUpdateUserRole}
                  onAddShip={handleAddUserShip}
                  onRemoveShip={handleRemoveUserShip} 
                />;
      case 'fleet':
        return <Fleet fleet={fleet} setFleet={setFleet} isLoading={isFleetLoading} error={fleetError} />;
      case 'operations':
        return <Operations />;
      case 'chat':
        return <Chat userCallsign={userCallsign} />;
      default:
        return <Dashboard 
                  raffle={currentRaffle}
                  hasUserEnteredRaffle={hasUserEnteredRaffle}
                  onEnterRaffle={handleEnterRaffle}
                  totalShips={totalPlayerShips}
                  totalMembers={approvedUsers.length}
                />;
    }
  };

  const NavItem: React.FC<{ view: View; label: string; icon: ReactNode }> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-300 group ${
        activeView === view ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'
      }`}
    >
      {icon}
      <span className={`text-xs mt-1 ${activeView === view ? 'font-bold text-gold-shimmer' : 'group-hover:text-yellow-400'}`}>{label}</span>
    </button>
  );

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  if (isAdmin) {
    return <AdminPanel 
              userCallsign={userCallsign} 
              onLogout={handleLogout} 
              users={users}
              onApproveUser={handleApproveUser}
              onDenyUser={handleDenyUser}
              onRemoveUser={handleRemoveUser}
              currentRaffle={currentRaffle}
              raffleEntries={currentRaffleEntries}
              pastRaffles={pastRaffles}
              onStartRaffle={handleStartRaffle}
              onDrawWinner={handleDrawWinner}
            />;
  }

  return (
    <div className="w-full max-w-md mx-auto h-screen bg-black overflow-hidden flex flex-col font-orbitron">
      {/* Simulated Phone Shell */}
      <div className="w-full h-full bg-black backdrop-blur-xl border-4 border-yellow-900/50 rounded-3xl overflow-hidden flex flex-col shadow-2xl shadow-yellow-600/20">
        
        {/* Header */}
        <header className="flex-shrink-0 bg-black/30 border-b border-yellow-600/30 p-3 flex justify-between items-center z-10">
          <div className="flex items-center space-x-3">
            <ATCOrgLogo className="w-12 h-12" />
            <div>
              <h1 className="text-lg font-bold text-gold-shimmer tracking-widest uppercase">ATC</h1>
              <p className="text-xs text-gray-400">User: {userCallsign}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-green-400">
              <SignalIcon className="w-5 h-5" />
              <span className="text-sm font-medium">ONLINE</span>
            </div>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition-colors" aria-label="Logout">
              <PowerIcon className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow overflow-y-auto p-1">
          <div className="p-3">
             {renderView()}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="flex-shrink-0 bg-black/50 backdrop-blur-lg border-t border-yellow-600/30 flex justify-around">
          <NavItem view="dashboard" label="Dashboard" icon={<HomeIcon className="w-6 h-6"/>} />
          <NavItem view="members" label="Members" icon={<UsersIcon className="w-6 h-6"/>} />
          <NavItem view="fleet" label="Fleet" icon={<RocketLaunchIcon className="w-6 h-6"/>} />
          <NavItem view="operations" label="Operations" icon={<ShieldCheckIcon className="w-6 h-6"/>} />
          <NavItem view="chat" label="Chat" icon={<ChatBubbleLeftRightIcon className="w-6 h-6"/>} />
        </footer>
      </div>
      <style>{`
        @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
        }
        .text-gold-shimmer {
          background-image: linear-gradient(145deg, #F0E68C, #FFD700, #DAA520, #B8860B, #DAA520, #FFD700, #F0E68C);
          -webkit-background-clip: text;
          -moz-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          -moz-text-fill-color: transparent;
          background-size: 400% 400%;
          animation: shimmer 4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
};

export default App;