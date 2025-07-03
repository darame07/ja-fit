import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserData } from '../types';

interface ProgressChartsProps {
  userData: UserData;
}

const ProgressCharts: React.FC<ProgressChartsProps> = ({ userData }) => {
  const calculateBMI = (weightKg: number, heightCm: number): number => {
    if (heightCm === 0) return 0;
    const heightM = heightCm / 100;
    return parseFloat((weightKg / (heightM * heightM)).toFixed(1));
  };

  const formattedData = userData.weightHistory.map((weightPoint, index) => {
    const waistPoint = userData.waistHistory[index] || { value: 0 };
    return {
      date: new Date(weightPoint.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
      Poids: weightPoint.value,
      Taille: waistPoint.value,
      IMC: calculateBMI(weightPoint.value, userData.heightCm),
    };
  });

  const ChartWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold text-emerald-400 mb-4">{title}</h3>
      <div className="h-72">
        {children}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ChartWrapper title="Poids (kg)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="date" stroke="rgb(156 163 175)" fontSize={12} />
            <YAxis stroke="rgb(156 163 175)" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgb(51 65 85)' }} />
            <Legend />
            <Line type="monotone" dataKey="Poids" stroke="#34d399" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <ChartWrapper title="Tour de taille (cm)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis dataKey="date" stroke="rgb(156 163 175)" fontSize={12} />
            <YAxis stroke="rgb(156 163 175)" fontSize={12} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgb(51 65 85)' }} />
            <Legend />
            <Line type="monotone" dataKey="Taille" stroke="#fbbf24" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div className="md:col-span-2">
        <ChartWrapper title="Indice de Masse Corporelle (IMC)">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgb(156 163 175)" fontSize={12} />
              <YAxis stroke="rgb(156 163 175)" fontSize={12} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.9)', borderColor: 'rgb(51 65 85)' }} />
              <Legend />
              <Line type="monotone" dataKey="IMC" stroke="#60a5fa" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>
    </div>
  );
};

export default ProgressCharts;