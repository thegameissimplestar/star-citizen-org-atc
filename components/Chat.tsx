import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { ChatMessage, Member } from '../types';
import { generateChatResponse, fetchMembers, searchGifs } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { PaperClipIcon, SearchIcon, CheckIcon, DoubleCheckIcon } from './common/Icons';

interface ChatProps {
    userCallsign: string;
}

const Chat: React.FC<ChatProps> = ({ userCallsign }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [members, setMembers] = useState<Member[]>([]);
    const [isReplying, setIsReplying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGifModalOpen, setIsGifModalOpen] = useState(false);
    const [gifSearchTerm, setGifSearchTerm] = useState('');
    const [gifResults, setGifResults] = useState<string[]>([]);
    const [isSearchingGifs, setIsSearchingGifs] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const memberMap = useMemo(() => new Map(members.map(m => [m.callsign, m])), [members]);

    useEffect(() => {
        const loadMembers = async () => {
            const memberData = await fetchMembers();
            if (memberData) {
                setMembers(memberData);
            } else {
                setError("Could not load member data for chat context.");
            }
        };
        loadMembers();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isReplying]);
    
    const createMessage = (
        content: { message?: string; gifUrl?: string },
        isUser: boolean,
        senderCallsign: string
    ): ChatMessage => {
        const avatarUrl = isUser
            ? `https://picsum.photos/seed/${senderCallsign}/100/100`
            : memberMap.get(senderCallsign)?.avatarUrl || `https://picsum.photos/seed/default/100/100`;

        return {
            ...content,
            callsign: senderCallsign,
            isUser,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            avatarUrl,
            status: isUser ? 'sent' : undefined,
        };
    };

    const triggerAiResponse = async (currentMessages: ChatMessage[]) => {
        setIsReplying(true);
        const aiResponse = await generateChatResponse(currentMessages, members, userCallsign);
        
        if (aiResponse) {
            const aiMessage = createMessage(
                { message: aiResponse.message },
                false,
                aiResponse.callsign
            );
            setMessages(prev => [
                ...prev.map(msg => (msg.isUser ? { ...msg, status: 'read' as 'read' } : msg)),
                aiMessage,
            ]);
        } else {
            setTimeout(() => {
                 setMessages(prev => prev.map(msg => (msg.isUser ? { ...msg, status: 'read' as 'read' } : msg)));
            }, 1000);
        }
        setIsReplying(false);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedMessage = newMessage.trim();
        if (!trimmedMessage || isReplying) return;

        const userMessage = createMessage({ message: trimmedMessage }, true, userCallsign);
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setNewMessage('');
        triggerAiResponse(updatedMessages);
    };

    const handleSendGif = (gifUrl: string) => {
        const gifMessage = createMessage({ gifUrl }, true, userCallsign);
        const updatedMessages = [...messages, gifMessage];
        setMessages(updatedMessages);
        setIsGifModalOpen(false);
        setGifResults([]);
        setGifSearchTerm('');
        triggerAiResponse(updatedMessages);
    };

    const handleSearchGifs = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!gifSearchTerm.trim()) return;
        setIsSearchingGifs(true);
        setGifResults([]);
        const results = await searchGifs(gifSearchTerm);
        if (results) {
            setGifResults(results);
        }
        setIsSearchingGifs(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)]">
            <h2 className="text-gold-shimmer text-xl font-bold border-b border-yellow-600/20 pb-2 mb-4 uppercase tracking-widest flex-shrink-0">
                Org Comms Channel
            </h2>

            <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <img src={msg.avatarUrl} alt={msg.callsign} className="w-8 h-8 rounded-full border-2 border-yellow-600/50 flex-shrink-0" />
                        <div className={`max-w-[70%] p-1 rounded-lg ${msg.isUser ? 'bg-yellow-800/80 text-white rounded-br-none' : 'bg-slate-800/80 text-gray-300 rounded-bl-none'}`}>
                            {!msg.isUser && <p className="text-yellow-400 text-xs font-bold mb-1 px-2 pt-1">{msg.callsign}</p>}
                            {msg.message && <p className="text-sm px-2 pb-1">{msg.message}</p>}
                            {msg.gifUrl && <img src={msg.gifUrl} alt="GIF" className="rounded-md max-w-full h-auto" />}
                            <div className={`flex items-center gap-1.5 px-2 pb-1 ${msg.isUser ? 'justify-end' : ''}`}>
                                <span className="text-xs text-gray-400/80">{msg.timestamp}</span>
                                {msg.isUser && msg.status === 'sent' && <CheckIcon className="w-4 h-4 text-gray-400/80" />}
                                {msg.isUser && msg.status === 'read' && <DoubleCheckIcon className="w-4 h-4 text-yellow-400" />}
                            </div>
                        </div>
                    </div>
                ))}
                {isReplying && (
                     <div className="flex items-end gap-3 flex-row">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0 border-2 border-yellow-600/50"></div>
                        <div className="max-w-[80%] p-3 rounded-lg bg-slate-800/80 rounded-bl-none">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleSendMessage} className="flex-shrink-0 mt-4 flex gap-2">
                <button
                    type="button"
                    onClick={() => setIsGifModalOpen(true)}
                    className="p-2 bg-black/80 border border-yellow-600/30 text-gray-400 hover:text-yellow-400 rounded-md transition-colors"
                    aria-label="Attach media"
                >
                    <PaperClipIcon className="w-6 h-6" />
                </button>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-grow bg-black/80 border border-yellow-600/30 text-white rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500"
                    disabled={isReplying}
                />
                <button
                    type="submit"
                    className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                    disabled={!newMessage.trim() || isReplying}
                >
                    Send
                </button>
            </form>

            {isGifModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={() => setIsGifModalOpen(false)}>
                    <div className="bg-black border border-yellow-600/50 rounded-lg p-4 w-full max-w-md h-[80vh] flex flex-col animate-fade-in shadow-2xl shadow-yellow-600/20" onClick={e => e.stopPropagation()}>
                        <h3 className="text-white font-bold text-lg mb-4">Search for GIFs</h3>
                        <form onSubmit={handleSearchGifs} className="flex gap-2 mb-4">
                             <div className="relative flex-grow">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={gifSearchTerm}
                                    onChange={(e) => setGifSearchTerm(e.target.value)}
                                    className="w-full bg-black/80 border border-yellow-600/30 text-white rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-500"
                                    autoFocus
                                />
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                            <button type="submit" disabled={isSearchingGifs} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600">
                                {isSearchingGifs ? '...' : 'Go'}
                            </button>
                        </form>
                        <div className="flex-grow overflow-y-auto">
                            {isSearchingGifs && <LoadingSpinner />}
                            <div className="grid grid-cols-2 gap-2">
                                {gifResults.map((url, index) => (
                                    <button key={index} onClick={() => handleSendGif(url)} className="bg-slate-800 rounded overflow-hidden aspect-square hover:ring-2 ring-yellow-500 transition-all">
                                        <img src={url} alt="GIF result" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                            {!isSearchingGifs && gifResults.length === 0 && (
                                <p className="text-gray-500 text-center mt-8">Search for GIFs to get started.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;