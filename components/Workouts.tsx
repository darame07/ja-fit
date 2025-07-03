import React, { useState } from 'react';
import { Workout, WorkoutLog } from '../types';
import Icon from './Icon';

const workoutData: Workout[] = [
    // Vélo d'appartement
    { name: "Vélo - Endurance", level: "Débutant", durationMinutes: 10, caloriesBurned: 80, type: "Vélo d'appartement" },
    { name: "Vélo - Endurance", level: "Débutant", durationMinutes: 20, caloriesBurned: 160, type: "Vélo d'appartement" },
    { name: "Vélo - Endurance", level: "Débutant", durationMinutes: 30, caloriesBurned: 240, type: "Vélo d'appartement" },
    { name: "Vélo - Endurance", level: "Débutant", durationMinutes: 45, caloriesBurned: 360, type: "Vélo d'appartement" },
    { name: "Vélo - Intervalles", level: "Intermédiaire", durationMinutes: 10, caloriesBurned: 110, type: "Vélo d'appartement" },
    { name: "Vélo - Intervalles", level: "Intermédiaire", durationMinutes: 20, caloriesBurned: 220, type: "Vélo d'appartement" },
    { name: "Vélo - Intervalles", level: "Intermédiaire", durationMinutes: 30, caloriesBurned: 330, type: "Vélo d'appartement" },
    { name: "Vélo - Intervalles", level: "Intermédiaire", durationMinutes: 45, caloriesBurned: 495, type: "Vélo d'appartement" },
    { name: "Vélo - HIIT", level: "Avancé", durationMinutes: 10, caloriesBurned: 180, type: "Vélo d'appartement" },
    { name: "Vélo - HIIT", level: "Avancé", durationMinutes: 20, caloriesBurned: 360, type: "Vélo d'appartement" },
    { name: "Vélo - HIIT", level: "Avancé", durationMinutes: 30, caloriesBurned: 540, type: "Vélo d'appartement" },
    
    // Plateforme vibrante
    { name: "Vibrations - Stabilité", level: "Débutant", durationMinutes: 5, caloriesBurned: 35, type: "Plateforme vibrante" },
    { name: "Vibrations - Stabilité", level: "Débutant", durationMinutes: 10, caloriesBurned: 70, type: "Plateforme vibrante" },
    { name: "Vibrations - Tonus", level: "Intermédiaire", durationMinutes: 10, caloriesBurned: 100, type: "Plateforme vibrante" },
    { name: "Vibrations - Tonus", level: "Intermédiaire", durationMinutes: 15, caloriesBurned: 150, type: "Plateforme vibrante" },
    { name: "Vibrations - Puissance", level: "Avancé", durationMinutes: 10, caloriesBurned: 130, type: "Plateforme vibrante" },
    { name: "Vibrations - Puissance", level: "Avancé", durationMinutes: 15, caloriesBurned: 195, type: "Plateforme vibrante" },

    // Marche
    { name: "Marche en extérieur", level: "Débutant", durationMinutes: 0, caloriesBurned: 0, type: "Marche" },
];


type Level = 'Tous' | 'Débutant' | 'Intermédiaire' | 'Avancé';

interface WorkoutsProps {
    onLogWorkout: (workout: WorkoutLog) => void;
}

const WalkModal: React.FC<{onSave: (duration: number) => void; onClose: () => void}> = ({ onSave, onClose }) => {
    const [duration, setDuration] = useState(30);

    const handleSave = () => {
        onSave(duration);
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
                <h3 className="text-xl font-semibold text-emerald-400 mb-4">Enregistrer une Marche</h3>
                <div>
                    <label htmlFor="walk-duration" className="block text-sm font-medium text-slate-300 mb-2">Durée de la marche (minutes)</label>
                    <input 
                        type="number" 
                        id="walk-duration" 
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
                    />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-semibold">Annuler</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold">Enregistrer</button>
                </div>
            </div>
        </div>
    )
}

