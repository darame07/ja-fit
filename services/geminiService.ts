import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { UserData, MealAnalysis, Recipe, CustomProduct, MealType, FullDayMenu, ChatMessage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("La variable d'environnement API_KEY n'est pas définie");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const parseJsonFromMarkdown = <T,>(text: string): T | null => {
  try {
    let jsonStr = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    // Correction pour les virgules finales erronées
    jsonStr = jsonStr.replace(/,(?=\s*?[\}\]])/g, '');
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Échec de l'analyse du JSON de la réponse du modèle:", e);
    console.error("Texte original:", text);
    return null;
  }
};

const getBasePrompt = (systemInstruction: string, customProducts: CustomProduct[]): string => {
  let prompt = systemInstruction;
  if (customProducts.length > 0) {
    prompt += `\n\nVoici une liste de produits personnalisés que l'utilisateur a enregistrés. VOUS DEVEZ UTILISER CES DONNÉES NUTRITIONNELLES EXACTES si vous reconnaissez l'un de ces produits dans une demande. Ne les estimez pas.\nProduits personnalisés: ${JSON.stringify(customProducts.map(p => ({name: p.name, serving: p.servingDescription, calories: p.calories, protein: p.protein, carbs: p.carbs, fat: p.fat})))}`;
  }
  return prompt;
}

export async function getMotivationalMessage(systemInstruction: string): Promise<string> {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: "Donne-moi une seule phrase de motivation, courte et percutante, spécifiquement conçue pour encourager quelqu'un à continuer son régime pour perdre du ventre, maigrir et faire du sport. La réponse doit être uniquement la phrase, en français, sans aucun texte superflu ni guillemets.",
      config: { 
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      }
    });
    return response.text;
  } catch (error) {
    console.error("Erreur lors de la récupération du message de motivation:", error);
    return "Chaque pas est un progrès. Continuez d'avancer !";
  }
}

export async function analyzeMealImage(base64Image: string, userComments: string, systemInstruction: string, customProducts: CustomProduct[]): Promise<MealAnalysis | null> {
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image,
      },
    };

    const userCommentText = userComments ? `L'utilisateur a ajouté ce commentaire pour aider à l'analyse : \"${userComments}\". Tenez-en compte.` : '';

    const textPart = {
      text: `Vous êtes un expert en nutrition. Analysez la nourriture sur cette image. ${userCommentText}
1. Donnez un nom au plat.
2. Identifiez chaque composant alimentaire principal dans l'assiette. Tenez compte de la liste de produits personnalisés fournie dans les instructions système. Si un aliment sur la photo correspond à un produit personnalisé, utilisez ses données nutritionnelles exactes.
3. Pour chaque composant, estimez les calories, protéines (g), glucides (g) et lipides (g).
4. Fournissez un total pour les calories, protéines, glucides et lipides pour le plat entier.
5. Fournissez une brève explication ('reasoning') pour votre estimation.

Répondez UNIQUEMENT et EXCLUSIVEMENT avec un objet JSON valide en français au format strict :
\`{
  "dishName": "Nom du Plat",
  "reasoning": "Brève explication de l'estimation.",
  "items": [
    {"name": "Nom Composant 1", "calories": X, "protein": Y, "carbs": Z, "fat": A},
    {"name": "Nom Composant 2", "calories": X, "protein": Y, "carbs": Z, "fat": A}
  ],
  "totals": {
    "calories": TotalCalories,
    "protein": TotalProteines,
    "carbs": TotalGlucides,
    "fat": TotalLipides
  }
}\`
N'incluez aucun autre texte, explication ou démarqueur markdown. Ne mettez pas de virgule après le dernier élément d'un tableau ou d'un objet.`
    };
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-04-17',
      contents: { parts: [imagePart, textPart] },
      config: { 
          responseMimeType: "application/json",
          systemInstruction: getBasePrompt(systemInstruction, customProducts),
          thinkingConfig: { thinkingBudget: 0 },
      }
    });
    
    return parseJsonFromMarkdown<MealAnalysis>(response.text);

  } catch (error) {
    console.error("Erreur lors de l'analyse de l'image du repas:", error);
    return null;
  }
}

