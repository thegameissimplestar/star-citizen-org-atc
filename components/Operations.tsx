import React, { useState, useEffect } from 'react';
import type { Operation } from '../types';
import { fetchOperations } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';

const Operations: React.FC = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOperations = async () => {
      try {
        setLoading(true);
        const opsData = await fetchOperations();
        if (opsData) {
          setOperations(opsData);
        } else {
          setError("Failed to fetch operations data. The network may be unstable.");
        }
      } catch (err) {
        setError("An unexpected error occurred.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadOperations();
  }, []);

  const getStatusPill = (status: Operation['status']) => {
    let colorClasses = '';
    switch (status) {
      case 'Active': colorClasses = 'bg-green-500/20 text-green-300 border-green-400/50 animate-pulse'; break;
      case 'Completed': colorClasses = 'bg-blue-500/20 text-blue-300 border-blue-400/50'; break;
      case 'Planned': colorClasses = 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'; break;
    }
    return <span className={`px-3 py-1 text-xs font-bold rounded-full border ${colorClasses}`}>{status}</span>;
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <p className="text-red-400 text-center">{error}</p>;

  return (
    <div className="space-y-4">
       <h2 className="text-gold-shimmer text-xl font-bold mb-3 border-b border-yellow-600/20 pb-2 uppercase tracking-widest">Operations Log</h2>
      {operations.map((op, index) => (
        <div
          key={index}
          className="bg-black/50 border border-yellow-600/30 rounded-lg p-4 backdrop-blur-sm shadow-lg shadow-yellow-600/10"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-bold text-lg">{op.name}</h3>
            {getStatusPill(op.status)}
          </div>
          <div className="border-t border-yellow-600/20 pt-3">
            <p className="text-sm text-gray-300 mb-3"><span className="font-semibold text-yellow-400">Objective:</span> {op.objective}</p>
            <div>
              <h4 className="text-yellow-400 font-semibold mb-1 text-sm">Key Personnel:</h4>
              <div className="flex flex-wrap gap-2">
                {op.keyPersonnel.map(p => (
                  <span key={p} className="text-xs bg-slate-800 text-gray-300 px-2 py-1 rounded">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Operations;