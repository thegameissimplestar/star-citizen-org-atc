import React, { useState, useMemo, useRef } from 'react';
import type { User } from '../types';
import { SearchIcon, RocketLaunchIcon, PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from './common/Icons';

interface MembersProps {
  users: User[];
  currentUserCallsign: string;
  onUpdateAvatar: (callsign: string, avatarUrl: string) => void;
  onUpdateRole: (callsign: string, newRole: string) => void;
  onAddShip: (callsign: string, newShip: { model: string; imageUrl?: string }) => void;
  onRemoveShip: (callsign: string, shipId: number) => void;
}

const RoleEditor: React.FC<{
    initialRole: string;
    onSave: (newRole: string) => void;
    onCancel: () => void;
}> = ({ initialRole, onSave, onCancel }) => {
    const [role, setRole] = useState(initialRole);
    const handleSave = () => {
        if(role.trim()){
            onSave(role.trim());
        }
    }
    return (
        <div className="flex items-center gap-2 mt-1">
            <input 
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex-grow bg-black/80 border border-yellow-600/30 text-white rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-yellow-500 text-sm"
                autoFocus
            />
            <button onClick={handleSave} className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-2 rounded-md text-xs">Save</button>
            <button onClick={onCancel} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-1 px-2 rounded-md text-xs">Cancel</button>
        </div>
    );
};

const AddShipModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onAddShip: (newShip: { model: string, imageUrl?: string }) => void;
}> = ({ isOpen, onClose, onAddShip }) => {
    const [model, setModel] = useState('');
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageUrl(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!model.trim()) return;
        onAddShip({ model: model.trim(), imageUrl });
        setModel('');
        setImageUrl(undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-black border border-yellow-600/50 rounded-lg p-6 w-full max-w-md animate-fade-in shadow-2xl shadow-yellow-600/20" onClick={e => e.stopPropagation()}>
                <h3 className="text-white font-bold text-xl mb-6 border-b border-yellow-600/20 pb-3">Register New Ship</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-yellow-400 text-sm font-bold mb-2 uppercase tracking-wider">Ship Model</label>
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full bg-black/80 border border-yellow-600/30 text-white rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                            required
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-yellow-400 text-sm font-bold mb-2 uppercase tracking-wider">Ship Image (Optional)</label>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full text-center bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 px-4 rounded-md transition-colors">
                            Upload Image
                        </button>
                        {imageUrl && <img src={imageUrl} alt="Ship preview" className="mt-4 rounded-md max-h-40 mx-auto" />}
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-gray-300 font-bold py-2 px-4 rounded-md transition-colors">Cancel</button>
                        <button type="submit" className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors">Add to Hangar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ImageViewerModal: React.FC<{
    imageUrl: string;
    onClose: () => void;
}> = ({ imageUrl, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50 p-4" 
            onClick={onClose}
        >
            <div 
                className="relative max-w-4xl max-h-[90vh] animate-fade-in"
                onClick={e => e.stopPropagation()} 
            >
                <img src={imageUrl} alt="Enlarged ship view" className="object-contain max-w-full max-h-[90vh] rounded-lg shadow-2xl shadow-yellow-600/30" />
                <button 
                    onClick={onClose} 
                    className="absolute -top-2 -right-2 bg-slate-800 rounded-full p-1 text-white hover:bg-slate-700 transition-colors"
                    aria-label="Close image viewer"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const Members: React.FC<MembersProps> = ({ users, currentUserCallsign, onUpdateAvatar, onUpdateRole, onAddShip, onRemoveShip }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMemberId, setExpandedMemberId] = useState<number | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
  const [isAddShipModalOpen, setIsAddShipModalOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAndSortedMembers = useMemo(() => {
    let filtered = users.filter(user => {
      const term = searchTerm.toLowerCase();
      if (!term) return true;
      return user.callsign.toLowerCase().includes(term);
    });

    filtered.sort((a, b) => a.callsign.localeCompare(b.callsign));

    return filtered;
  }, [users, searchTerm]);

  const handleToggleDetails = (memberId: number) => {
    if (expandedMemberId === memberId) {
        setExpandedMemberId(null);
        setEditingRoleId(null); // Close role editor if collapsing
    } else {
        setExpandedMemberId(memberId);
        setEditingRoleId(null); // Ensure role editor is closed when expanding a new member
    }
  };

  const handleAvatarUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onUpdateAvatar(currentUserCallsign, e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const calculateMembershipDuration = (joinDate: string): string => {
    const start = new Date(joinDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months -= 1;
        // Get days in the previous month
        days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years -= 1;
        months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (years === 0 && months === 0 && days >= 0) {
        if (days === 0) return "Joined today";
        parts.push(`${days} day${days > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : "Joined today";
  };
  
  const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.776 48.776 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );

  const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );

  return (
    <div className="space-y-4">
      {viewingImageUrl && <ImageViewerModal imageUrl={viewingImageUrl} onClose={() => setViewingImageUrl(null)} />}
      <AddShipModal 
          isOpen={isAddShipModalOpen}
          onClose={() => setIsAddShipModalOpen(false)}
          onAddShip={(newShip) => onAddShip(currentUserCallsign, newShip)}
      />
      <h2 className="text-gold-shimmer text-xl font-bold border-b border-yellow-600/20 pb-2 uppercase tracking-widest">
        Member Directory
      </h2>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search by callsign..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/80 border border-yellow-600/30 text-white rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>
      
       <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
        />

      <div className="space-y-3">
        {filteredAndSortedMembers.map((member) => {
          const isCurrentUser = member.callsign === currentUserCallsign;
          const isExpanded = expandedMemberId === member.id;
          const isEditingRole = editingRoleId === member.id;
          return (
            <div key={member.id} className={`bg-black/50 border ${isCurrentUser ? 'border-yellow-400/70' : 'border-yellow-600/30'} rounded-lg backdrop-blur-sm shadow-lg shadow-yellow-600/10 overflow-hidden transition-all duration-300`}>
              <button 
                onClick={() => handleToggleDetails(member.id)}
                className="w-full text-left p-3 flex items-center"
                aria-expanded={isExpanded}
              >
                <div className="relative flex-shrink-0 mr-4 group">
                  <img src={member.avatarUrl || `https://picsum.photos/seed/${member.callsign}/100/100`} alt={member.callsign} className="w-16 h-16 rounded-full border-2 border-yellow-600/50" />
                  {isCurrentUser && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAvatarUploadClick(); }} 
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      aria-label="Change profile picture"
                    >
                        <CameraIcon className="w-8 h-8 text-yellow-400"/>
                    </button>
                  )}
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-white font-bold text-lg">{member.callsign}</h3>
                        </div>
                        <div className="flex items-center flex-shrink-0 ml-4">
                            <span className="w-3 h-3 rounded-full mr-2 bg-green-400 animate-pulse"></span>
                            <span className="text-sm font-medium text-green-400">Active</span>
                        </div>
                    </div>
                </div>
                <ChevronDownIcon className={`w-6 h-6 text-yellow-400 transition-transform duration-300 ml-2 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              <div className={`transition-all duration-500 ease-in-out grid ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="border-t border-yellow-600/20 p-4 space-y-4">
                        <div>
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Role</h4>
                                {isCurrentUser && !isEditingRole && (
                                    <button onClick={() => setEditingRoleId(member.id)} className="text-gray-500 hover:text-yellow-400" aria-label="Edit role">
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {isEditingRole ? (
                                <RoleEditor 
                                    initialRole={member.role}
                                    onSave={(newRole) => {
                                        onUpdateRole(currentUserCallsign, newRole);
                                        setEditingRoleId(null);
                                    }}
                                    onCancel={() => setEditingRoleId(null)}
                                />
                            ) : (
                                <p className="text-white">{member.role}</p>
                            )}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Member For</h4>
                            <p className="text-white">{calculateMembershipDuration(member.joinDate)}</p>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-bold text-yellow-500 uppercase tracking-wider">Personal Hangar</h4>
                                {isCurrentUser && (
                                    <button onClick={() => setIsAddShipModalOpen(true)} className="flex items-center text-xs bg-yellow-600/50 hover:bg-yellow-600/80 text-yellow-200 font-bold py-1 px-2 rounded-md transition-colors">
                                        <PlusIcon className="w-4 h-4 mr-1"/> Add Ship
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {member.ships.length > 0 ? member.ships.map(ship => (
                                    <div key={ship.id} className="flex items-center bg-black/40 p-2 rounded group">
                                        {ship.imageUrl ? (
                                            <button onClick={() => setViewingImageUrl(ship.imageUrl!)} className="flex-shrink-0 mr-3 group/image">
                                                <img src={ship.imageUrl} alt={ship.model} className="w-16 h-8 object-cover rounded-sm transition-transform duration-200 group-hover/image:scale-110" />
                                            </button>
                                        ) : (
                                            <RocketLaunchIcon className="w-8 h-8 text-gray-400 mr-3 flex-shrink-0 p-1" />
                                        )}
                                        <span className="text-gray-300 text-sm flex-grow">{ship.model}</span>
                                        {isCurrentUser && (
                                            <button onClick={() => onRemoveShip(currentUserCallsign, ship.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1" aria-label={`Remove ${ship.model}`}>
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-gray-500 italic text-sm">No ships registered.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          );
        })}
         {filteredAndSortedMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No members found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;