export async function findRecipes(query: string, filters: { goal: string }, ingredients: string, systemInstruction: string): Promise<Recipe[]> {
    try {
        const prompt = `Vous êtes un nutritionniste créatif. Un utilisateur recherche des recettes.
Recherche de l'utilisateur: "${query || 'non spécifiée'}".
Ingrédients disponibles: "${ingredients || 'non spécifiés'}". Vous devez utiliser ces ingrédients si possible.
Objectif principal: ${filters.goal}.

Proposez entre 1 et 4 recettes. Soyez créatif même avec des ingrédients simples.
Pour chaque recette, fournissez une analyse nutritionnelle complète et détaillée.

RÈGLES STRICTES :
1. Chaque recette proposée NE DOIT PAS DÉPASSER 500 calories au total.
2. La réponse DOIT être UNIQUEMENT un tableau JSON d'objets au format suivant. NE PAS inclure de texte ou de démarqueurs en dehors du tableau JSON.
3. NE RETOURNEZ JAMAIS UN TABLEAU VIDE. Si vous ne trouvez rien, inventez une recette simple et saine avec les ingrédients fournis qui respecte la limite de calories.

Format JSON attendu :
\`[
  {
    "name": "Nom de la recette",
    "prepTimeMinutes": 30,
    "instructions": ["Étape 1...", "Étape 2..."],
    "goalFit": "Objectif (ex: Perte de poids)",
    "analysis": {
      "dishName": "Nom de la recette (identique à celui ci-dessus)",
      "reasoning": "Brève explication de la pertinence de la recette pour l'objectif.",
      "items": [
        {"name": "Ingrédient 1 (quantité)", "calories": 200, "protein": 30, "carbs": 5, "fat": 8},
        {"name": "Ingrédient 2 (quantité)", "calories": 150, "protein": 2, "carbs": 30, "fat": 2}
      ],
      "totals": {
        "calories": 350,
        "protein": 32,
        "carbs": 35,
        "fat": 10
      }
    }
  }
]\`
Assurez-vous que le total des calories dans "analysis.totals.calories" est inférieur à 500. N'ajoutez pas de virgule après le dernier objet du tableau.`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                systemInstruction,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });

        return parseJsonFromMarkdown<Recipe[]>(response.text) || [];
    } catch (error) {
        console.error("Erreur lors de la recherche de recettes:", error);
        return [];
    }
}

export async function analyzeManualMeal(mealDescription: string, systemInstruction: string, customProducts: CustomProduct[]): Promise<MealAnalysis | null> {
    try {
        const prompt = `Vous êtes un expert en nutrition. Un utilisateur a décrit son repas.
Description : "${mealDescription}".
Votre tâche est de :
1. D'ABORD, vérifier si des aliments de la description correspondent à un produit dans la liste des produits personnalisés fournie dans les instructions système. Si c'est le cas, VOUS DEVEZ UTILISER LES VALEURS NUTRITIONNELLES EXACTES de ce produit.
2. Pour tous les autres aliments, estimer leurs calories, protéines (g), glucides (g), et lipides (g).
3. Donner un nom générique au repas (ex: "Salade composée", "Repas de poulet et légumes").
4. Calculer les totaux pour l'ensemble du repas.
Répondez UNIQUEMENT et EXCLUSIVEMENT avec un objet JSON valide en français au format strict :
\`{
  "dishName": "Nom du Plat",
  "reasoning": "Repas généré à partir de la saisie manuelle.",
  "items": [
    {"name": "Nom Aliment 1 (quantité)", "calories": X, "protein": Y, "carbs": Z, "fat": A},
    {"name": "Nom Aliment 2 (quantité)", "calories": X, "protein": Y, "carbs": Z, "fat": A}
  ],
  "totals": {
    "calories": TotalCalories,
    "protein": TotalProteines,
    "carbs": TotalGlucides,
    "fat": TotalLipides
  }
}\`
N'incluez aucun texte ou markdown en dehors de cet objet JSON. Ne mettez pas de virgule après le dernier élément d'un tableau ou d'un objet.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                systemInstruction: getBasePrompt(systemInstruction, customProducts),
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        return parseJsonFromMarkdown<MealAnalysis>(response.text);
    } catch (error) {
        console.error("Erreur lors de l'analyse du repas manuel:", error);
        return null;
    }
}


export async function getPersonalizedAdvice(userData: UserData): Promise<string> {
    const currentWeight = userData.weightHistory[userData.weightHistory.length - 1]?.value || 0;
    const currentWaist = userData.waistHistory[userData.waistHistory.length - 1]?.value || 0;

    const progressSummary = {
        age: `L'utilisateur a ${userData.age || 'N/A'} ans.`,
        goal: `L'objectif de poids est ${userData.weightGoalKg} kg.`,
        currentStatus: `Le poids actuel est ${currentWeight} kg et le tour de taille est ${currentWaist} cm.`,
        weightTrend: `Le poids est passé de ${userData.weightHistory[0]?.value || 'N/A'} kg à ${currentWeight} kg.`,
        waistTrend: `Le tour de taille est passé de ${userData.waistHistory[0]?.value || 'N/A'} cm à ${currentWaist} cm.`
    };
    try {
        const prompt = `Vous êtes un coach de fitness et de nutrition serviable et encourageant. Un utilisateur a fourni ses progrès. Données : ${JSON.stringify(progressSummary)}.
Sur cette base, fournissez des conseils concis et exploitables. Formatez votre réponse en markdown. 
Incluez une section pour '### Conseils Nutritionnels' et une pour '### Conseils d'Exercice', chacune avec 2-3 points sous forme de liste. 
Commencez par une brève phrase encourageante sur ses progrès jusqu'à présent. Adressez-vous directement à l'utilisateur en le tutoyant ('tu').`;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                systemInstruction: getBasePrompt(userData.aiSystemInstruction || 'Sois un coach IA amical et motivant.', userData.customProducts),
                thinkingConfig: { thinkingBudget: 0 },
            }
        });

        return response.text;
    } catch (error) {
        console.error("Erreur lors de l'obtention des conseils personnalisés:", error);
        return "Un problème est survenu lors de la génération de vos conseils. Veuillez vérifier votre connexion et réessayer.";
    }
}

