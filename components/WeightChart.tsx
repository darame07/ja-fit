import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ProgressPoint } from '../types';

interface WeightChartProps {
  data: ProgressPoint[];
}

const WeightChart: React.FC<WeightChartProps> = ({ data }) => {
  const formattedData = data.map(p => ({
    ...p,
    date: new Date(p.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
          <XAxis dataKey="date" stroke="rgb(156 163 175)" fontSize={12} />
          <YAxis stroke="rgb(156 163 175)" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']}/>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              borderColor: 'rgb(51 65 85)',
              color: 'rgb(226, 232, 240)',
            }}
            labelStyle={{ color: 'rgb(156 163 175)' }}
          />
          <Line type="monotone" dataKey="value" stroke="rgb(52 211 153)" strokeWidth={2} dot={{ r: 4, fill: 'rgb(52 211 153)' }} activeDot={{ r: 8 }} name="Poids (kg)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default WeightChart;