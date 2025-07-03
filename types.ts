export type View = 'dashboard' | 'nutrition' | 'workouts' | 'progress' | 'profile' | 'products';

export interface ProgressPoint {
  date: string; // "YYYY-MM-DD"
  value: number;
}

export interface CustomProduct {
  id: string;
  name: string;
  photo: string; // base64
  servingDescription: string; // e.g., "pour 100g", "par pot"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserData {
  name: string;
  heightCm: number;
  weightGoalKg?: number;
  age?: number;
  aiSystemInstruction?: string;
  customProducts: CustomProduct[];
  productsInStock: string[];
  weightHistory: ProgressPoint[];
  waistHistory: ProgressPoint[];
  dailyLog: DailyLog;
}

export type MealType = 'Petit-déjeuner' | 'Déjeuner' | 'Dîner' | 'Collation' | 'Entrée' | 'Plat Principal' | 'Dessert';

export interface FoodItem {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface MealAnalysis {
  dishName: string;
  reasoning: string;
  items: FoodItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface MealLog {
    id: string;
    type: MealType;
    analysis: MealAnalysis;
}

export interface WorkoutLog {
    id: string;
    name: string;
    durationMinutes: number;
    caloriesBurned: number;
}

export interface DailyLog {
    [date: string]: {
        meals: MealLog[];
        workouts: WorkoutLog[];
    };
}


export interface Recipe {
  name: string;
  prepTimeMinutes: number;
  instructions: string[];
  goalFit: string;
  analysis: MealAnalysis; // Contient maintenant toutes les infos nutritionnelles, ingrédients y compris
}

export interface Workout {
  name: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  durationMinutes: number;
  caloriesBurned: number;
  type: "Vélo d'appartement" | "Plateforme vibrante" | "Marche";
}

// Types pour le créateur de menu détaillé
export interface DetailedIngredient {
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface GeneratedMeal {
    name: string;
    ingredients: DetailedIngredient[];
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export interface FullDayMenu {
    dailyTotals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    meals: {
        'Petit-déjeuner'?: GeneratedMeal;
        'Déjeuner'?: GeneratedMeal;
        'Dîner'?: GeneratedMeal;
        'Collation'?: GeneratedMeal;
    };
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}