export async function getMealSuggestion(mealType: MealType, userData: UserData): Promise<MealAnalysis | null> {
    try {
        let calorieConstraint = '';
        if (mealType === 'Petit-déjeuner') {
            calorieConstraint = 'IMPORTANT : La suggestion totale pour ce repas NE DOIT JAMAIS DÉPASSER 450 calories.';
        } else if (mealType === 'Déjeuner' || mealType === 'Dîner' || mealType === 'Plat Principal') {
            calorieConstraint = 'IMPORTANT : La suggestion totale pour ce repas NE DOIT JAMAIS DÉPASSER 500 calories.';
        } else if (mealType === 'Collation') {
            calorieConstraint = 'IMPORTANT : La suggestion totale pour ce repas NE DOIT JAMAIS DÉPASSER 375 calories.';
        }

        const prompt = `Vous êtes un nutritionniste. Suggérez une idée de repas simple, saine et équilibrée pour un(e) "${mealType}" qui correspond à l'objectif de l'utilisateur.
${calorieConstraint}
Prenez en compte le profil de l'utilisateur (âge, objectif, etc.) et ses instructions système.
Votre réponse DOIT être une analyse nutritionnelle complète de votre suggestion.
Répondez UNIQUEMENT et EXCLUSIVEMENT avec un objet JSON valide en français au format strict :
\`{
  "dishName": "Nom du Plat Suggéré",
  "reasoning": "Suggestion générée par l'IA pour un(e) ${mealType} sain et équilibré.",
  "items": [
    {"name": "Ingrédient 1 (quantité)", "calories": X, "protein": Y, "carbs": Z, "fat": A},
    {"name": "Ingrédient 2 (quantité)", "calories": X, "protein": Y, "carbs": Z, "fat": A}
  ],
  "totals": {
    "calories": TotalCalories,
    "protein": TotalProteines,
    "carbs": TotalGlucides,
    "fat": TotalLipides
  }
}\`
N'incluez aucun texte ou markdown en dehors de cet objet JSON. Ne mettez pas de virgule après le dernier élément d'un tableau ou d'un objet.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                systemInstruction: getBasePrompt(`Objectif de l'utilisateur : ${userData.weightGoalKg > (userData.weightHistory.slice(-1)[0]?.value || 0) ? 'Prise de masse' : 'Perte de poids'}. ` + (userData.aiSystemInstruction || ''), userData.customProducts),
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        return parseJsonFromMarkdown<MealAnalysis>(response.text);
    } catch (error) {
        console.error(`Erreur lors de la suggestion de repas pour ${mealType}:`, error);
        return null;
    }
}

