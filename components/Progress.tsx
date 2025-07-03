import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UserData, ChatMessage } from '../types';
import ProgressCharts from './ProgressCharts';
import * as geminiService from '../services/geminiService';
import Spinner from './Spinner';
import Icon from './Icon';

interface ProgressProps {
  userData: UserData;
}

const Progress: React.FC<ProgressProps> = ({ userData }) => {
  const [advice, setAdvice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // State for the new chat feature
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'model', text: `Bonjour ${userData.name} ! En quoi puis-je vous aider aujourd'hui concernant vos progrès ?` }
  ]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const handleGetAdvice = useCallback(async () => {
    setIsLoading(true);
    const result = await geminiService.getPersonalizedAdvice(userData);
    setAdvice(result);
    setIsLoading(false);
  }, [userData]);

  useEffect(() => {
    if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message || isChatLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', text: message };
    
    // Pass the history state BEFORE adding the new user message to the API call
    const currentHistoryForApi = [...chatHistory];
    
    setChatHistory(prev => [...prev, newUserMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
        const responseText = await geminiService.getChatResponse(userData, currentHistoryForApi, message);
        const newModelMessage: ChatMessage = { role: 'model', text: responseText };
        setChatHistory(prev => [...prev, newModelMessage]);
    } catch (error) {
        console.error("Chat error:", error);
        const errorMessage: ChatMessage = { role: 'model', text: "Désolé, une erreur s'est produite lors de la communication." };
        setChatHistory(prev => [...prev, errorMessage]);
    } finally {
        setIsChatLoading(false);
    }
  };
  
  const ChatBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><Icon name="sparkles" className="w-5 h-5 text-white" /></div>}
            <div className={`px-4 py-2 rounded-lg max-w-md ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.text}</p>
            </div>
             {isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center"><Icon name="user" className="w-5 h-5 text-white" /></div>}
        </div>
    );
  };


  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-3xl font-bold text-white">Vos Progrès</h2>
      <p className="text-slate-400">Visualisez votre parcours et obtenez des informations personnalisées.</p>

      <ProgressCharts userData={userData} />

      <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">Coach IA Personnalisé</h3>
        
        {!advice && !isLoading && (
            <div className="text-center">
                 <p className="text-slate-300 mb-4">Obtenez des conseils nutritionnels et d'exercices sur mesure en fonction de vos progrès.</p>
                <button onClick={handleGetAdvice} className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-2 mx-auto">
                    Générer mes conseils
                </button>
            </div>
        )}

        {isLoading && <div className="flex justify-center"><Spinner /></div>}
        
        {advice && !isLoading && (
            <div className="prose prose-invert prose-p:text-slate-300 prose-li:text-slate-300 prose-headings:text-emerald-300 max-w-none">
                 {advice.split('\n').map((line, index) => {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('### ')) {
                        return <h3 key={index} className="text-emerald-300 font-semibold text-lg mt-4 mb-2">{trimmedLine.replace('### ', '')}</h3>;
                    }
                    if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                       let cleanLine = trimmedLine.substring(2);
                       if(cleanLine.startsWith('**') && cleanLine.endsWith('**')) {
                           cleanLine = cleanLine.substring(2, cleanLine.length - 2);
                       }
                       return <p key={index} className="flex items-start gap-2"><span className="text-emerald-400 mt-1">✓</span><span>{cleanLine}</span></p>;
                    }
                    if (trimmedLine.length === 0) return null;
                    return <p key={index}>{line}</p>;
                })}
                 <button onClick={handleGetAdvice} className="mt-6 bg-slate-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 flex items-center justify-center gap-2 text-sm no-prose">
                    Regénérer les conseils
                </button>
            </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-700">
            <h4 className="text-lg font-semibold text-white mb-4">Discuter avec le Coach</h4>
            <div ref={chatMessagesRef} className="max-h-80 overflow-y-auto space-y-4 p-4 bg-slate-900/50 rounded-lg">
                {chatHistory.map((msg, index) => <ChatBubble key={index} message={msg} />)}
                {isChatLoading && (
                    <div className="flex items-end gap-2 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center"><Icon name="sparkles" className="w-5 h-5 text-white" /></div>
                        <div className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none">
                            <Spinner />
                        </div>
                    </div>
                )}
            </div>
            <form onSubmit={handleChatSubmit} className="mt-4 flex items-center gap-3">
                <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Posez votre question ici..."
                    className="flex-grow bg-slate-700 border border-slate-600 rounded-lg p-2 text-white focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50"
                    disabled={isChatLoading}
                />
                <button 
                    type="submit" 
                    className="bg-emerald-500 text-white font-bold p-2 rounded-lg hover:bg-emerald-600 disabled:bg-slate-500 disabled:cursor-not-allowed"
                    disabled={isChatLoading || !chatInput}
                    aria-label="Envoyer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Progress;
