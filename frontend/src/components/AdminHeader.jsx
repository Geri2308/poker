import React from 'react';
import { Button } from './ui/button';
import { Crown, Eye, LogOut } from 'lucide-react';

const AdminHeader = ({ isAdmin, onLogout }) => {
  return (
    <div className="bg-black/60 backdrop-blur-sm border-b border-gray-600 px-4 py-3 mb-4">
      <div className="container mx-auto max-w-2xl flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isAdmin ? (
            <>
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="text-white font-medium">Admin-Modus</span>
              <span className="text-blue-300 text-sm">• Vollzugriff</span>
            </>
          ) : (
            <>
              <Eye className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">Ansichtsmodus</span>
              <span className="text-blue-300 text-sm">• Nur lesen</span>
            </>
          )}
        </div>
        
        <Button
          onClick={onLogout}
          variant="ghost"
          size="sm"
          className="text-white hover:text-yellow-500 hover:bg-blue-800/50"
        >
          <LogOut className="h-4 w-4 mr-1" />
          Abmelden
        </Button>
      </div>
    </div>
  );
};

export default AdminHeader;