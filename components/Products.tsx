import React, { useState, useEffect, useRef } from 'react';
import { CustomProduct } from '../types';
import Icon from './Icon';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import MicButton from './MicButton';


interface ProductsProps {
    products: CustomProduct[];
    productsInStock: string[];
    onAddProduct: (product: CustomProduct) => void;
    onDeleteProduct: (productId: string) => void;
    onAddStockItem: (item: string) => void;
    onDeleteStockItem: (item: string) => void;
}

const StockManager: React.FC<{ items: string[], onAddItem: (item: string) => void, onDeleteItem: (item: string) => void }> = ({ items, onAddItem, onDeleteItem }) => {
    const [newItem, setNewItem] = useState('');

    const { isListening, transcript, start, stop } = useSpeechRecognition();

    useEffect(() => {
        if(transcript) setNewItem(transcript);
    }, [transcript]);

    const handleMicClick = () => {
        if(isListening) {
            stop();
        } else {
            start();
        }
    };

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newItem.trim()) {
            onAddItem(newItem);
            setNewItem('');
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-semibold text-emerald-400 mb-4">Mes Produits en Stock</h3>
            <p className="text-slate-400 mb-4 text-sm">Listez ici les ingrédients de base que vous avez (fruits, légumes, etc.). L'IA les utilisera pour créer vos menus.</p>
            <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                 <div className="flex-grow flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
                    <input 
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        placeholder="Ex: Banane, Fraises..."
                        className="w-full bg-transparent p-2 text-white focus:outline-none"
                    />
                    <MicButton isListening={isListening} onClick={handleMicClick} />
                 </div>
                <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">Ajouter</button>
            </form>
            <div className="flex flex-wrap gap-2">
                {items.length === 0 ? (
                    <p className="text-slate-500 text-sm">Votre stock est vide.</p>
                ) : items.map(item => (
                    <span key={item} className="bg-slate-700 text-slate-200 text-sm font-medium px-3 py-1.5 rounded-full flex items-center gap-2">
                        {item}
                        <button onClick={() => onDeleteItem(item)} className="text-slate-400 hover:text-white">
                            &times;
                        </button>
                    </span>
                ))}
            </div>
        </div>
    );
}

