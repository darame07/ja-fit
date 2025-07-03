import React, { useState, useCallback, useEffect, useRef } from 'react';
import Icon from './Icon';
import Spinner from './Spinner';
import * as geminiService from '../services/geminiService';
import { MealAnalysis, Recipe, MealType, MealLog, CustomProduct, UserData, FullDayMenu, GeneratedMeal, DetailedIngredient } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import MicButton from './MicButton';

type NutritionTab = 'analyze' | 'manual' | 'recipes' | 'ideas' | 'menu-creator';

interface NutritionProps {
    onLogMeal: (mealLog: MealLog) => void;
    userData: UserData;
}

// Fonction utilitaire pour garantir que les données du menu sont mathématiquement correctes
const sanitizeMenuData = (menu: FullDayMenu): FullDayMenu => {
    const sanitizedMenu: FullDayMenu = JSON.parse(JSON.stringify(menu));

    // 1. Assainir les totaux de chaque repas en se basant sur ses ingrédients
    Object.values(sanitizedMenu.meals).forEach(meal => {
        if (meal && meal.ingredients) {
            const mealTotals = meal.ingredients.reduce((acc, ing) => {
                acc.calories += Number(ing.calories) || 0;
                acc.protein += Number(ing.protein) || 0;
                acc.carbs += Number(ing.carbs) || 0;
                acc.fat += Number(ing.fat) || 0;
                return acc;
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
            meal.totals = mealTotals;
        }
    });

    // 2. Assainir les totaux journaliers en se basant sur les totaux de repas maintenant corrects
    const dailyTotals = Object.values(sanitizedMenu.meals).reduce((acc, meal) => {
        if (meal && meal.totals) {
            acc.calories += Number(meal.totals.calories) || 0;
            acc.protein += Number(meal.totals.protein) || 0;
            acc.carbs += Number(meal.totals.carbs) || 0;
            acc.fat += Number(meal.totals.fat) || 0;
        }
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    sanitizedMenu.dailyTotals = dailyTotals;

    return sanitizedMenu;
};


const Nutrition: React.FC<NutritionProps> = ({ onLogMeal, userData }) => {
  const [activeTab, setActiveTab] = useState<NutritionTab>('analyze');

  const TabButton: React.FC<{ tabId: NutritionTab; label: string; iconName: string; }> = ({ tabId, label, iconName }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-2 ${
        activeTab === tabId
          ? 'border-emerald-400 text-emerald-400'
          : 'border-transparent text-slate-400 hover:text-white'
      }`}
    >
      <Icon name={iconName} className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-3xl font-bold text-white mb-6">Pôle Nutrition</h2>
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-2 md:space-x-4 overflow-x-auto">
          <TabButton tabId="analyze" label="Analyse Photo" iconName="camera" />
          <TabButton tabId="manual" label="Saisie Manuelle" iconName="nutrition" />
          <TabButton tabId="recipes" label="Recettes" iconName="recipe" />
          <TabButton tabId="menu-creator" label="Créateur de Menus" iconName="clipboard-list" />
          <TabButton tabId="ideas" label="Idées Repas" iconName="sparkles" />
        </nav>
      </div>
      <div className="mt-6">
        {activeTab === 'analyze' && <PhotoAnalysis onLogMeal={onLogMeal} systemInstruction={userData.aiSystemInstruction || ''} customProducts={userData.customProducts} />}
        {activeTab === 'recipes' && <RecipeFinder onLogMeal={onLogMeal} systemInstruction={userData.aiSystemInstruction || ''} />}
        {activeTab === 'manual' && <ManualEntry onLogMeal={onLogMeal} systemInstruction={userData.aiSystemInstruction || ''} customProducts={userData.customProducts} />}
        {activeTab === 'menu-creator' && <MenuCreator userData={userData} />}
        {activeTab === 'ideas' && <MealIdeaGenerator onLogMeal={onLogMeal} userData={userData} />}
      </div>
    </div>
  );
};

const AnalysisResult: React.FC<{ analysis: MealAnalysis, onLogMeal: (analysis: MealAnalysis, type: MealType) => void, isSuggestion?: boolean }> = ({ analysis: initialAnalysis, onLogMeal, isSuggestion = false }) => {
    const [mealType, setMealType] = useState<MealType>('Déjeuner');
    const [currentAnalysis, setCurrentAnalysis] = useState<MealAnalysis>(initialAnalysis);

    useEffect(() => {
        // Copie profonde pour empêcher la mutation de l'objet d'analyse original de l'état parent
        setCurrentAnalysis(JSON.parse(JSON.stringify(initialAnalysis)));
    }, [initialAnalysis]);
    
    const handleRemoveItem = (indexToRemove: number) => {
        const newItems = currentAnalysis.items.filter((_, index) => index !== indexToRemove);
        
        const newTotals = newItems.reduce((acc, item) => ({
            calories: acc.calories + (Number(item.calories) || 0),
            protein: acc.protein + (Number(item.protein) || 0),
            carbs: acc.carbs + (Number(item.carbs) || 0),
            fat: acc.fat + (Number(item.fat) || 0),
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        setCurrentAnalysis({
            ...currentAnalysis,
            items: newItems,
            totals: newTotals,
        });
    };

    return (
      <div className="space-y-3 bg-slate-700/50 p-4 rounded-lg">
        <h5 className="text-xl font-bold text-emerald-300">{currentAnalysis.dishName}</h5>
        <p className="text-sm text-slate-400 italic">{currentAnalysis.reasoning}</p>
        
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-300 uppercase bg-slate-800/50">
                    <tr>
                        <th className="px-4 py-2">Composant</th>
                        <th className="px-4 py-2 text-right">Calories</th>
                        <th className="px-4 py-2 text-right">Protéines (g)</th>
                        <th className="px-4 py-2 text-right">Glucides (g)</th>
                        <th className="px-4 py-2 text-right">Lipides (g)</th>
                        <th className="px-2 py-2"></th>
                    </tr>
                </thead>
                <tbody>
                    {currentAnalysis.items.map((item, index) => (
                        <tr key={index} className="border-b border-slate-700">
                            <td className="px-4 py-2 font-medium text-white">{item.name}</td>
                            <td className="px-4 py-2 text-right">{Math.round(item.calories)}</td>
                            <td className="px-4 py-2 text-right">{item.protein.toFixed(1)}</td>
                            <td className="px-4 py-2 text-right">{item.carbs.toFixed(1)}</td>
                            <td className="px-4 py-2 text-right">{item.fat.toFixed(1)}</td>
                            <td className="px-2 py-2 text-right">
                               <button onClick={() => handleRemoveItem(index)} title="Supprimer cet ingrédient" className="p-1 rounded-full text-red-400 hover:text-white hover:bg-red-500/50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold text-white bg-slate-800/50">
                        <td className="px-4 py-2">Total</td>
                        <td className="px-4 py-2 text-right">{Math.round(currentAnalysis.totals.calories)}</td>
                        <td className="px-4 py-2 text-right">{currentAnalysis.totals.protein.toFixed(1)}</td>
                        <td className="px-4 py-2 text-right">{currentAnalysis.totals.carbs.toFixed(1)}</td>
                        <td className="px-4 py-2 text-right">{currentAnalysis.totals.fat.toFixed(1)}</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <div className="flex items-center gap-2 pt-4">
            {isSuggestion && (
                <p className="text-xs text-slate-400 flex-grow">Enregistrez cette suggestion pour l'ajouter à votre journal.</p>
            )}
            <select value={mealType} onChange={e => setMealType(e.target.value as MealType)} className="bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500">
                <option>Petit-déjeuner</option>
                <option>Déjeuner</option>
                <option>Dîner</option>
                <option>Entrée</option>
                <option>Plat Principal</option>
                <option>Dessert</option>
                <option>Collation</option>
            </select>
            <button onClick={() => onLogMeal(currentAnalysis, mealType)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                Enregistrer
            </button>
        </div>
      </div>
    );
};


const PhotoAnalysis: React.FC<{ onLogMeal: (mealLog: MealLog) => void, systemInstruction: string, customProducts: CustomProduct[] }> = ({ onLogMeal, systemInstruction, customProducts }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userComments, setUserComments] = useState('');
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);

  const { isListening, transcript, start, stop } = useSpeechRecognition();
  useEffect(() => {
      if (transcript) setUserComments(transcript);
  }, [transcript]);

  const handleMicClick = () => {
      if (isListening) stop();
      else start();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
     // Réinitialiser la valeur pour que l'événement onChange se déclenche même si le même fichier est sélectionné
    if(event.target) {
        event.target.value = '';
    }
  };
  
  const handleAnalyze = async () => {
    if (!imagePreview) return;
    
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const base64Image = imagePreview.split(',')[1];
    const result = await geminiService.analyzeMealImage(base64Image, userComments, systemInstruction, customProducts);
    
    if (result) {
      setAnalysis(result);
    } else {
      setError("Impossible d'analyser l'image. Veuillez en essayer une autre ou vérifier le format de la réponse de l'IA.");
    }
    setIsLoading(false);
  };

  const handleLog = (analysisToLog: MealAnalysis, type: MealType) => {
      if (!analysisToLog) return;
      onLogMeal({ id: Date.now().toString(), type, analysis: analysisToLog });
      setAnalysis(null);
      setImagePreview(null);
      setUserComments('');
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-emerald-400 mb-4">Analyser un repas depuis une photo</h3>
       <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Téléchargez ou prenez une photo de votre repas :</label>
            <div className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md min-h-[240px]">
             {imagePreview ? (
                 <img src={imagePreview} alt="Aperçu du repas" className="mx-auto h-48 w-auto rounded-md object-contain" />
              ) : (
                <div className="space-y-4 text-center">
                    <Icon name="camera" className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 w-full sm:w-auto"
                        >
                          Prendre une Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-slate-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600 w-full sm:w-auto"
                        >
                          Choisir de la Galerie
                        </button>
                    </div>
                    <p className="text-xs text-slate-500">PNG, JPG, GIF jusqu'à 10Mo</p>
                    <input
                        ref={cameraInputRef}
                        type="file"
                        name="camera-photo"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={handleImageChange}
                    />
                    <input
                        ref={fileInputRef}
                        type="file"
                        name="gallery-photo"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                    />
                </div>
              )}
          </div>
          {imagePreview && (
             <div className="mt-4">
                <label htmlFor="user-comments" className="block text-sm font-medium text-slate-300">Commentaires pour l'IA (optionnel)</label>
                 <div className="mt-1 flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
                    <input
                        type="text"
                        id="user-comments"
                        value={userComments}
                        onChange={(e) => setUserComments(e.target.value)}
                        placeholder="Ex : poivrons sans huile, sauce à part..."
                        className="w-full bg-transparent p-2 text-white focus:outline-none"
                    />
                     <MicButton isListening={isListening} onClick={handleMicClick} />
                </div>
             </div>
          )}
          {imagePreview && !analysis && (
            <button onClick={handleAnalyze} disabled={isLoading} className="mt-4 w-full bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isLoading ? <><Spinner/> Analyse en cours...</> : "Analyser le Repas"}
            </button>
          )}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-white mb-2">Résultat de l'analyse</h4>
          {isLoading && <div className="flex justify-center items-center h-full"><Spinner/></div>}
          {error && <p className="text-red-400">{error}</p>}
          {analysis && <AnalysisResult analysis={analysis} onLogMeal={handleLog} />}
        </div>
      </div>
    </div>
  );
};

const RecipeFinder: React.FC<{onLogMeal: (mealLog: MealLog) => void, systemInstruction: string }> = ({ onLogMeal, systemInstruction }) => {
    const [query, setQuery] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [goal, setGoal] = useState('Perte de poids');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const [activeField, setActiveField] = useState<string | null>(null);
    const { isListening, transcript, start, stop } = useSpeechRecognition();

    useEffect(() => {
        if (!activeField) return;
        if (activeField === 'query') setQuery(transcript);
        if (activeField === 'ingredients') setIngredients(transcript);
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

    const handleSearch = useCallback(async () => {
        setIsLoading(true);
        setSearched(true);
        const results = await geminiService.findRecipes(query, { goal }, ingredients, systemInstruction);
        setRecipes(results);
        setIsLoading(false);
    }, [query, goal, ingredients, systemInstruction]);

    const handleLogRecipe = (recipe: Recipe, mealType: MealType) => {
        // No more API call, just use the analysis already in the recipe object
        onLogMeal({ id: Date.now().toString(), type: mealType, analysis: recipe.analysis });
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-emerald-400 mb-4">Trouver des recettes approuvées</h3>
            <div className="bg-slate-700/50 p-4 rounded-lg flex flex-col gap-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="recipe-query" className="block text-sm font-medium text-slate-300 mb-1">De quoi avez-vous envie ?</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
                            <input type="text" id="recipe-query" value={query} onChange={e => setQuery(e.target.value)} placeholder="ex: 'salade de poulet riche en protéines'" className="w-full bg-transparent p-2 text-white focus:outline-none" />
                            <MicButton isListening={isListening && activeField === 'query'} onClick={() => handleMicClick('query')} />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="recipe-ingredients" className="block text-sm font-medium text-slate-300 mb-1">Ingrédients disponibles</label>
                        <div className="flex items-center gap-2 bg-slate-800 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
                            <input type="text" id="recipe-ingredients" value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="ex: 'poulet, riz, brocoli'" className="w-full bg-transparent p-2 text-white focus:outline-none" />
                            <MicButton isListening={isListening && activeField === 'ingredients'} onClick={() => handleMicClick('ingredients')} />
                        </div>
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label htmlFor="goal" className="block text-sm font-medium text-slate-300 mb-1">Objectif</label>
                        <select name="goal" id="goal" value={goal} onChange={e => setGoal(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500">
                            <option>Perte de poids</option>
                            <option>Maintien</option>
                            <option>Prise de masse</option>
                        </select>
                    </div>
                    <button onClick={handleSearch} disabled={isLoading} className="w-full md:col-span-2 bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:bg-slate-600 flex items-center justify-center gap-2">
                        {isLoading ? <Spinner /> : "Trouver des Recettes"}
                    </button>
                 </div>
            </div>

            <div className="mt-6">
                {isLoading ? <div className="flex justify-center"><Spinner /></div> : (
                    recipes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recipes.map((recipe, index) => (
                                <RecipeCard key={index} recipe={recipe} onLog={handleLogRecipe} />
                            ))}
                        </div>
                    ) : (
                        searched && <p className="text-center text-slate-400">Aucune recette ne correspond à vos critères. Essayez une recherche plus générale.</p>
                    )
                )}
            </div>
        </div>
    );
};

const RecipeCard: React.FC<{recipe: Recipe, onLog: (recipe: Recipe, mealType: MealType) => void}> = ({ recipe, onLog }) => {
    const [mealType, setMealType] = useState<MealType>('Plat Principal');

    return (
        <div className="bg-slate-700 p-4 rounded-lg flex flex-col">
            <h4 className="text-lg font-bold text-emerald-300">{recipe.name}</h4>
            <p className="text-sm text-slate-400 mb-2 flex-grow">Idéal pour : {recipe.goalFit}</p>
            <div className="flex items-center gap-4 text-sm text-slate-300 mb-3">
                <span className="flex items-center gap-1"><Icon name="flame" className="w-4 h-4"/>{Math.round(recipe.analysis.totals.calories)} kcal</span>
                <span className="flex items-center gap-1"><Icon name="clock" className="w-4 h-4"/>{recipe.prepTimeMinutes} min</span>
            </div>
            <details className="text-sm mt-auto pt-2 group">
                <summary className="cursor-pointer text-emerald-400 font-medium">Voir les détails</summary>
                <div className="mt-2 space-y-3 opacity-0 group-open:opacity-100 transition-opacity duration-300">
                    <div>
                        <h5 className="font-semibold text-slate-200">Ingrédients:</h5>
                        <ul className="list-disc list-inside text-slate-300">
                            {recipe.analysis.items.map((item, i) => <li key={i}>{item.name}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-semibold text-slate-200">Instructions:</h5>
                        <ol className="list-decimal list-inside text-slate-300 space-y-1">
                            {recipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>
                     <div className="flex items-center gap-2 pt-2 border-t border-slate-600/50">
                        <select value={mealType} onChange={e => setMealType(e.target.value as MealType)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500">
                           <option>Petit-déjeuner</option>
                           <option>Déjeuner</option>
                           <option>Dîner</option>
                           <option>Entrée</option>
                           <option>Plat Principal</option>
                           <option>Dessert</option>
                           <option>Collation</option>
                        </select>
                        <button onClick={() => onLog(recipe, mealType)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 whitespace-nowrap">
                            Enregistrer
                        </button>
                    </div>
                </div>
            </details>
        </div>
    );
};

const ManualEntry: React.FC<{ onLogMeal: (mealLog: MealLog) => void, systemInstruction: string, customProducts: CustomProduct[] }> = ({ onLogMeal, systemInstruction, customProducts }) => {
    const [mealInput, setMealInput] = useState('');
    const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { isListening, transcript, start, stop } = useSpeechRecognition();
    useEffect(() => {
        if (transcript) setMealInput(transcript);
    }, [transcript]);

    const handleMicClick = () => {
        if (isListening) stop();
        else start();
    };

    const handleAnalyze = async () => {
        if (!mealInput.trim()) return;
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        const result = await geminiService.analyzeManualMeal(mealInput, systemInstruction, customProducts);
        if (result) {
            setAnalysis(result);
        } else {
            setError("L'analyse a échoué. Veuillez vérifier votre saisie ou réessayer.");
        }
        setIsLoading(false);
    };
    
    const handleLog = (analysisToLog: MealAnalysis, type: MealType) => {
        if (!analysisToLog) return;
        onLogMeal({ id: Date.now().toString(), type, analysis: analysisToLog });
        setAnalysis(null);
        setMealInput('');
    }

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-emerald-400 mb-4">Enregistrer un repas manuellement</h3>
            <div className="space-y-4">
                <div>
                    <label htmlFor="meal-description" className="block text-sm font-medium text-slate-300">
                        Décrivez votre repas
                    </label>
                    <p className="text-xs text-slate-400 mb-1">Astuce : L'IA reconnaîtra les produits de votre bibliothèque.</p>
                    <div className="mt-1 flex items-start gap-2 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-emerald-500">
                        <textarea
                            id="meal-description"
                            rows={3}
                            value={mealInput}
                            onChange={(e) => setMealInput(e.target.value)}
                            placeholder="Exemple : Yaourt au skyr, 200g de haricots verts vapeur, 1 banane"
                            className="w-full bg-transparent py-2 px-3 text-white focus:outline-none resize-none"
                        />
                        <MicButton isListening={isListening} onClick={handleMicClick} />
                    </div>
                </div>
                {!analysis && (
                     <button onClick={handleAnalyze} disabled={isLoading || !mealInput.trim()} className="w-full bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isLoading ? <><Spinner /> Analyse en cours...</> : 'Analyser le Repas'}
                    </button>
                )}

                {isLoading && <div className="flex justify-center"><Spinner /></div>}
                {error && <p className="text-red-400 text-center">{error}</p>}
                
                {analysis && <AnalysisResult analysis={analysis} onLogMeal={handleLog} />}
            </div>
        </div>
    );
};

const MenuCreator: React.FC<{ userData: UserData }> = ({ userData }) => {
    const [menu, setMenu] = useState<FullDayMenu | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setMenu(null);
        const result = await geminiService.generateMenuFromStock(userData);
        if (result) {
            const sanitizedResult = sanitizeMenuData(result);
            setMenu(sanitizedResult);
        } else {
            setError("Impossible de générer un menu. Vérifiez que votre stock et votre bibliothèque ne sont pas vides, ou réessayez.");
        }
        setIsLoading(false);
    };

    const handleRemoveIngredient = (mealType: keyof FullDayMenu['meals'], ingredientIndex: number) => {
        if (!menu || !menu.meals[mealType]) return;

        // Copie profonde pour éviter la mutation directe de l'état
        const newMenu: FullDayMenu = JSON.parse(JSON.stringify(menu));
        const meal = newMenu.meals[mealType];
        
        if (meal) {
            // Supprimer l'ingrédient
            meal.ingredients.splice(ingredientIndex, 1);

            // Recalculer les totaux du repas
            const newMealTotals = meal.ingredients.reduce((acc, ing) => {
                acc.calories += Number(ing.calories) || 0;
                acc.protein += Number(ing.protein) || 0;
                acc.carbs += Number(ing.carbs) || 0;
                acc.fat += Number(ing.fat) || 0;
                return acc;
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
            meal.totals = newMealTotals;

            // Recalculer les totaux journaliers
            const newDailyTotals = Object.values(newMenu.meals).reduce((acc, currentMeal) => {
                if(currentMeal) {
                    acc.calories += Number(currentMeal.totals.calories) || 0;
                    acc.protein += Number(currentMeal.totals.protein) || 0;
                    acc.carbs += Number(currentMeal.totals.carbs) || 0;
                    acc.fat += Number(currentMeal.totals.fat) || 0;
                }
                return acc;
            }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
            newMenu.dailyTotals = newDailyTotals;

            setMenu(newMenu);
        }
    };
    
    const canGenerate = userData.customProducts.length > 0 || userData.productsInStock.length > 0;

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-emerald-400 mb-2">Créateur de Menus Personnalisés</h3>
            <p className="text-slate-400 mb-4 text-sm">Générez un plan de repas équilibré pour une journée, en utilisant <strong className="text-slate-300">uniquement</strong> les produits de votre bibliothèque et de votre stock.</p>
            
            <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                 <button 
                    onClick={handleGenerate} 
                    disabled={isLoading || !canGenerate} 
                    className="w-full md:w-auto bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                >
                    {isLoading ? <><Spinner /> Génération en cours...</> : "Générer mon menu"}
                </button>
                {!canGenerate && <p className="text-amber-400 text-xs mt-2">Veuillez ajouter des produits à votre stock ou bibliothèque pour utiliser cette fonction.</p>}
            </div>

            {isLoading && <div className="flex justify-center mt-6"><Spinner /></div>}
            {error && <p className="text-red-400 text-center mt-6">{error}</p>}
            
            {menu && (
                <div className="mt-6 space-y-4">
                    <DailyTotalsCard totals={menu.dailyTotals} />
                    {(Object.keys(menu.meals) as Array<keyof FullDayMenu['meals']>).map((mealType) => {
                        const mealData = menu.meals[mealType];
                        if (!mealData || mealData.ingredients.length === 0) return null;

                        return (
                           <GeneratedMealCard 
                                key={mealType} 
                                mealType={mealType} 
                                mealData={mealData}
                                onRemoveIngredient={(index) => handleRemoveIngredient(mealType, index)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const DailyTotalsCard: React.FC<{totals: FullDayMenu['dailyTotals']}> = ({ totals }) => (
    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
        <h4 className="text-lg font-bold text-center text-emerald-300 mb-3">Bilan de la Journée</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
                <p className="text-sm text-slate-400">Calories</p>
                <p className="text-xl font-bold text-white">{Math.round(totals.calories)} kcal</p>
            </div>
             <div>
                <p className="text-sm text-slate-400">Protéines</p>
                <p className="text-xl font-bold text-white">{totals.protein.toFixed(1)} g</p>
            </div>
             <div>
                <p className="text-sm text-slate-400">Glucides</p>
                <p className="text-xl font-bold text-white">{totals.carbs.toFixed(1)} g</p>
            </div>
             <div>
                <p className="text-sm text-slate-400">Lipides</p>
                <p className="text-xl font-bold text-white">{totals.fat.toFixed(1)} g</p>
            </div>
        </div>
    </div>
);

const GeneratedMealCard: React.FC<{mealType: string, mealData: GeneratedMeal, onRemoveIngredient: (index: number) => void}> = ({ mealType, mealData, onRemoveIngredient}) => {
    return (
        <div className="bg-slate-700/50 p-4 rounded-lg">
           <div className="flex justify-between items-start">
                <div>
                   <h4 className="text-lg font-bold text-emerald-300">{mealType}</h4>
                   <p className="font-semibold text-white -mt-1">{mealData.name}</p>
                </div>
                <div className="text-right text-xs bg-slate-800/60 p-2 rounded-md">
                    <p><strong className="font-semibold text-white">{Math.round(mealData.totals.calories)}</strong> <span className="text-slate-400">kcal</span></p>
                    <p><strong className="font-semibold text-white">{mealData.totals.protein.toFixed(1)}</strong> <span className="text-slate-400">g Prot</span></p>
                </div>
           </div>
           
           <div className="mt-3 space-y-2">
               {mealData.ingredients.map((ing, i) => (
                   <IngredientRow key={i} ingredient={ing} onRemove={() => onRemoveIngredient(i)} />
               ))}
           </div>
        </div>
    )
}

const IngredientRow: React.FC<{ingredient: DetailedIngredient, onRemove: () => void}> = ({ ingredient, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <details className="bg-slate-600/50 rounded-md text-sm group" onToggle={(e) => setIsExpanded((e.target as HTMLDetailsElement).open)}>
            <summary className="p-2 cursor-pointer flex items-center justify-between list-none">
                <div className="flex items-center gap-2">
                     <button onClick={onRemove} title="Supprimer cet ingrédient" className="p-0.5 rounded-full text-red-400 hover:text-white hover:bg-red-500/50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                        </svg>
                    </button>
                    <div>
                        <span className="font-semibold text-white">{ingredient.name}</span>
                        <span className="text-slate-300"> ({ingredient.quantity})</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{Math.round(ingredient.calories)} kcal</span>
                     <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </summary>
             <div className="px-4 pb-2 border-t border-slate-500/50">
                <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <p><strong className="font-semibold text-white">{ingredient.protein.toFixed(1)}g</strong> <span className="text-slate-400">Prot</span></p>
                    <p><strong className="font-semibold text-white">{ingredient.carbs.toFixed(1)}g</strong> <span className="text-slate-400">Gluc</span></p>
                    <p><strong className="font-semibold text-white">{ingredient.fat.toFixed(1)}g</strong> <span className="text-slate-400">Lip</span></p>
                </div>
            </div>
        </details>
    )
}


const MealIdeaGenerator: React.FC<{ onLogMeal: (mealLog: MealLog) => void, userData: UserData }> = ({ onLogMeal, userData }) => {
    const [mealType, setMealType] = useState<MealType>('Plat Principal');
    const [suggestion, setSuggestion] = useState<MealAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        const result = await geminiService.getMealSuggestion(mealType, userData);
        if (result) {
            setSuggestion(result);
        } else {
            setError("La génération d'idée a échoué. Veuillez réessayer.");
        }
        setIsLoading(false);
    };

    const handleLog = (analysisToLog: MealAnalysis, type: MealType) => {
        if (!analysisToLog) return;
        onLogMeal({ id: Date.now().toString(), type, analysis: analysisToLog });
        setSuggestion(null); // Clear after logging
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-emerald-400 mb-4">Générateur d'Idées Repas</h3>
            <div className="space-y-4">
                <div className="bg-slate-700/50 p-4 rounded-lg flex flex-col md:flex-row items-center gap-4">
                     <div className="w-full">
                        <label htmlFor="idea-meal-type" className="block text-sm font-medium text-slate-300 mb-1">Type de repas</label>
                        <select 
                            id="idea-meal-type"
                            value={mealType} 
                            onChange={e => setMealType(e.target.value as MealType)} 
                            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option>Petit-déjeuner</option>
                            <option>Déjeuner</option>
                            <option>Dîner</option>
                            <option>Entrée</option>
                            <option>Plat Principal</option>
                            <option>Dessert</option>
                            <option>Collation</option>
                        </select>
                    </div>
                     <button onClick={handleGenerate} disabled={isLoading} className="w-full md:w-auto bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600 disabled:bg-slate-600 flex items-center justify-center gap-2 mt-2 md:mt-5 whitespace-nowrap">
                        {isLoading ? <Spinner /> : 'Générer une idée'}
                    </button>
                </div>
                {isLoading && <div className="flex justify-center"><Spinner /></div>}
                {error && <p className="text-red-400 text-center">{error}</p>}
                
                {suggestion && <AnalysisResult analysis={suggestion} onLogMeal={handleLog} isSuggestion />}
            </div>
        </div>
    );
};


export default Nutrition;