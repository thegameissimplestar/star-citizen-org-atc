import React, { useState, useEffect } from 'react';
import type { DashboardData, ServerStatus, ServerStatusValue, Raffle } from '../types';
import { fetchDashboardData, fetchServerStatus } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';

const Card: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
  <div className={`bg-black/50 border border-yellow-600/30 rounded-lg p-4 backdrop-blur-sm shadow-lg shadow-yellow-600/10 ${className}`}>
    <h2 className="text-gold-shimmer text-lg font-bold mb-3 border-b border-yellow-600/20 pb-2 uppercase tracking-widest">{title}</h2>
    <div className="text-gray-300 text-sm space-y-2">
      {children}
    </div>
  </div>
);

const ServerStatusIndicator: React.FC<{ status: ServerStatusValue | null }> = ({ status }) => {
  const getStatusDetails = () => {
    switch (status) {
      case 'operational':
        return { text: 'Operational', color: 'bg-green-500', textColor: 'text-green-400' };
      case 'degraded_performance':
        return { text: 'Degraded', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
      case 'partial_outage':
        return { text: 'Partial Outage', color: 'bg-yellow-500', textColor: 'text-yellow-400' };
      case 'major_outage':
        return { text: 'Major Outage', color: 'bg-red-500', textColor: 'text-red-400' };
      case 'under_maintenance':
         return { text: 'Maintenance', color: 'bg-blue-500', textColor: 'text-blue-400' };
      default:
        return { text: 'Unknown', color: 'bg-gray-600', textColor: 'text-gray-500' };
    }
  };

  const { text, color, textColor } = getStatusDetails();

  return (
    <div className="bg-black/50 border border-yellow-600/30 rounded-lg p-3 backdrop-blur-sm shadow-lg shadow-yellow-600/10 mb-6 flex items-center justify-between">
      <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-widest">Live Server Status</h3>
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${color} ${status === 'operational' ? 'animate-pulse' : ''}`}></div>
        <span className={`text-sm font-semibold ${textColor}`}>{text.toUpperCase()}</span>
      </div>
    </div>
  );
};

const Countdown: React.FC<{ endDate: string }> = ({ endDate }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(endDate) - +new Date();
        let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    // FIX: Replaced Object.values check with explicit property checks to avoid TypeScript error with `unknown` type.
    const hasTimeLeft = timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0 || timeLeft.seconds > 0;

    return (
        <div className="grid grid-cols-4 gap-2 text-center font-mono">
            {hasTimeLeft ? (
                Object.entries(timeLeft).map(([interval, value]) => (
                    <div key={interval} className="bg-black/50 p-2 rounded-md">
                        <div className="text-2xl font-bold text-white">{String(value).padStart(2, '0')}</div>
                        <div className="text-xs text-yellow-500 uppercase">{interval}</div>
                    </div>
                ))
            ) : (
                <div className="col-span-4 text-lg text-red-400 font-bold tracking-widest">DRAWING COMPLETE</div>
            )}
        </div>
    );
};


interface DashboardProps {
    raffle?: Raffle;
    hasUserEnteredRaffle: boolean;
    onEnterRaffle: () => void;
    totalShips: number;
    totalMembers: number;
}

const Dashboard: React.FC<DashboardProps> = ({ raffle, hasUserEnteredRaffle, onEnterRaffle, totalShips, totalMembers }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [dashboardData, statusData] = await Promise.all([
          fetchDashboardData(),
          fetchServerStatus()
        ]);

        if (dashboardData) {
          setData(dashboardData);
        } else {
          setError("Failed to fetch dashboard data. The network may be unstable.");
        }
        
        setServerStatus(statusData);

      } catch (err) {
        setError("An unexpected error occurred while loading dashboard.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 animate-fade-in">
      <ServerStatusIndicator status={serverStatus?.data?.status ?? null} />
      
      {data ? (
        <>
          <Card title="Monthly Raffle">
              {raffle ? (
                  <div className="space-y-4">
                      <div>
                          <p className="text-gray-400">Current Prize:</p>
                          <p className="text-white font-bold text-lg">{raffle.prize}</p>
                      </div>
                      <Countdown endDate={raffle.endDate} />
                      <button
                          onClick={onEnterRaffle}
                          disabled={hasUserEnteredRaffle || new Date(raffle.endDate) < new Date()}
                          className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                          {hasUserEnteredRaffle ? "Entry Confirmed" : "Enter Raffle"}
                      </button>
                  </div>
              ) : (
                  <p className="text-center text-gray-500">No active raffle at the moment. Check back soon!</p>
              )}
          </Card>

          <Card title={data.announcement.title}>
            <p>{data.announcement.content}</p>
          </Card>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-black/50 border border-yellow-600/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-white">{totalMembers}</p>
              <p className="text-xs text-yellow-500 uppercase">Members</p>
            </div>
            <div className="bg-black/50 border border-yellow-600/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-white">{totalShips}</p>
              <p className="text-xs text-yellow-500 uppercase">Player Ships</p>
            </div>
            <div className="bg-black/50 border border-yellow-600/30 rounded-lg p-3">
              <p className="text-2xl font-bold text-white">{data.stats.activeOperations}</p>
              <p className="text-xs text-yellow-500 uppercase">Active Ops</p>
            </div>
          </div>

          <Card title="Next Operation">
            <h3 className="font-bold text-white text-base">{data.upcomingEvent.title}</h3>
            <p className="text-gray-400">{data.upcomingEvent.description}</p>
            <p className="text-yellow-400 font-mono mt-2 text-right text-xs">{data.upcomingEvent.date}</p>
          </Card>
        </>
      ) : (
        error && <p className="text-red-400 text-center">{error}</p>
      )}
    </div>
  );
};

export default Dashboard;