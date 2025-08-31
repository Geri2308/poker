import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';

const OfflineIndicator = () => {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="bg-red-800/90 backdrop-blur-sm border border-red-500/30 rounded-lg p-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4 text-red-300" />
          <span className="text-red-100 text-sm font-medium">
            Offline Modus
          </span>
        </div>
        <p className="text-red-200 text-xs mt-1">
          Änderungen werden synchronisiert, sobald die Verbindung wiederhergestellt ist.
        </p>
      </div>
    </div>
  );
};

export default OfflineIndicator;