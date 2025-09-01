import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Play, Pause, Square, Plus, Trash2, Clock, Settings, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';

const BlindTimer = ({ onClose }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [structureName, setStructureName] = useState('Meine Blindstruktur');
  // Using sonner toast system for better reliability
  
  const [blindLevels, setBlindLevels] = useState([
    { small: 10, big: 20, ante: 0, duration: 20 }, // Default Levels (not Turnier 1)
    { small: 20, big: 40, ante: 0, duration: 20 },
    { small: 30, big: 60, ante: 0, duration: 20 },
    { small: 50, big: 100, ante: 10, duration: 20 },
    { small: 75, big: 150, ante: 15, duration: 20 },
    { small: 100, big: 200, ante: 25, duration: 20 },
    { small: 150, big: 300, ante: 50, duration: 20 },
    { small: 200, big: 400, ante: 75, duration: 20 }
  ]);

  const intervalRef = useRef(null);

  // Load saved structure on mount (but don't clear cache!)
  useEffect(() => {
    console.log('🔥 Component mounted');
    // Test toast system on mount
    toast.success('Blind Timer gestartet! 🎯');
    // Load saved structure if it exists
    const saved = localStorage.getItem('poker-blind-structure');
    if (saved) {
      loadSavedStructure();
    }
  }, []);

  // Initialize timer with first level
  useEffect(() => {
    if (blindLevels.length > 0 && timeLeft === 0) {
      setTimeLeft(blindLevels[0].duration * 60); // Convert minutes to seconds
    }
  }, [blindLevels]);

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up, move to next level
            if (currentLevel < blindLevels.length - 1) {
              setCurrentLevel(currentLevel + 1);
              return blindLevels[currentLevel + 1].duration * 60;
            } else {
              // Tournament finished
              setIsRunning(false);
              toast.success("Turnier beendet! Alle Blind-Level wurden durchlaufen.");
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft, currentLevel, blindLevels, toast]);

  const loadSavedStructure = () => {
    try {
      const saved = localStorage.getItem('poker-blind-structure');
      console.log('Loading saved structure:', saved);
      if (saved) {
        const data = JSON.parse(saved);
        console.log('✅ Parsed data:', data);
        setBlindLevels(data.levels || blindLevels);
        setStructureName(data.name || 'Meine Blindstruktur');
        toast.success(`Struktur geladen: "${data.name || 'Gespeicherte Struktur'}"`);
      } else {
        console.log('No saved structure found');
        toast.warning("Keine gespeicherte Blindstruktur gefunden.");
      }
    } catch (error) {
      console.error('❌ Error loading blind structure:', error);
      toast.error("Die Blindstruktur konnte nicht geladen werden.");
    }
  };

  const saveBlindStructure = () => {
    try {
      const structureData = {
        name: structureName,
        levels: blindLevels,
        savedAt: new Date().toISOString()
      };
      
      console.log('Saving blind structure:', structureData);
      localStorage.setItem('poker-blind-structure', JSON.stringify(structureData));
      console.log('✅ Blind structure saved successfully');
      
      toast.success(`Blindstruktur "${structureName}" wurde erfolgreich gespeichert!`);
      
      // Backup notification to ensure user feedback
      alert(`✅ GESPEICHERT!\n\nBlindstruktur "${structureName}" wurde erfolgreich gespeichert.`);
    } catch (error) {
      console.error('❌ Error saving blind structure:', error);
      toast.error("Die Blindstruktur konnte nicht gespeichert werden.");
    }
  };

  const resetToDefault = () => {
    const defaultLevels = [
      { small: 25, big: 50, ante: 0, duration: 20 },
      { small: 50, big: 100, ante: 0, duration: 20 },
      { small: 75, big: 150, ante: 0, duration: 20 },
      { small: 100, big: 200, ante: 25, duration: 20 },
      { small: 150, big: 300, ante: 25, duration: 20 },
      { small: 200, big: 400, ante: 50, duration: 20 },
      { small: 300, big: 600, ante: 75, duration: 20 },
      { small: 400, big: 800, ante: 100, duration: 20 }
    ];
    
    setBlindLevels(defaultLevels);
    setCurrentLevel(0);
    setTimeLeft(defaultLevels[0].duration * 60);
    setStructureName('Standard Struktur');
    setIsRunning(false);
    
    toast.success("Die Standard-Blindstruktur wurde geladen.");
  };

  const loadTurnier1 = () => {
    // Don't clear localStorage - keep user data!
    console.log('🎯 Loading Turnier 1 without clearing user data');
    
    const turnier1Levels = [
      { small: 25, big: 50, ante: 0, duration: 12 }, // €25/€50 + 12 Min Laut Problem Statement!
      { small: 50, big: 100, ante: 0, duration: 12 },
      { small: 75, big: 150, ante: 0, duration: 12 },
      { small: 100, big: 200, ante: 25, duration: 12 },
      { small: 150, big: 300, ante: 25, duration: 12 },
      { small: 200, big: 400, ante: 50, duration: 12 },
      { small: 300, big: 600, ante: 75, duration: 12 },
      { small: 400, big: 800, ante: 100, duration: 12 }
    ];
    
    console.log('🎯 Setting Turnier 1 levels:', turnier1Levels);
    console.log('🎯 First level should be:', turnier1Levels[0]);
    
    // Force state updates in correct order
    setIsRunning(false);
    setCurrentLevel(0);
    setBlindLevels(turnier1Levels);
    setTimeLeft(turnier1Levels[0].duration * 60); // 12 Minuten = 720 Sekunden
    setStructureName('Turnier 1');
    
    console.log('✅ Turnier 1 state updated');
    
    toast.success("Turnier 1 geladen! €25/€50 Struktur mit 12 Min/Level");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    setCurrentLevel(0);
    setTimeLeft(blindLevels[0]?.duration * 60 || 0);
  };

  const handleNextLevel = () => {
    if (currentLevel < blindLevels.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setTimeLeft(blindLevels[currentLevel + 1].duration * 60);
    }
  };

  const handlePrevLevel = () => {
    if (currentLevel > 0) {
      setCurrentLevel(currentLevel - 1);
      setTimeLeft(blindLevels[currentLevel - 1].duration * 60);
    }
  };

  const addBlindLevel = () => {
    const newLevel = {
      small: 100,
      big: 200,
      ante: 0,
      duration: 20
    };
    setBlindLevels([...blindLevels, newLevel]);
  };

  const removeBlindLevel = (index) => {
    if (blindLevels.length > 1) {
      const newLevels = blindLevels.filter((_, i) => i !== index);
      setBlindLevels(newLevels);
      if (currentLevel >= newLevels.length) {
        setCurrentLevel(newLevels.length - 1);
        setTimeLeft(newLevels[newLevels.length - 1]?.duration * 60 || 0);
      }
    }
  };

  const updateBlindLevel = (index, field, value) => {
    const newLevels = [...blindLevels];
    newLevels[index][field] = parseInt(value) || 0;
    setBlindLevels(newLevels);
    
    // Update current timer if editing current level
    if (index === currentLevel && field === 'duration') {
      setTimeLeft(newLevels[index].duration * 60);
    }
  };

  const currentBlind = blindLevels[currentLevel] || blindLevels[0];
  const nextBlind = blindLevels[currentLevel + 1];

  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(/poker-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader className="border-b border-gray-600">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl flex items-center space-x-2">
                <Clock className="h-6 w-6 text-yellow-500" />
                <span>Blind Timer</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowSettings(!showSettings)}
                  variant="outline"
                  className="border-gray-500 text-white hover:bg-gray-700"
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Einstellungen
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="border-gray-500 text-white hover:bg-gray-700"
                >
                  Schließen
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Current Level Display */}
            <div className="text-center mb-8">
              <div className="bg-black/60 rounded-lg p-8 mb-4">
                <div className="text-white text-lg mb-2">Level {currentLevel + 1}</div>
                <div className="text-6xl font-bold text-yellow-500 mb-4">
                  {formatTime(timeLeft)}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-gray-400 text-sm">Small Blind</div>
                    <div className="text-white text-2xl font-bold">€{currentBlind?.small || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Big Blind</div>
                    <div className="text-white text-2xl font-bold">€{currentBlind?.big || 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-400 text-sm">Ante</div>
                    <div className="text-white text-2xl font-bold">€{currentBlind?.ante || 0}</div>
                  </div>
                </div>
              </div>

              {/* Next Level Preview */}
              {nextBlind && (
                <div className="bg-gray-800/40 rounded-lg p-4 mb-6">
                  <div className="text-gray-400 text-sm mb-2">Nächstes Level:</div>
                  <div className="text-white">
                    €{nextBlind.small}/€{nextBlind.big} 
                    {nextBlind.ante > 0 && ` (Ante: €${nextBlind.ante})`}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex justify-center space-x-4 mb-6">
                <Button
                  onClick={handleStart}
                  disabled={isRunning}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
                <Button
                  onClick={handlePause}
                  disabled={!isRunning}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white"
                >
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </Button>
                <Button
                  onClick={handleStop}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
              </div>

              {/* Level Navigation */}
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handlePrevLevel}
                  disabled={currentLevel === 0}
                  variant="outline"
                  className="border-gray-500 text-white hover:bg-gray-700"
                >
                  ← Vorheriges Level
                </Button>
                <Button
                  onClick={handleNextLevel}
                  disabled={currentLevel === blindLevels.length - 1}
                  variant="outline"
                  className="border-gray-500 text-white hover:bg-gray-700"
                >
                  Nächstes Level →
                </Button>
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="border-t border-gray-600 pt-6">
                {/* Structure Name and Save/Load Controls */}
                <div className="mb-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <Input
                      value={structureName}
                      onChange={(e) => setStructureName(e.target.value)}
                      placeholder="Name der Blindstruktur"
                      className="bg-black/50 border-gray-500 text-white flex-1"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={saveBlindStructure}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Speichern
                    </Button>
                    <Button
                      onClick={loadSavedStructure}
                      variant="outline"
                      className="border-gray-500 text-white hover:bg-gray-700"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Laden
                    </Button>
                    <Button
                      onClick={loadTurnier1}
                      className="bg-green-600 hover:bg-green-500 text-white"
                    >
                      Turnier 1
                    </Button>
                    <Button
                      onClick={resetToDefault}
                      variant="outline"
                      className="border-gray-500 text-white hover:bg-gray-700"
                    >
                      Standard
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-lg font-semibold">Blind-Stufen konfigurieren</h3>
                  <Button
                    onClick={addBlindLevel}
                    className="bg-green-600 hover:bg-green-500 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Level hinzufügen
                  </Button>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {blindLevels.map((level, index) => (
                    <div 
                      key={index} 
                      className={`grid grid-cols-5 gap-3 items-center p-3 rounded-lg ${
                        index === currentLevel ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-black/40'
                      }`}
                    >
                      <div className="text-white text-sm font-semibold">
                        Level {index + 1}
                      </div>
                      <Input
                        type="number"
                        value={level.small}
                        onChange={(e) => updateBlindLevel(index, 'small', e.target.value)}
                        placeholder="Small"
                        className="bg-black/50 border-gray-500 text-white text-sm"
                      />
                      <Input
                        type="number"
                        value={level.big}
                        onChange={(e) => updateBlindLevel(index, 'big', e.target.value)}
                        placeholder="Big"
                        className="bg-black/50 border-gray-500 text-white text-sm"
                      />
                      <Input
                        type="number"
                        value={level.ante}
                        onChange={(e) => updateBlindLevel(index, 'ante', e.target.value)}
                        placeholder="Ante"
                        className="bg-black/50 border-gray-500 text-white text-sm"
                      />
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={level.duration}
                          onChange={(e) => updateBlindLevel(index, 'duration', e.target.value)}
                          placeholder="Min"
                          className="bg-black/50 border-gray-500 text-white text-sm w-16"
                        />
                        <span className="text-gray-400 text-xs">min</span>
                        <Button
                          onClick={() => removeBlindLevel(index)}
                          disabled={blindLevels.length <= 1}
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BlindTimer;