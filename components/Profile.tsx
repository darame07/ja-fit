import React, { useState, useEffect, useRef } from 'react';
import { UserData } from '../types';
import Icon from './Icon';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import MicButton from './MicButton';


interface ProfileProps {
    userData: UserData;
    onSave: (data: Partial<UserData>) => void;
}

const Profile: React.FC<ProfileProps> = ({ userData, onSave }) => {
    const [formData, setFormData] = useState<{[key: string]: any}>({
        name: userData.name || '',
        age: userData.age || undefined,
        heightCm: userData.heightCm || undefined,
        weightGoalKg: userData.weightGoalKg || undefined,
        aiSystemInstruction: userData.aiSystemInstruction || '',
    });
    const [isSaved, setIsSaved] = useState(false);

    const [activeField, setActiveField] = useState<string | null>(null);
    const { isListening, transcript, start, stop } = useSpeechRecognition();

    useEffect(() => {
        if (activeField) {
            const isNumericField = ['age', 'heightCm', 'weightGoalKg'].includes(activeField);
            const value = isNumericField ? transcript.replace(/[^0-9]/g, '') : transcript;
            setFormData(prev => ({ ...prev, [activeField]: value }));
        }
    }, [transcript, activeField]);

    const handleMicClick = (field: string) => {
        if (isListening && activeField === field) {
            stop();
            setActiveField(null);
        } else {
            setActiveField(field);
            start();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            age: formData.age ? Number(formData.age) : undefined,
            heightCm: Number(formData.heightCm), // required, so it must be a valid number string
            weightGoalKg: formData.weightGoalKg ? Number(formData.weightGoalKg) : undefined,
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2500);
    };

    const renderInputWithMic = (name: 'name' | 'age' | 'heightCm' | 'weightGoalKg', label: string, type: string = 'text', required: boolean = true) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-slate-300">{label}</label>
            <div className="mt-1 flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
                <input 
                    type={type} 
                    name={name} 
                    id={name} 
                    value={formData[name] || ''} 
                    onChange={handleChange} 
                    required={required}
                    className="w-full bg-transparent p-2 text-white focus:outline-none"
                />
                <MicButton isListening={isListening && activeField === name} onClick={() => handleMicClick(name)} />
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6">
            <h2 className="text-3xl font-bold text-white mb-6">Votre Profil</h2>
            <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto space-y-6">
                
                {!userData.age && (
                    <div className="bg-blue-900/50 border border-blue-500 text-blue-300 px-4 py-3 rounded-lg flex items-start gap-3">
                        <Icon name="info" className="w-6 h-6 flex-shrink-0 mt-1" />
                        <p>Bienvenue ! Veuillez compléter votre profil pour que l'IA puisse vous fournir les meilleurs conseils possibles.</p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderInputWithMic('name', 'Nom')}
                    {renderInputWithMic('age', 'Âge', 'number')}
                    {renderInputWithMic('heightCm', 'Taille (cm)', 'number')}
                    {renderInputWithMic('weightGoalKg', 'Objectif de poids (kg)', 'number', false)}
                </div>

                <div>
                    <label htmlFor="aiSystemInstruction" className="block text-sm font-medium text-slate-300">
                        Instructions pour le Coach IA
                    </label>
                    <p className="text-xs text-slate-400 mb-2">Fournissez des directives ou des documents que l'IA doit toujours suivre. Par exemple, des préférences alimentaires, des limitations physiques, ou des extraits d'études scientifiques.</p>
                    <div className="mt-1 flex items-start gap-2 bg-slate-700 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
                        <textarea 
                            name="aiSystemInstruction"
                            id="aiSystemInstruction"
                            rows={8}
                            value={formData.aiSystemInstruction}
                            onChange={handleChange}
                            className="w-full bg-transparent p-2 text-white focus:outline-none resize-none"
                            placeholder="Ex: 'Je suis un régime végétarien strict.' ou 'Éviter les exercices qui sollicitent les genoux.'..."
                        />
                         <MicButton isListening={isListening && activeField === 'aiSystemInstruction'} onClick={() => handleMicClick('aiSystemInstruction')} />
                    </div>
                </div>

                <div>
                    <button type="submit" className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${isSaved ? 'bg-green-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                        {isSaved ? 'Profil Enregistré !' : 'Enregistrer les Modifications'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default Profile;
