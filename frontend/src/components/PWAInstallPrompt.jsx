import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, X, Smartphone } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (running in standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(standalone);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS install instructions if on iOS and not installed
    if (iOS && !standalone) {
      setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember user dismissed it
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already dismissed or if running as installed app
  if (isStandalone || localStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-gray-800/95 backdrop-blur-sm border border-yellow-500/30 rounded-lg p-4 shadow-lg shadow-yellow-500/10">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-yellow-500"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-yellow-500 font-medium text-sm">
              Als App installieren
            </h3>
            <p className="text-gray-300 text-xs mt-1">
              {isIOS 
                ? 'Tippe auf "Teilen" und dann "Zum Home-Bildschirm" für bessere Nutzung.'
                : 'Installiere die App für schnelleren Zugriff und Offline-Nutzung.'
              }
            </p>
            {!isIOS && (
              <Button
                onClick={handleInstallClick}
                className="mt-3 bg-yellow-600 hover:bg-yellow-500 text-gray-900 text-xs h-8 px-3"
              >
                <Download className="h-3 w-3 mr-1" />
                Installieren
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;