const AddProductForm: React.FC<{ onAddProduct: (product: CustomProduct) => void; }> = ({ onAddProduct }) => {
    const [name, setName] = useState('');
    const [servingDescription, setServingDescription] = useState('pour 100g');
    const [calories, setCalories] = useState<number | string>('');
    const [protein, setProtein] = useState<number | string>('');
    const [carbs, setCarbs] = useState<number | string>('');
    const [fat, setFat] = useState<number | string>('');
    const [photo, setPhoto] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const [activeField, setActiveField] = useState<string | null>(null);
    const { isListening, transcript, start, stop } = useSpeechRecognition();

    useEffect(() => {
        if (!activeField || !transcript) return;
        
        const isNumeric = ['calories', 'protein', 'carbs', 'fat'].includes(activeField);
        const value = isNumeric ? transcript.replace(/[^0-9.]/g, '') : transcript;

        switch(activeField) {
            case 'name': setName(value); break;
            case 'servingDescription': setServingDescription(value); break;
            case 'calories': setCalories(value); break;
            case 'protein': setProtein(value); break;
            case 'carbs': setCarbs(value); break;
            case 'fat': setFat(value); break;
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


    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || calories === '' || protein === '' || carbs === '' || fat === '' || !photo) {
            alert('Veuillez remplir tous les champs et ajouter une photo.');
            return;
        }
        onAddProduct({
            id: Date.now().toString(),
            name,
            photo,
            servingDescription,
            calories: Number(calories),
            protein: Number(protein),
            carbs: Number(carbs),
            fat: Number(fat)
        });
        // Reset form
        setName(''); setServingDescription('pour 100g'); setCalories(''); setProtein(''); setCarbs(''); setFat(''); setPhoto(null);
        setIsExpanded(false);
    };
    
    const renderInputWithMic = (
      name: string, 
      label: string, 
      value: string | number, 
      setter: (val: string) => void, 
      type: string = 'text'
    ) => (
      <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-300">{label}</label>
        <div className="mt-1 flex items-center gap-2 bg-slate-700 border border-slate-600 rounded-md focus-within:ring-2 focus-within:ring-emerald-500">
          <input 
            type={type} 
            name={name} 
            id={name} 
            value={value} 
            onChange={e => setter(e.target.value)} 
            required 
            className="w-full bg-transparent p-2 text-white focus:outline-none"
          />
          <MicButton isListening={isListening && activeField === name} onClick={() => handleMicClick(name)} />
        </div>
      </div>
    );

    if (!isExpanded) {
        return (
            <div className="text-center">
                 <button onClick={() => setIsExpanded(true)} className="bg-emerald-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-600 transition-colors">
                    Ajouter un Produit à la Bibliothèque
                </button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 p-6 rounded-lg shadow-lg space-y-4 max-w-2xl mx-auto mb-8">
            <h3 className="text-xl font-semibold text-emerald-400">Ajouter un produit à votre bibliothèque</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    {renderInputWithMic('name', 'Nom du produit', name, setName)}
                </div>
                <div>
                    {renderInputWithMic('calories', 'Calories (kcal)', calories, setCalories, 'number')}
                </div>
                 <div>
                    {renderInputWithMic('servingDescription', 'Portion', servingDescription, setServingDescription)}
                </div>
                <div>
                    {renderInputWithMic('protein', 'Protéines (g)', protein, setProtein, 'number')}
                </div>
                <div>
                    {renderInputWithMic('carbs', 'Glucides (g)', carbs, setCarbs, 'number')}
                </div>
                <div>
                    {renderInputWithMic('fat', 'Lipides (g)', fat, setFat, 'number')}
                </div>
                <div className="md:col-span-2">
                     <label htmlFor="product-photo" className="block text-sm font-medium text-slate-300 mb-2">Photo du produit</label>
                      <div className="mt-1 flex items-center gap-4">
                        {photo && <img src={photo} alt="Aperçu" className="h-20 w-20 object-cover rounded-md" />}
                        <div className="flex-grow flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <Icon name="camera" className="mx-auto h-10 w-10 text-slate-400" />
                                <div className="flex text-sm text-slate-500">
                                    <label htmlFor="product-photo" className="relative cursor-pointer bg-slate-700 rounded-md font-medium text-emerald-400 hover:text-emerald-300 focus-within:outline-none px-3 py-1">
                                    <span>Télécharger une photo</span>
                                    <input id="product-photo" name="product-photo" type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} required/>
                                    </label>
                                </div>
                                <p className="text-xs text-slate-500">PNG, JPG, GIF</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
             <div className="flex gap-4">
                <button type="button" onClick={() => setIsExpanded(false)} className="w-full bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500">
                    Annuler
                </button>
                <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-600">
                    Enregistrer le Produit
                </button>
            </div>
        </form>
    );
};

const Products: React.FC<ProductsProps> = ({ products, productsInStock, onAddProduct, onDeleteProduct, onAddStockItem, onDeleteStockItem }) => {
    return (
        <div className="p-4 md:p-6 space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white">Vos Produits et Stocks</h2>
                <p className="text-slate-400 max-w-3xl mt-2">Gérez ici votre stock d'ingrédients de base et votre bibliothèque de produits personnalisés. Ces listes sont utilisées par le créateur de menus pour vous proposer des repas adaptés à ce que vous avez.</p>
            </div>
            
            <StockManager items={productsInStock} onAddItem={onAddStockItem} onDeleteItem={onDeleteStockItem} />
            
            <div className="space-y-6">
                 <div>
                    <h3 className="text-2xl font-bold text-white">Bibliothèque de Produits Personnalisés</h3>
                     <p className="text-slate-400 max-w-3xl mt-1">Ajoutez les produits que vous utilisez souvent avec leurs informations nutritionnelles exactes. L'IA les reconnaîtra lors de l'analyse photo/manuelle et pourra les utiliser dans le créateur de menus.</p>
                </div>

                <AddProductForm onAddProduct={onAddProduct} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map(product => (
                        <div key={product.id} className="bg-slate-800 rounded-lg shadow-lg overflow-hidden relative group">
                            <img src={product.photo} alt={product.name} className="w-full h-40 object-cover" />
                            <div className="p-4">
                                <h4 className="text-lg font-bold text-white">{product.name}</h4>
                                <p className="text-sm text-slate-400 mb-2">{product.servingDescription}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <span className="text-slate-300">Calories: <strong className="text-white">{product.calories}</strong></span>
                                    <span className="text-slate-300">Protéines: <strong className="text-white">{product.protein}g</strong></span>
                                    <span className="text-slate-300">Glucides: <strong className="text-white">{product.carbs}g</strong></span>
                                    <span className="text-slate-300">Lipides: <strong className="text-white">{product.fat}g</strong></span>
                                </div>
                            </div>
                            <button onClick={() => onDeleteProduct(product.id)} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white/70 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                <Icon name="trash" className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                </div>
                {products.length === 0 && (
                    <div className="text-center py-10 bg-slate-800 rounded-lg">
                        <Icon name="box" className="mx-auto h-16 w-16 text-slate-500" />
                        <p className="mt-4 text-slate-400">Votre bibliothèque de produits est vide.</p>
                        <p className="text-sm text-slate-500">Ajoutez un produit pour commencer.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;