import React from 'react';
import Icon from './Icon';

interface MicButtonProps {
    isListening: boolean;
    onClick: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ isListening, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`flex-shrink-0 p-2 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-emerald-500 ${isListening ? 'bg-red-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}
        aria-label={isListening ? 'Arrêter la dictée' : 'Commencer la dictée'}
    >
        <Icon name="microphone" className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
    </button>
);

export default MicButton;
