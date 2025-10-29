export interface Member {
  callsign: string;
  realName: string;
  primaryRoles: string[];
  status: 'Online' | 'Offline';
  avatarUrl: string;
  preferredContact: string;
}

export interface Ship {
  name: string;
  model: string;
  role: 'Capital' | 'Explorer' | 'Fighter' | 'Industrial' | 'Support';
  status: 'In Service' | 'Under Repair' | 'On Mission';
  imageUrl: string;
  description: string;
}

export interface Operation {
  name: string;
  objective: string;
  status: 'Active' | 'Completed' | 'Planned';
  keyPersonnel: string[];
}

export interface DashboardData {
  announcement: {
    title: string;
    content: string;
  };
  stats: {
    totalMembers: number;
    totalShips: number;
    activeOperations: number;
  };
  upcomingEvent: {
    title: string;
    description: string;
    date: string;
  };
}

export type ServerStatusValue = 'operational' | 'degraded_performance' | 'partial_outage' | 'major_outage' | 'under_maintenance';

export interface ServerStatus {
  data: {
    status: ServerStatusValue;
  }
}

export interface ChatMessage {
  callsign: string;
  message?: string;
  gifUrl?: string;
  isUser: boolean;
  timestamp: string;
  avatarUrl: string;
  status?: 'sent' | 'read';
}

export interface UserShip {
  id: number;
  model: string;
  imageUrl?: string;
}

export interface User {
  id: number;
  callsign: string;
  password: string;
  accessStatus: 'pending' | 'approved' | 'denied';
  avatarUrl?: string;
  joinDate: string; // ISO String
  role: string;
  ships: UserShip[];
}

export interface Raffle {
  id: number;
  prize: string;
  endDate: string; // ISO string for dates
  isActive: boolean;
  winner?: string; // callsign
}

export interface RaffleEntry {
  raffleId: number;
  userCallsign: string;
}