const WorkoutCard: React.FC<{ workout: Workout; onStart: (workout: Workout) => void }> = ({ workout, onStart }) => {
    const levelColor = {
        Débutant: 'text-green-400',
        Intermédiaire: 'text-yellow-400',
        Avancé: 'text-red-400',
    };
    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex flex-col justify-between">
            <div>
                 <p className="text-xs font-semibold text-slate-400">{workout.type}</p>
                <h4 className="text-lg font-semibold text-white mt-1">{workout.name}</h4>
                 <p className={`text-sm font-bold ${levelColor[workout.level]}`}>{workout.level}</p>
            </div>
            {workout.type !== 'Marche' && (
                <div className="mt-4 flex justify-between items-center text-slate-300">
                    <div className="flex items-center gap-2">
                        <Icon name="clock" className="w-5 h-5" />
                        <span>{workout.durationMinutes} min</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Icon name="flame" className="w-5 h-5" />
                        <span>~{workout.caloriesBurned} kcal</span>
                    </div>
                </div>
            )}
            <button onClick={() => onStart(workout)} className="mt-4 w-full bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 transition-colors">
                {workout.type === 'Marche' ? 'Enregistrer une marche' : 'Commencer l\'entraînement'}
            </button>
        </div>
    );
};

const Workouts: React.FC<WorkoutsProps> = ({ onLogWorkout }) => {
    const [filter, setFilter] = useState<Level>('Tous');
    const [isWalkModalOpen, setIsWalkModalOpen] = useState(false);
    const [confirmationMsg, setConfirmationMsg] = useState('');
    
    const filteredWorkouts = workoutData.filter(w => filter === 'Tous' || w.level === filter);

    const showConfirmation = (message: string) => {
        setConfirmationMsg(message);
        setTimeout(() => setConfirmationMsg(''), 3000);
    }

    const handleStartWorkout = (workout: Workout) => {
        if (workout.type === 'Marche') {
            setIsWalkModalOpen(true);
        } else {
            onLogWorkout({
                id: Date.now().toString(),
                name: workout.name,
                durationMinutes: workout.durationMinutes,
                caloriesBurned: workout.caloriesBurned
            });
            showConfirmation(`Entraînement '${workout.name}' enregistré !`);
        }
    }

    const handleSaveWalk = (duration: number) => {
        // Simple approximation: 5 calories burned per minute of walking.
        const caloriesBurned = duration * 5;
        onLogWorkout({
            id: Date.now().toString(),
            name: "Marche manuelle",
            durationMinutes: duration,
            caloriesBurned: caloriesBurned
        });
        showConfirmation(`Marche de ${duration} minutes enregistrée !`);
    }

    const FilterButton: React.FC<{ level: Level }> = ({ level }) => (
        <button
            onClick={() => setFilter(level)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                filter === level
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
        >
            {level}
        </button>
    );

    return (
        <div className="p-4 md:p-6">
            {isWalkModalOpen && <WalkModal onClose={() => setIsWalkModalOpen(false)} onSave={handleSaveWalk} />}
            
            <h2 className="text-3xl font-bold text-white mb-2">Bibliothèque d'entraînements</h2>
             {confirmationMsg && (
                <div className="bg-green-500/20 border border-green-500 text-green-300 px-4 py-3 rounded-lg relative my-4" role="alert">
                    <span className="block sm:inline">{confirmationMsg}</span>
                </div>
            )}
            <p className="text-slate-400 mb-6">Trouvez une séance guidée ou enregistrez une marche.</p>
            
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
                <FilterButton level="Tous" />
                <FilterButton level="Débutant" />
                <FilterButton level="Intermédiaire" />
                <FilterButton level="Avancé" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWorkouts.map((workout, index) => (
                    <WorkoutCard key={index} workout={workout} onStart={handleStartWorkout}/>
                ))}
            </div>
        </div>
    );
};

export default Workouts;