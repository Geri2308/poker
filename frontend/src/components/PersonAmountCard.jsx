import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Euro, Trophy, Lock } from 'lucide-react';

const PersonAmountCard = ({ person, onAmountChange, rank, isAdmin }) => {
  const [displayValue, setDisplayValue] = useState(
    person.amount === 0 ? '' : person.amount.toString()
  );

  const handleChange = (e) => {
    if (!isAdmin) return;
    
    const value = e.target.value;
    setDisplayValue(value); // Zeige immer den getippten Wert an
  };

  const handleBlur = () => {
    if (!isAdmin) return;
    
    // Beim Verlassen des Feldes: Wert verarbeiten
    if (displayValue === '' || displayValue === '-') {
      onAmountChange(person.id, 0);
      setDisplayValue('');
    } else {
      const numericValue = parseFloat(displayValue);
      if (!isNaN(numericValue)) {
        onAmountChange(person.id, numericValue);
        setDisplayValue(numericValue.toString());
      } else {
        // Bei ungültigem Wert: zurück zum letzten gültigen Wert
        setDisplayValue(person.amount === 0 ? '' : person.amount.toString());
      }
    }
  };

  // Sync mit person.amount wenn sich dieser von außen ändert
  React.useEffect(() => {
    const currentDisplay = person.amount === 0 ? '' : person.amount.toString();
    if (displayValue !== currentDisplay && document.activeElement?.id !== `amount-${person.id}`) {
      setDisplayValue(currentDisplay);
    }
  }, [person.amount, person.id, displayValue]);

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-white';
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) return <Trophy className={`h-5 w-5 ${getRankColor(rank)}`} />;
    return null;
  };

  return (
    <Card className={`bg-black/60 backdrop-blur-sm border-gray-600 hover:bg-black/70 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 ${
      !isAdmin ? 'cursor-not-allowed opacity-90' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-3 flex-1">
            <div className="flex items-center space-x-2 min-w-[60px]">
              <span className={`text-2xl font-bold ${getRankColor(rank)}`}>
                {rank}.
              </span>
              {getRankIcon(rank)}
            </div>
            <Label 
              htmlFor={`amount-${person.id}`} 
              className="text-white text-lg font-medium"
            >
              {person.name}
            </Label>
          </div>
          <div className="flex items-center space-x-2 flex-1 max-w-xs">
            <Euro className="text-yellow-500 h-5 w-5" />
            <div className="relative">
              {isAdmin ? (
                <Input
                  id={`amount-${person.id}`}
                  type="text"
                  value={displayValue}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="-100 oder 50"
                  className={`bg-black/50 border-gray-500 placeholder:text-gray-400 focus:border-yellow-500 focus:ring-yellow-500/20 text-right ${
                    person.amount < 0 ? 'text-red-400' : 'text-white'
                  }`}
                />
              ) : (
                <div className={`h-9 w-full rounded-md border border-gray-500 bg-black/40 px-3 py-1 text-right text-lg font-bold flex items-center justify-end ${
                  person.amount < 0 ? 'text-red-400' : 'text-white'
                }`}>
                  {person.amount === 0 ? '€0' : `€${person.amount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonAmountCard;