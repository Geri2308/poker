import React, { useState, useEffect } from "react";
import "./App.css";
import PersonAmountCard from "./components/PersonAmountCard";
import AdminLogin from "./components/AdminLogin";
import AdminHeader from "./components/AdminHeader";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import OfflineIndicator from "./components/OfflineIndicator";
import { personService } from "./data/mock";
import { useAuth } from "./hooks/useAuth";
import { Button } from "./components/ui/button";
import { Save, RefreshCw } from "lucide-react";
import { toast } from 'sonner';
import { Toaster } from "./components/ui/sonner";

function App() {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Using Sonner toast system
  const { isAdmin, isLoading: authLoading, loginAsAdmin, loginAsViewer, logout, extendSession } = useAuth();

  useEffect(() => {
    if (isAdmin !== null) {
      loadPersons();
      // Reload data every 10 seconds for viewers to see updates
      if (!isAdmin) {
        const interval = setInterval(loadPersons, 10000);
        return () => clearInterval(interval);
      }
      // Extend session on activity for admin
      if (isAdmin) {
        const sessionInterval = setInterval(extendSession, 5 * 60 * 1000);
        return () => clearInterval(sessionInterval);
      }
    }
  }, [isAdmin]);

  const loadPersons = async () => {
    setLoading(true);
    try {
      const loadedPersons = await personService.loadPersons();
      setPersons(loadedPersons);
    } catch (error) {
      console.error('Error loading persons:', error);
      toast.error("Fehler beim Laden: Daten konnten nicht geladen werden. Fallback zu lokalen Daten.");
    } finally {
      setLoading(false);
    }
  };

  // Sortiere Personen nach Betrag (höchster zuerst) - wird clientseitig gemacht für Echtzeit-Updates
  const sortedPersons = [...persons].sort((a, b) => b.amount - a.amount);

  const handleAmountChange = (personId, amount) => {
    if (!isAdmin) return; // Sicherheitscheck
    
    setPersons(prevPersons => 
      prevPersons.map(person => 
        person.id === personId 
          ? { ...person, amount: amount }
          : person
      )
    );
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    
    setSaving(true);
    try {
      const updatedPersons = await personService.savePersons(persons);
      setPersons(updatedPersons);
      toast.success("Gespeichert! Alle Beträge wurden erfolgreich gespeichert.");
    } catch (error) {
      console.error('Error saving persons:', error);
      toast.error("Speicherfehler: Daten konnten nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isAdmin) return;

    setSaving(true);
    try {
      const resetPersons = await personService.resetAllAmounts();
      setPersons(resetPersons);
      toast.success("Zurückgesetzt! Alle Beträge wurden auf 0 zurückgesetzt.");
    } catch (error) {
      console.error('Error resetting amounts:', error);
      toast({
        title: "Reset-Fehler",
        description: "Beträge konnten nicht zurückgesetzt werden.",
        variant: "destructive",
        className: "bg-red-800 border-red-500/30 text-white"
      });
    } finally {
      setSaving(false);
    }
  };

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'url(/poker-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="text-white text-xl">Lädt...</div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (isAdmin === null) {
    return <AdminLogin onAdminLogin={loginAsAdmin} onViewerMode={loginAsViewer} />;
  }

  // Show loading for app data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        backgroundImage: 'url(/poker-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="text-white text-xl">Lädt Rankings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{
      backgroundImage: 'url(/poker-background.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <AdminHeader isAdmin={isAdmin} onLogout={logout} />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Poker-Ranking
          </h1>
        </div>

        <div className="space-y-4 mb-6">
          {sortedPersons.map((person, index) => (
            <PersonAmountCard
              key={person.id}
              person={person}
              rank={index + 1}
              onAmountChange={handleAmountChange}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        {/* Admin-only buttons */}
        {isAdmin && (
          <div className="flex space-x-3 justify-center">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-600 hover:bg-yellow-500 text-gray-900 font-medium transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20 disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Speichert..." : "Speichern"}
            </Button>
            <Button
              onClick={handleReset}
              disabled={saving}
              variant="outline"
              className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10 transition-all duration-300 disabled:opacity-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {saving ? "Setzt zurück..." : "Zurücksetzen"}
            </Button>
          </div>
        )}

        {/* Viewer mode message */}
        {!isAdmin && (
          <div className="text-center">
            <p className="text-white text-sm">
              Sie befinden sich im Ansichtsmodus. Rankings werden automatisch aktualisiert.
            </p>
          </div>
        )}
      </div>
      
      <PWAInstallPrompt />
      <OfflineIndicator />
      <Toaster />
    </div>
  );
}

export default App;