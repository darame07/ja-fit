import React from 'react';
import { View } from '../types';
import Icon from './Icon';

interface HeaderProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const navItems: { id: View; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { id: 'nutrition', label: 'Nutrition', icon: 'nutrition' },
    { id: 'products', label: 'Produits', icon: 'box' },
    { id: 'workouts', label: 'Entraînements', icon: 'workouts' },
    { id: 'progress', label: 'Progrès', icon: 'progress' },
    { id: 'profile', label: 'Profil', icon: 'user' },
  ];

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 shadow-md shadow-slate-950/20">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <svg className="w-8 h-8 text-emerald-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.42 20.9202L12 17.5002L8.58 20.9202C7.81 21.6902 6.54 21.1602 6.54 20.1202V15.7702C6.54 15.2202 6.1 14.7802 5.55 14.7802H4.44C3.34 14.7802 2.76 13.5602 3.4 12.7802L9.77 5.27016C10.96 3.87016 13.04 3.87016 14.23 5.27016L20.6 12.7802C21.24 13.5602 20.66 14.7802 19.56 14.7802H18.45C17.9 14.7802 17.46 15.2202 17.46 15.7702V20.1202C17.46 21.1602 16.19 21.6902 15.42 20.9202Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            <h1 className="text-2xl font-bold text-white tracking-tight">JA'FIT</h1>
        </div>
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2 ${
                currentView === item.id
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex justify-around">
         {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center p-2 w-full transition-colors duration-200 ${
                currentView === item.id ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5 mb-1" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
      </div>
    </header>
  );
};

export default Header;