import React, { useState, useEffect } from 'react';
import type { Ship } from '../types';
import { generateShipDescription } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { PlusIcon, XMarkIcon, TrashIcon, PencilIcon } from './common/Icons';

const inputStyle = "w-full bg-black/80 border border-yellow-600/30 text-white rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500";
const labelStyle = "block text-yellow-400 text-sm font-bold mb-2 uppercase tracking-wider";

const getStatusColor = (status: Ship['status']) => {
  switch (status) {
    case 'In Service': return 'text-green-400 border-green-400';
    case 'On Mission': return 'text-yellow-400 border-yellow-400';
    case 'Under Repair': return 'text-red-400 border-red-400';
    default: return 'text-gray-400 border-gray-400';
  }
};

interface FleetProps {
  fleet: Ship[];
  setFleet: React.Dispatch<React.SetStateAction<Ship[]>>;
  isLoading: boolean;
  error: string | null;
}

const Fleet: React.FC<FleetProps> = ({ fleet, setFleet, isLoading, error }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null);
  const [shipToDelete, setShipToDelete] = useState<Ship | null>(null);
  const [shipToEdit, setShipToEdit] = useState<Ship | null>(null);
  const [editFormData, setEditFormData] = useState<Ship | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newShip, setNewShip] = useState({
    name: '',
    model: '',
    role: 'Fighter' as Ship['role'],
    status: 'In Service' as Ship['status'],
    imageUrl: '',
  });
  
  useEffect(() => {
    if (shipToEdit) {
      setEditFormData(shipToEdit);
    } else {
      setEditFormData(null);
    }
  }, [shipToEdit]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewShip(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editFormData) return;
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev!, [name]: value }));
  };

  const handleAddShip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShip.name || !newShip.model || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    
    const description = await generateShipDescription(newShip.model, newShip.role);
    
    const finalShip: Ship = {
      ...newShip,
      description,
      imageUrl: newShip.imageUrl || `https://picsum.photos/seed/${newShip.model.replace(/\s/g, '-')}/400/200`,
    };

    setFleet(currentFleet => [finalShip, ...currentFleet]);
    setIsAddModalOpen(false);
    setNewShip({ // Reset form
      name: '',
      model: '',
      role: 'Fighter',
      status: 'In Service',
      imageUrl: '',
    });
    setIsSubmitting(false);
  };
  
  const handleUpdateShip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipToEdit || !editFormData) return;
    
    setFleet(currentFleet =>
      currentFleet.map(ship =>
        ship.name === shipToEdit.name ? editFormData : ship // Use a stable key if available
      )
    );
    
    setShipToEdit(null);
  };

  const handleDeleteShip = () => {
    if (!shipToDelete) return;
    setFleet(currentFleet => currentFleet.filter(ship => ship.name !== shipToDelete.name)); // Use a stable key
    setShipToDelete(null);
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-400 text-center">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-yellow-600/20 pb-2">
        <h2 className="text-gold-shimmer text-xl font-bold uppercase tracking-widest">Fleet Manifest</h2>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-1 px-3 rounded-md transition-colors text-sm"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          <span>New Ship</span>
        </button>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-black border border-yellow-600/50 rounded-lg p-6 w-full max-w-md animate-fade-in shadow-2xl shadow-yellow-600/20" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-xl mb-6 border-b border-yellow-600/20 pb-3">Register New Vessel</h3>
            <form onSubmit={handleAddShip} className="space-y-4">
              <div>
                <label htmlFor="name" className={labelStyle}>Ship Name</label>
                <input type="text" name="name" value={newShip.name} onChange={handleInputChange} className={inputStyle} required />
              </div>
              <div>
                <label htmlFor="model" className={labelStyle}>Model</label>
                <input type="text" name="model" value={newShip.model} onChange={handleInputChange} className={inputStyle} required />
              </div>
              <div>
                <label htmlFor="role" className={labelStyle}>Role</label>
                <select name="role" value={newShip.role} onChange={handleInputChange} className={inputStyle}>
                  <option>Fighter</option>
                  <option>Industrial</option>
                  <option>Explorer</option>
                  <option>Support</option>
                  <option>Capital</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className={labelStyle}>Status</label>
                <select name="status" value={newShip.status} onChange={handleInputChange} className={inputStyle}>
                  <option>In Service</option>
                  <option>On Mission</option>
                  <option>Under Repair</option>
                </select>
              </div>
              <div>
                <label htmlFor="imageUrl" className={labelStyle}>Image URL (Optional)</label>
                <input type="text" name="imageUrl" placeholder="Leave blank for placeholder" value={newShip.imageUrl} onChange={handleInputChange} className={inputStyle} />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 px-4 rounded-md transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                  {isSubmitting ? 'Generating...' : 'Add to Fleet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {shipToEdit && editFormData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setShipToEdit(null)}>
          <div className="bg-black border border-yellow-600/50 rounded-lg p-6 w-full max-w-md animate-fade-in shadow-2xl shadow-yellow-600/20" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-xl mb-6 border-b border-yellow-600/20 pb-3">Edit Vessel Details</h3>
            <form onSubmit={handleUpdateShip} className="space-y-4">
              <div>
                <label htmlFor="name" className={labelStyle}>Ship Name</label>
                <input type="text" name="name" value={editFormData.name} onChange={handleEditInputChange} className={inputStyle} required />
              </div>
              <div>
                <label htmlFor="model" className={labelStyle}>Model</label>
                <input type="text" name="model" value={editFormData.model} onChange={handleEditInputChange} className={inputStyle} required />
              </div>
              <div>
                <label htmlFor="role" className={labelStyle}>Role</label>
                <select name="role" value={editFormData.role} onChange={handleEditInputChange} className={inputStyle}>
                  <option>Fighter</option>
                  <option>Industrial</option>
                  <option>Explorer</option>
                  <option>Support</option>
                  <option>Capital</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className={labelStyle}>Status</label>
                <select name="status" value={editFormData.status} onChange={handleEditInputChange} className={inputStyle}>
                  <option>In Service</option>
                  <option>On Mission</option>
                  <option>Under Repair</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShipToEdit(null)} className="bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 px-4 rounded-md transition-colors">Cancel</button>
                <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedShip && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setSelectedShip(null)}>
          <div className="bg-black border border-yellow-600/50 rounded-lg w-full max-w-md animate-fade-in shadow-2xl shadow-yellow-600/20 overflow-hidden" onClick={e => e.stopPropagation()}>
            <img src={selectedShip.imageUrl} alt={selectedShip.model} className="w-full h-48 object-cover"/>
            <div className="p-6 relative">
               <button onClick={() => setSelectedShip(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                  <XMarkIcon className="w-6 h-6"/>
               </button>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-white font-bold text-2xl">{selectedShip.name}</h3>
                  <p className="text-gray-400 text-md">{selectedShip.model}</p>
                </div>
                <span className="text-xs bg-yellow-800/50 text-yellow-300 border border-yellow-600/30 px-2 py-1 rounded-full whitespace-nowrap mt-1">{selectedShip.role}</span>
              </div>
               <p className="text-gray-300 text-sm mt-4 border-t border-yellow-600/20 pt-4">{selectedShip.description}</p>
               <div className="mt-4 pt-4 text-right">
                <span className={`text-sm font-medium px-3 py-1 border rounded-full ${getStatusColor(selectedShip.status)}`}>
                  {selectedShip.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {shipToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-black border border-red-400/50 rounded-lg p-6 w-full max-w-sm animate-fade-in shadow-2xl shadow-red-500/20"  onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-xl mb-4">Confirm Decommission</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to remove the <span className="font-bold text-white">{shipToDelete.name}</span> ({shipToDelete.model}) from the fleet? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShipToDelete(null)} className="bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 px-4 rounded-md transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDeleteShip}
                className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition-colors"
              >
                Decommission
              </button>
            </div>
          </div>
        </div>
      )}

      {fleet.map((ship, index) => (
        <div
          key={index}
          className="w-full text-left bg-black/50 border border-yellow-600/30 rounded-lg overflow-hidden backdrop-blur-sm shadow-lg shadow-yellow-600/10 animate-fade-in"
          style={{animationDelay: `${index * 50}ms`}}
        >
          <button onClick={() => setSelectedShip(ship)} className="w-full" aria-label={`View details for ${ship.name}`}>
            <img src={ship.imageUrl} alt={ship.model} className="w-full h-32 object-cover" onError={(e) => { e.currentTarget.src = `https://picsum.photos/seed/${ship.model.replace(/\s/g, '-')}/400/200` }}/>
          </button>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-bold text-xl">{ship.name}</h3>
                <p className="text-gray-400 text-sm">{ship.model}</p>
              </div>
              <span className="text-xs bg-yellow-800/50 text-yellow-300 border border-yellow-600/30 px-2 py-1 rounded-full whitespace-nowrap">{ship.role}</span>
            </div>
            <div className="mt-4 pt-3 border-t border-yellow-600/20 flex justify-between items-center">
              <span className={`text-sm font-medium px-3 py-1 border rounded-full ${getStatusColor(ship.status)}`}>
                {ship.status}
              </span>
              <div className="flex items-center space-x-1">
                 <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShipToEdit(ship);
                  }}
                  className="p-2 rounded-full text-gray-500 hover:bg-yellow-500/20 hover:text-yellow-400 transition-colors"
                  aria-label={`Edit ${ship.name}`}
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShipToDelete(ship);
                  }}
                  className="p-2 rounded-full text-gray-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  aria-label={`Decommission ${ship.name}`}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Fleet;
