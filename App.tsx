import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Nutrition from './components/Nutrition';
import Workouts from './components/Workouts';
import Progress from './components/Progress';
import Profile from './components/Profile';
import Products from './components/Products';
import { View, UserData, MealLog, WorkoutLog, DailyLog, CustomProduct } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  const [userData, setUserData] = useState<UserData>(() => {
    try {
      const savedData = localStorage.getItem('fitTrackUserData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Ensure customProducts and productsInStock exist
        if (!parsedData.customProducts) {
          parsedData.customProducts = [];
        }
        if (!parsedData.productsInStock) {
          parsedData.productsInStock = [];
        }
        return parsedData;
      }
    } catch (error) {
      console.error("Impossible de charger les données utilisateur depuis localStorage", error);
    }
    return {
      name: 'Jaime',
      heightCm: 172,
      weightGoalKg: undefined,
      age: undefined,
      aiSystemInstruction: "En tant que coach IA, privilégie une approche bienveillante et scientifique. Encourage la consommation d'aliments complets et non transformés, et recommande des exercices fonctionnels adaptés à l'âge et aux objectifs de l'utilisateur.",
      customProducts: [],
      productsInStock: [],
      weightHistory: [],
      waistHistory: [],
      dailyLog: {},
    };
  });

  // Gérer l'état d'intégration. Si l'âge n'est pas défini, forcer la vue du profil.
  useEffect(() => {
    if (!userData.age) {
        setCurrentView('profile');
    }
  }, [userData.age]);
  
  // Sauvegarder les données utilisateur dans localStorage à chaque modification
  useEffect(() => {
    try {
        localStorage.setItem('fitTrackUserData', JSON.stringify(userData));
    } catch (error) {
        console.error("Impossible de sauvegarder les données utilisateur dans localStorage", error);
    }
  }, [userData]);


  const handleUpdateProfile = useCallback((newProfileData: Partial<UserData>) => {
    setUserData(prevData => ({ ...prevData, ...newProfileData }));
    setCurrentView('dashboard'); // Renvoyer au tableau de bord après la mise à jour
  }, []);

  const handleUpdateMetrics = useCallback((date: string, weight: number, waist: number) => {
    setUserData(prevData => {
        const newWeightHistory = [...prevData.weightHistory];
        const weightIndex = newWeightHistory.findIndex(p => p.date === date);
        if (weightIndex > -1) {
            newWeightHistory[weightIndex] = { ...newWeightHistory[weightIndex], value: weight };
        } else {
            newWeightHistory.push({ date, value: weight });
            newWeightHistory.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        const newWaistHistory = [...prevData.waistHistory];
        const waistIndex = newWaistHistory.findIndex(p => p.date === date);
         if (waistIndex > -1) {
            newWaistHistory[waistIndex] = { ...newWaistHistory[waistIndex], value: waist };
        } else {
            newWaistHistory.push({ date, value: waist });
            newWaistHistory.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }

        return {
            ...prevData,
            weightHistory: newWeightHistory,
            waistHistory: newWaistHistory,
        }
    })
  }, []);

  const handleLogMeal = useCallback((mealLog: MealLog) => {
      const date = new Date().toISOString().split('T')[0];
      setUserData(prevData => {
          const newDailyLog: DailyLog = JSON.parse(JSON.stringify(prevData.dailyLog));
          if (!newDailyLog[date]) {
              newDailyLog[date] = { meals: [], workouts: [] };
          }
          newDailyLog[date].meals.push(mealLog);
          return { ...prevData, dailyLog: newDailyLog };
      });
  }, []);
  
  const handleLogWorkout = useCallback((workoutLog: WorkoutLog) => {
      const date = new Date().toISOString().split('T')[0];
      setUserData(prevData => {
          const newDailyLog: DailyLog = JSON.parse(JSON.stringify(prevData.dailyLog));
           if (!newDailyLog[date]) {
              newDailyLog[date] = { meals: [], workouts: [] };
          }
          newDailyLog[date].workouts.push(workoutLog);
          return { ...prevData, dailyLog: newDailyLog };
      })
  }, []);
  
  const handleAddProduct = useCallback((product: CustomProduct) => {
    setUserData(prev => ({
      ...prev,
      customProducts: [...prev.customProducts, product]
    }));
  }, []);

  const handleDeleteProduct = useCallback((productId: string) => {
    setUserData(prev => ({
      ...prev,
      customProducts: prev.customProducts.filter(p => p.id !== productId)
    }));
  }, []);

  const handleAddStockItem = useCallback((item: string) => {
    if (!item.trim() || userData.productsInStock.includes(item.trim())) return;
    setUserData(prev => ({
      ...prev,
      productsInStock: [...prev.productsInStock, item.trim()].sort()
    }));
  }, [userData.productsInStock]);

  const handleDeleteStockItem = useCallback((itemToDelete: string) => {
    setUserData(prev => ({
      ...prev,
      productsInStock: prev.productsInStock.filter(item => item !== itemToDelete)
    }));
  }, []);


  const renderView = () => {
    if (!userData.age && currentView !== 'profile') {
        return <Profile userData={userData} onSave={handleUpdateProfile} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard userData={userData} onUpdateMetrics={handleUpdateMetrics} />;
      case 'nutrition':
        return <Nutrition onLogMeal={handleLogMeal} userData={userData} />;
      case 'products':
        return <Products 
                  products={userData.customProducts} 
                  productsInStock={userData.productsInStock}
                  onAddProduct={handleAddProduct} 
                  onDeleteProduct={handleDeleteProduct}
                  onAddStockItem={handleAddStockItem}
                  onDeleteStockItem={handleDeleteStockItem}
                />;
      case 'workouts':
        return <Workouts onLogWorkout={handleLogWorkout} />;
      case 'progress':
        return <Progress userData={userData} />;
      case 'profile':
        return <Profile userData={userData} onSave={handleUpdateProfile} />;
      default:
        return <Dashboard userData={userData} onUpdateMetrics={handleUpdateMetrics} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header currentView={currentView} onNavigate={setCurrentView} />
      <main className="container mx-auto px-0 md:px-4 pb-20 md:pb-4">
        {renderView()}
      </main>
    </div>
  );
};

export default App;