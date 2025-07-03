import React, { useState, useEffect, useRef } from 'react';
import { UserData, DailyLog, MealLog, WorkoutLog, ProgressPoint } from '../types';
import Icon from './Icon';
import * as geminiService from '../services/geminiService';
import Spinner from './Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import MicButton from './MicButton';


interface DashboardProps {
  userData: UserData;
  onUpdateMetrics: (date: string, weight: number, waist: number) => void;
}

const StatCard: React.FC<{ icon: string; title: string; value: string; unit: string; color: string; }> = ({ icon, title, value, unit, color }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex items-center gap-4">
        <div className={`p-3 rounded-full ${color}`}>
            <Icon name={icon} className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-slate-400 text-sm font-medium">{title}</p>
            <p className="text-white text-2xl font-bold">
                {value} <span className="text-base font-normal text-slate-300">{unit}</span>
            </p>
        </div>
    </div>
);

const MetricsEntryCard: React.FC<{
    weightHistory: ProgressPoint[];
    waistHistory: ProgressPoint[];
    onUpdateMetrics: (date: string, weight: number, waist: number) => void;
}> = ({ weightHistory, waistHistory, onUpdateMetrics }) => {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
    const [weightInput, setWeightInput] = useState<number | string>('');
    const [waistInput, setWaistInput] = useState<number | string>('');
    const [isSaved, setIsSaved] = useState(false);
    
    const [activeField, setActiveField] = useState<string | null>(null);
    const { isListening, transcript, start, stop } = useSpeechRecognition();

    useEffect(() => {
        const weightForDate = weightHistory.find(p => p.date === selectedDate)?.value ?? '';
        const waistForDate = waistHistory.find(p => p.date === selectedDate)?.value ?? '';
        setWeightInput(weightForDate);
        setWaistInput(waistForDate);
    }, [selectedDate, weightHistory, waistHistory]);

    useEffect(() => {
        if (activeField && transcript) {
            if (activeField === 'weight') setWeightInput(transcript.replace(/[^0-9.]/g, ''));
            if (activeField === 'waist') setWaistInput(transcript.replace(/[^0-9.]/g, ''));
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

    const handleSave = () => {
        if (weightInput === '' || waistInput === '') return;
        onUpdateMetrics(selectedDate, Number(weightInput), Number(waistInput));
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const getMinDate = () => {
        const currentYear = new Date().getFullYear();
        return `${currentYear}-06-01`;
    };

    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-emerald-400 mb-3">Mise à jour des Mesures</h3>
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <label htmlFor="metric-date" className="text-sm font-medium text-slate-300 w-24">Date</label>
                    <input
                        id="metric-date"
                        type="date"
                        value={selectedDate}
                        min={getMinDate()}
                        max={today.toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500 [color-scheme:dark]"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="daily-weight" className="text-sm font-medium text-slate-300 w-24">Poids (kg)</label>
                    <div className="flex-grow flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
                        <input
                            id="daily-weight"
                            type="number"
                            placeholder="--"
                            value={weightInput}
                            onChange={(e) => setWeightInput(e.target.value)}
                            className="w-full bg-transparent p-2 text-white focus:outline-none"
                        />
                        <MicButton isListening={isListening && activeField === 'weight'} onClick={() => handleMicClick('weight')} />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <label htmlFor="daily-waist" className="text-sm font-medium text-slate-300 w-24">Taille (cm)</label>
                    <div className="flex-grow flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
                        <input
                            id="daily-waist"
                            type="number"
                            placeholder="--"
                            value={waistInput}
                            onChange={(e) => setWaistInput(e.target.value)}
                            className="w-full bg-transparent p-2 text-white focus:outline-none"
                        />
                         <MicButton isListening={isListening && activeField === 'waist'} onClick={() => handleMicClick('waist')} />
                    </div>
                </div>
                <button onClick={handleSave} disabled={isSaved || weightInput === '' || waistInput === ''} className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${isSaved ? 'bg-green-600' : 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-500 disabled:cursor-not-allowed'}`}>
                    {isSaved ? 'Enregistré !' : 'Mettre à Jour'}
                </button>
            </div>
        </div>
    );
};

const CalorieSummaryCard: React.FC<{ dailyLog: { meals: MealLog[]; workouts: WorkoutLog[] } | undefined }> = ({ dailyLog }) => {
    const caloriesIn = dailyLog?.meals.reduce((sum, meal) => sum + meal.analysis.totals.calories, 0) || 0;
    const caloriesOut = dailyLog?.workouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0) || 0;
    const netCalories = caloriesIn - caloriesOut;

    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-lg text-center">
             <h3 className="text-lg font-semibold text-emerald-400 mb-3">Bilan Calorique du Jour</h3>
             <div className="flex justify-around items-center">
                <div>
                    <p className="text-slate-400">Consommées</p>
                    <p className="text-2xl font-bold text-blue-400">{caloriesIn}</p>
                    <p className="text-xs text-slate-500">kcal</p>
                </div>
                 <span className="text-2xl text-slate-500">-</span>
                 <div>
                    <p className="text-slate-400">Brûlées</p>
                    <p className="text-2xl font-bold text-amber-400">{caloriesOut}</p>
                     <p className="text-xs text-slate-500">kcal</p>
                </div>
                 <span className="text-2xl text-slate-500">=</span>
                <div>
                    <p className="text-slate-400">Bilan Net</p>
                    <p className={`text-2xl font-bold ${netCalories > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{netCalories}</p>
                     <p className="text-xs text-slate-500">kcal</p>
                </div>
             </div>
        </div>
    )
}

const MealHistory: React.FC<{ dailyLog: DailyLog }> = ({ dailyLog }) => {
    const today = new Date().toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today);

    const logForSelectedDate = dailyLog[selectedDate];

    const calorieChartData: { date: string, calories: number }[] = [];
    if (logForSelectedDate && logForSelectedDate.meals.length > 0) {
        calorieChartData.push({
            date: new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
            calories: logForSelectedDate.meals.reduce((sum, meal) => sum + meal.analysis.totals.calories, 0),
        });
    }

    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-emerald-400 mb-4">Historique des Repas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <label htmlFor="history-date" className="block text-sm font-medium text-slate-300 mb-2">Sélectionner une date</label>
                    <input
                        id="history-date"
                        type="date"
                        value={selectedDate}
                        max={today}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500 [color-scheme:dark]"
                    />
                    <div className="mt-4 space-y-4">
                        {logForSelectedDate && logForSelectedDate.meals.length > 0 ? (
                            logForSelectedDate.meals.map(meal => (
                                <details key={meal.id} className="bg-slate-700/50 p-3 rounded-lg">
                                    <summary className="font-semibold text-white cursor-pointer">{meal.type}: <span className="font-normal">{meal.analysis.dishName} ({meal.analysis.totals.calories} kcal)</span></summary>
                                    <div className="mt-2 text-sm text-slate-300">
                                       <ul className="list-disc list-inside">
                                           {meal.analysis.items.map(item => <li key={item.name}>{item.name}: {item.calories} kcal</li>)}
                                       </ul>
                                    </div>
                                </details>
                            ))
                        ) : (
                            <p className="text-slate-400 text-center mt-4">Aucun repas enregistré pour cette date.</p>
                        )}
                    </div>
                </div>
                <div className="md:col-span-2">
                     <h4 className="text-md font-semibold text-white mb-2 text-center">Évolution des Calories</h4>
                    <div className="h-64">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={calorieChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                <XAxis dataKey="date" stroke="rgb(156 163 175)" fontSize={12} />
                                <YAxis stroke="rgb(156 163 175)" fontSize={12} domain={[0, 'dataMax + 50']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgb(51 65 85)'}}
                                    labelStyle={{ color: 'rgb(156 163 175)' }}
                                />
                                <Bar dataKey="calories" fill="rgb(96 165 250)" name="Calories" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

const Dashboard: React.FC<DashboardProps> = ({ userData, onUpdateMetrics }) => {
  const [motivation, setMotivation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysLog = userData.dailyLog[todayStr];

  useEffect(() => {
    const fetchMotivation = async () => {
      setLoading(true);
      const message = await geminiService.getMotivationalMessage(userData.aiSystemInstruction || '');
      setMotivation(message);
      setLoading(false);
    };
    fetchMotivation();
  }, [userData.aiSystemInstruction]);

  const currentWeight = userData.weightHistory.length > 0 ? userData.weightHistory[userData.weightHistory.length - 1].value : 0;
  const currentWaist = userData.waistHistory.length > 0 ? userData.waistHistory[userData.waistHistory.length - 1].value : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-3xl font-bold text-white">Bon retour, {userData.name} !</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon="weight" title="Poids Actuel" value={String(currentWeight) || '--'} unit="kg" color="bg-emerald-500" />
          <StatCard icon="target" title="Objectif Poids" value={userData.weightGoalKg ? String(userData.weightGoalKg) : '--'} unit="kg" color="bg-blue-500" />
          <StatCard icon="waist" title="Tour de Taille" value={String(currentWaist) || '--'} unit="cm" color="bg-amber-500" />
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MetricsEntryCard weightHistory={userData.weightHistory} waistHistory={userData.waistHistory} onUpdateMetrics={onUpdateMetrics} />
            <CalorieSummaryCard dailyLog={todaysLog} />
          </div>
          <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex flex-col justify-center items-center text-center">
            <h3 className="text-lg font-semibold text-emerald-400 mb-4">Message du Jour</h3>
            {loading ? <Spinner /> : (
                <p className="text-slate-300 italic">"{motivation}"</p>
            )}
        </div>
      </div>
      
      <MealHistory dailyLog={userData.dailyLog} />

    </div>
  );
};

export default Dashboard;
