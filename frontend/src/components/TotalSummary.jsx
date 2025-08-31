import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calculator, Euro } from 'lucide-react';

const TotalSummary = ({ persons }) => {
  const totalAmount = persons.reduce((sum, person) => sum + person.amount, 0);
  const activePeople = persons.filter(person => person.amount > 0).length;

  return (
    <Card className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 border-yellow-500/30 shadow-lg shadow-yellow-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-yellow-500 flex items-center space-x-2 text-xl">
          <Calculator className="h-6 w-6" />
          <span>Zusammenfassung</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center text-lg">
          <span className="text-yellow-500">Gesamtsumme:</span>
          <div className={`flex items-center space-x-1 font-bold ${
            totalAmount < 0 ? 'text-red-400' : 'text-yellow-500'
          }`}>
            <Euro className="h-5 w-5" />
            <span>{totalAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-sm text-yellow-500/80">
          <span>Aktive Personen:</span>
          <span className="font-medium">{activePeople} von {persons.length}</span>
        </div>
        {totalAmount > 0 && activePeople > 1 && (
          <div className="flex justify-between items-center text-sm text-yellow-500/80 pt-2 border-t border-gray-600">
            <span>Durchschnitt pro Person:</span>
            <div className="flex items-center space-x-1">
              <Euro className="h-4 w-4" />
              <span>{(totalAmount / activePeople).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TotalSummary;