export async function generateMenuFromStock(userData: UserData): Promise<FullDayMenu | null> {
    try {
        const customProductsInfo = userData.customProducts.map(p => ({
            name: p.name,
            serving: p.servingDescription,
            calories: p.calories,
            protein: p.protein,
            carbs: p.carbs,
            fat: p.fat,
        }));

        const prompt = `Basé UNIQUEMENT sur les deux listes d'ingrédients suivantes, créez un menu équilibré COMPLET pour une journée (petit-déjeuner, déjeuner, dîner et une collation).
N'utilisez AUCUN ingrédient qui ne figure pas dans ces listes.
Liste 1 (Bibliothèque de produits avec détails) : ${JSON.stringify(customProductsInfo)}
Liste 2 (Stock d'ingrédients de base) : ${JSON.stringify(userData.productsInStock)}

RÈGLES STRICTES:
1. Le petit-déjeuner ne doit JAMAIS dépasser 450 calories.
2. Le déjeuner et le dîner ne doivent JAMAIS dépasser 500 calories chacun.
3. La collation ne doit JAMAIS dépasser 375 calories.
4. Pour CHAQUE ingrédient dans CHAQUE repas, vous devez fournir une quantité réaliste (ex: "150g", "1 fruit") et estimer ses calories, protéines, glucides et lipides.
5. Pour CHAQUE repas, vous devez calculer les totaux (calories, protéines, glucides, lipides).
6. Vous devez calculer les totaux pour la journée ENTIÈRE.

Répondez UNIQUEMENT avec un objet JSON valide en français au format strict :
\`{
  "dailyTotals": { "calories": X, "protein": Y, "carbs": Z, "fat": A },
  "meals": {
    "Petit-déjeuner": { 
      "name": "Nom du repas", 
      "ingredients": [
        {"name": "ingrédient1", "quantity": "quantité1", "calories": X, "protein": Y, "carbs": Z, "fat": A}
      ],
      "totals": { "calories": X, "protein": Y, "carbs": Z, "fat": A }
    },
    "Déjeuner": { "name": "...", "ingredients": [...], "totals": {...} },
    "Dîner": { "name": "...", "ingredients": [...], "totals": {...} },
    "Collation": { "name": "...", "ingredients": [...], "totals": {...} }
  }
}\`
Si vous ne pouvez pas créer un repas (par exemple, la collation faute d'ingrédients), mettez sa valeur à null. Ne mettez pas de virgule après le dernier élément.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                systemInstruction: `Vous êtes un nutritionniste créatif qui compose des menus. Objectif de l'utilisateur : ${userData.weightGoalKg > (userData.weightHistory.slice(-1)[0]?.value || 0) ? 'Prise de masse' : 'Perte de poids'}.`,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        
        return parseJsonFromMarkdown<FullDayMenu>(response.text);
    } catch (error) {
        console.error("Erreur lors de la génération du menu à partir du stock:", error);
        return null;
    }
}

export async function getChatResponse(userData: UserData, chatHistory: ChatMessage[], newMessage: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0];
    const progressSummary = {
        name: userData.name,
        age: `L'utilisateur a ${userData.age || 'N/A'} ans.`,
        height: `Taille: ${userData.heightCm} cm.`,
        goal: `L'objectif de poids est ${userData.weightGoalKg || 'non défini'} kg.`,
        currentWeight: `Le poids actuel est ${userData.weightHistory.slice(-1)[0]?.value || 'N/A'} kg.`,
        currentWaist: `Le tour de taille actuel est ${userData.waistHistory.slice(-1)[0]?.value || 'N/A'} cm.`,
        weightHistory: `Historique de poids (plus récent en dernier): ${JSON.stringify(userData.weightHistory.slice(-5))}`,
        waistHistory: `Historique de taille (plus récent en dernier): ${JSON.stringify(userData.waistHistory.slice(-5))}`,
        todaysLog: `Journal du jour (${today}): ${JSON.stringify(userData.dailyLog[today] || 'vide')}`
    };

    const systemInstruction = `Tu es 'Coach IA', un coach de fitness et nutrition. Tu es serviable, encourageant et bienveillant.
    Utilise les données de l'utilisateur pour contextualiser tes réponses. Adresse-toi à l'utilisateur par son prénom en utilisant 'tu'.
    Sois concis et direct. Tes réponses doivent être du texte simple, pas du markdown.
    Voici les données de l'utilisateur : ${JSON.stringify(progressSummary)}.
    Voici les instructions personnelles de l'utilisateur, que tu dois suivre : "${userData.aiSystemInstruction || 'Aucune instruction personnelle.'}"`;

    try {
        const historyForApi: Content[] = chatHistory.map(message => ({
            role: message.role,
            parts: [{ text: message.text }]
        }));

        const chat = ai.chats.create({
            model: 'gemini-2.5-flash-preview-04-17',
            history: historyForApi,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });

        const response: GenerateContentResponse = await chat.sendMessage({ message: newMessage });

        return response.text;
    } catch (error) {
        console.error("Erreur lors de la récupération de la réponse du chat:", error);
        return "Je suis désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.";
    }
}