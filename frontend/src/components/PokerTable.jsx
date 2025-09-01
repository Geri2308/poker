import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Spade, Heart, Diamond, Club, 
  DollarSign, Users, Play, RotateCcw,
  Crown, Star
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Card suit icons
const suitIcons = {
  spades: Spade,
  hearts: Heart,
  diamonds: Diamond,
  clubs: Club
};

// Card colors
const suitColors = {
  spades: 'text-black',
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-black'
};

const PokerCard = ({ card, isHidden = false }) => {
  if (isHidden) {
    return (
      <div className="w-12 h-16 bg-blue-800 border border-blue-600 rounded-lg flex items-center justify-center">
        <div className="w-8 h-10 bg-blue-900 rounded border border-blue-500"></div>
      </div>
    );
  }

  if (!card) return null;

  const SuitIcon = suitIcons[card.suit];
  const colorClass = suitColors[card.suit];

  return (
    <div className="w-12 h-16 bg-white border border-gray-300 rounded-lg flex flex-col items-center justify-center text-xs font-bold shadow-md">
      <div className={`${colorClass} text-lg leading-none`}>{card.rank}</div>
      <SuitIcon className={`w-3 h-3 ${colorClass}`} />
    </div>
  );
};

const PlayerPosition = ({ player, position, isCurrentPlayer, onPlayerAction, availableActions, gamePhase, isCurrentUser = false }) => {
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showActions, setShowActions] = useState(false);

  // Optimized position styles for 8-player table (no overlaps)
  const positionStyles = {
    0: 'absolute bottom-4 left-1/2 transform -translate-x-1/2', // Bottom center (current user)
    1: 'absolute bottom-16 left-12', // Bottom left
    2: 'absolute left-4 top-1/2 transform -translate-y-1/2', // Left center
    3: 'absolute top-16 left-12', // Top left
    4: 'absolute top-4 left-1/2 transform -translate-x-1/2', // Top center
    5: 'absolute top-16 right-12', // Top right
    6: 'absolute right-4 top-1/2 transform -translate-y-1/2', // Right center
    7: 'absolute bottom-16 right-12' // Bottom right
  };

  const handleAction = (action, amount = 0) => {
    onPlayerAction(player.id, action, amount);
    setShowActions(false);
    setRaiseAmount(0);
  };

  return (
    <div className={`${positionStyles[position]} w-32`}>
      <div className={`bg-gray-800 rounded-lg p-2 border-2 ${
        isCurrentPlayer ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' : 'border-gray-600'
      }`}>
        {/* Player name and chips */}
        <div className="text-center mb-1">
          <div className="text-white text-sm font-bold flex items-center justify-center gap-1">
            {player.name}
            {position === 0 && <Crown className="w-3 h-3 text-yellow-400" />}
          </div>
          <div className="text-yellow-400 text-xs flex items-center justify-center gap-1">
            <DollarSign className="w-3 h-3" />
            {player.chips}
          </div>
        </div>

        {/* Player cards */}
        <div className="flex justify-center gap-1 mb-2">
          {player.cards && player.cards.length > 0 ? (
            player.cards.map((card, idx) => (
              <PokerCard key={idx} card={card} isHidden={!isCurrentUser && gamePhase !== 'showdown' && gamePhase !== 'finished'} />
            ))
          ) : (
            <>
              <PokerCard isHidden={!isCurrentUser} />
              <PokerCard isHidden={!isCurrentUser} />
            </>
          )}
        </div>

        {/* Player status */}
        <div className="text-center text-xs">
          {player.is_folded && <Badge variant="destructive" className="text-xs">Folded</Badge>}
          {player.is_all_in && <Badge variant="secondary" className="text-xs">All-in</Badge>}
          {player.current_bet > 0 && !player.is_folded && (
            <div className="text-green-400">Bet: ${player.current_bet}</div>
          )}
        </div>

        {/* Hand evaluation (showdown) */}
        {player.hand && gamePhase === 'showdown' && (
          <div className="text-center text-xs text-blue-400 mt-1">
            {player.hand.description}
          </div>
        )}

        {/* Action buttons for current user */}
        {isCurrentPlayer && isCurrentUser && availableActions && availableActions.can_act && (
          <div className="mt-2">
            {!showActions ? (
              <Button 
                size="sm" 
                className="w-full text-xs bg-green-600 hover:bg-green-500"
                onClick={() => setShowActions(true)}
              >
                Your Turn
              </Button>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {availableActions.actions.includes('check') && (
                    <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => handleAction('check')}>
                      Check
                    </Button>
                  )}
                  {availableActions.actions.includes('call') && (
                    <Button size="sm" className="text-xs flex-1 bg-blue-600 hover:bg-blue-500" onClick={() => handleAction('call')}>
                      Call ${availableActions.call_amount}
                    </Button>
                  )}
                </div>
                <div className="flex gap-1">
                  {availableActions.actions.includes('raise') && (
                    <div className="flex gap-1 w-full">
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={raiseAmount}
                        onChange={(e) => setRaiseAmount(parseInt(e.target.value) || 0)}
                        className="text-xs h-6 w-16"
                        min={availableActions.min_raise}
                        max={availableActions.max_bet}
                      />
                      <Button 
                        size="sm" 
                        className="text-xs bg-red-600 hover:bg-red-500"
                        onClick={() => handleAction('raise', raiseAmount)}
                        disabled={raiseAmount < availableActions.min_raise}
                      >
                        Raise
                      </Button>
                    </div>
                  )}
                  <Button size="sm" variant="destructive" className="text-xs" onClick={() => handleAction('fold')}>
                    Fold
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const PokerTable = ({ onClose, currentUser }) => {
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [availableActions, setAvailableActions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [joinGameId, setJoinGameId] = useState('');
  const [showGameId, setShowGameId] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(0);
  const [showLobby, setShowLobby] = useState(false);
  const [availableGames, setAvailableGames] = useState([]);

  // KNOWN_PLAYERS from backend
  const KNOWN_PLAYERS = [
    "Geri", "Sepp", "Toni", "Geri Ranner", "Manuel", 
    "Rene", "Gabi", "Roland", "Stefan", "Richi"
  ];

  useEffect(() => {
    if (autoRefresh && gameId) {
      const interval = setInterval(() => {
        fetchGameState();
        if (gameState && selectedPlayer) {
          fetchAvailableActions();
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [gameId, selectedPlayer, autoRefresh]);

  const createGame = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/poker/game/create`);
      setGameId(response.data.game_id);
      setShowGameId(true);
      toast.success('Poker game created! Share the Game ID with other players! 🎰');
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const joinExistingGame = async (gameId) => {
    if (!gameId || !gameId.trim()) {
      toast.error('Please enter a valid Game ID');
      return;
    }
    
    setLoading(true);
    try {
      // First check if game exists by trying to get its state
      const stateResponse = await axios.get(`${API}/poker/game/${gameId.trim()}/state`);
      if (stateResponse.status === 200) {
        setGameId(gameId.trim());
        toast.success('Found game! Choose your player to join. 🎯');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      if (error.response?.status === 404) {
        toast.error('Game not found! Check the Game ID and try again.');
      } else {
        toast.error('Failed to join game');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableGames = async () => {
    try {
      const response = await axios.get(`${API}/poker/games/lobby`);
      setAvailableGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching games:', error);
    }
  };

  const joinGameFromLobby = (gameId) => {
    setGameId(gameId);
    setShowLobby(false);
    toast.success('Joining game from lobby! 🎯');
  };

  // Fetch available games when showing lobby
  useEffect(() => {
    if (showLobby) {
      fetchAvailableGames();
      const interval = setInterval(fetchAvailableGames, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [showLobby]);

  const joinGame = async (playerName) => {
    if (!gameId) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/poker/game/${gameId}/join?player_name=${playerName}`);
      setGameState(response.data);
      setSelectedPlayer(playerName);
      toast.success(`${playerName} joined the game! 🃏`);
    } catch (error) {
      console.error('Error joining game:', error);
      toast.error(error.response?.data?.detail || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const fetchGameState = async () => {
    if (!gameId) return;
    
    try {
      const response = await axios.get(`${API}/poker/game/${gameId}/state`);
      setGameState(response.data);
    } catch (error) {
      console.error('Error fetching game state:', error);
    }
  };

  const fetchAvailableActions = async () => {
    if (!gameId || !selectedPlayer) return;
    
    try {
      const playerData = gameState?.players_info?.find(p => p.name === selectedPlayer);
      if (playerData) {
        const response = await axios.get(`${API}/poker/game/${gameId}/available-actions/${playerData.id}`);
        setAvailableActions(response.data);
      }
    } catch (error) {
      console.error('Error fetching available actions:', error);
    }
  };

  const handlePlayerAction = async (playerId, action, amount = 0) => {
    if (!gameId) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/poker/game/${gameId}/action`, {
        player_id: playerId,
        action: action,
        amount: amount
      });
      setGameState(response.data);
      toast.success(`Action: ${action.toUpperCase()}`);
      
      // Refresh available actions
      setTimeout(() => {
        fetchAvailableActions();
      }, 500);
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error(error.response?.data?.detail || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const startNextHand = async () => {
    if (!gameId) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/poker/game/${gameId}/next-hand`);
      setGameState(response.data);
      toast.success('New hand started! 🎰');
    } catch (error) {
      console.error('Error starting next hand:', error);
      toast.error(error.response?.data?.detail || 'Failed to start next hand');
    } finally {
      setLoading(false);
    }
  };

  const currentPlayerData = gameState?.players_info?.find(p => p.name === selectedPlayer);
  const isCurrentTurn = gameState?.current_player_name === selectedPlayer;

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
      <div className="bg-black/90 backdrop-blur-sm rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="bg-transparent border-none shadow-none">
          <CardHeader className="border-b border-gray-600">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-2xl flex items-center space-x-2">
                <Star className="h-6 w-6 text-yellow-500" />
                <span>Casino Poker Table</span>
              </CardTitle>
              <div className="flex space-x-2">
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
            {!gameId ? (
              // Game creation screen
              <div className="text-center space-y-6">
                <h3 className="text-white text-xl">Welcome to Casino Poker</h3>
                <p className="text-gray-300">Texas Hold'em • 8 Players Max • Fun Chips</p>
                
                {/* Create New Game */}
                <div className="space-y-3">
                  <Button 
                    onClick={createGame} 
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 w-full"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Create New Game
                  </Button>
                </div>
                
                {/* Join Existing Game */}
                <div className="border-t border-gray-600 pt-6">
                  <h4 className="text-white text-lg mb-3">Join Existing Game</h4>
                  <div className="flex space-x-2">
                    <Input
                      type="text"
                      placeholder="Enter Game ID"
                      value={joinGameId}
                      onChange={(e) => setJoinGameId(e.target.value)}
                      className="bg-black/50 border-gray-500 text-white flex-1"
                    />
                    <Button 
                      onClick={() => joinExistingGame(joinGameId)} 
                      disabled={loading || !joinGameId.trim()}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6"
                    >
                      Join Game
                    </Button>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    Ask another player for their Game ID to join their table
                  </p>
                </div>
              </div>
            ) : !selectedPlayer ? (
              // Player selection screen
              <div className="text-center space-y-4">
                <h3 className="text-white text-xl">Choose Your Player</h3>
                
                {/* Show Game ID for sharing */}
                {showGameId && (
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="text-yellow-400 text-lg font-bold mb-2">🎯 Game Created!</h4>
                    <p className="text-white text-sm mb-2">Share this Game ID with other players:</p>
                    <div className="bg-black rounded p-3 font-mono text-yellow-400 text-lg">
                      {gameId}
                    </div>
                    <p className="text-gray-400 text-xs mt-2">
                      Other players can use "Join Existing Game" with this ID
                    </p>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(gameId);
                        toast.success('Game ID copied to clipboard! 📋');
                      }}
                      className="mt-2 bg-green-600 hover:bg-green-500 text-white text-sm"
                    >
                      Copy Game ID
                    </Button>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {KNOWN_PLAYERS.map(player => (
                    <Button
                      key={player}
                      onClick={() => joinGame(player)}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      {player}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // Main poker table
              <div className="space-y-4">
                {/* Game info */}
                <div className="flex justify-between items-center text-white">
                  <div className="flex items-center space-x-4">
                    <Badge variant="outline" className="text-white border-white">
                      {gameState?.phase || 'Waiting'}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">Pot: {gameState?.pot || 0}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>{gameState?.players_info?.length || 0}/8 Players</span>
                    </div>
                    <div className="flex items-center space-x-2 cursor-pointer" 
                         onClick={() => {
                           navigator.clipboard.writeText(gameId);
                           toast.success('Game ID copied! Share with friends! 📋');
                         }}
                         title="Click to copy Game ID">
                      <Badge variant="outline" className="text-yellow-400 border-yellow-400 hover:bg-yellow-400/10">
                        ID: {gameId?.substring(0, 8)}...
                      </Badge>
                    </div>
                  </div>
                  <div className="space-x-2">
                    {gameState?.phase === 'finished' && (
                      <Button 
                        onClick={startNextHand} 
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-500"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Next Hand
                      </Button>
                    )}
                  </div>
                </div>

                {/* Poker table */}
                <div className="relative bg-green-800 rounded-full h-96 w-full border-8 border-yellow-600 shadow-2xl">
                  {/* Community cards in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex gap-2 justify-center mb-2">
                        {gameState?.community_cards?.map((card, idx) => (
                          <PokerCard key={idx} card={card} />
                        ))}
                        {/* Placeholder for remaining community cards */}
                        {Array.from({ length: 5 - (gameState?.community_cards?.length || 0) }).map((_, idx) => (
                          <div key={idx} className="w-12 h-16 bg-green-700 border border-green-600 rounded-lg opacity-50"></div>
                        ))}
                      </div>
                      <div className="text-white text-sm">Community Cards</div>
                    </div>
                  </div>

                  {/* Player positions */}
                  {gameState?.players_info?.map((player, idx) => (
                    <PlayerPosition
                      key={player.id}
                      player={player}
                      position={player.position}
                      isCurrentPlayer={isCurrentTurn && player.name === selectedPlayer}
                      isCurrentUser={player.name === selectedPlayer}
                      onPlayerAction={handlePlayerAction}
                      availableActions={availableActions}
                      gamePhase={gameState.phase}
                    />
                  ))}
                </div>

                {/* Game messages */}
                {gameState?.message && (
                  <div className="text-center">
                    <Badge variant="outline" className="text-yellow-400 border-yellow-400 px-4 py-2">
                      {gameState.message}
                    </Badge>
                  </div>
                )}

                {/* Action Panel - Bottom Right */}
                {currentPlayerData && isCurrentTurn && availableActions?.can_act && (
                  <div className="absolute bottom-4 right-4 bg-gray-900/95 rounded-lg p-4 border-2 border-yellow-400 shadow-2xl min-w-[280px]">
                    <h4 className="text-yellow-400 font-bold mb-3 text-center">Your Turn</h4>
                    
                    {/* Quick Actions Row */}
                    <div className="flex gap-2 mb-3">
                      {availableActions.actions.includes('fold') && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1 bg-red-600 hover:bg-red-500"
                          onClick={() => handlePlayerAction(currentPlayerData.id, 'fold')}
                        >
                          Fold
                        </Button>
                      )}
                      {availableActions.actions.includes('check') && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gray-600 hover:bg-gray-500"
                          onClick={() => handlePlayerAction(currentPlayerData.id, 'check')}
                        >
                          Check
                        </Button>
                      )}
                      {availableActions.actions.includes('call') && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-blue-600 hover:bg-blue-500"
                          onClick={() => handlePlayerAction(currentPlayerData.id, 'call')}
                        >
                          Call ${availableActions.call_amount}
                        </Button>
                      )}
                    </div>

                    {/* Raise Section with Slider */}
                    {availableActions.actions.includes('raise') && (
                      <div className="space-y-3">
                        <div className="text-white text-sm">
                          <div className="flex justify-between">
                            <span>Raise Amount:</span>
                            <span className="text-yellow-400 font-bold">${raiseAmount}</span>
                          </div>
                        </div>
                        
                        {/* Raise Slider */}
                        <div className="space-y-2">
                          <input
                            type="range"
                            min={availableActions.min_raise || gameState?.current_bet * 2}
                            max={Math.min(availableActions.max_bet || currentPlayerData.chips, currentPlayerData.chips + currentPlayerData.current_bet)}
                            value={raiseAmount}
                            onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                            style={{
                              background: `linear-gradient(to right, #fbbf24 0%, #fbbf24 ${((raiseAmount - (availableActions.min_raise || gameState?.current_bet * 2)) / ((Math.min(availableActions.max_bet || currentPlayerData.chips, currentPlayerData.chips + currentPlayerData.current_bet)) - (availableActions.min_raise || gameState?.current_bet * 2))) * 100}%, #374151 ${((raiseAmount - (availableActions.min_raise || gameState?.current_bet * 2)) / ((Math.min(availableActions.max_bet || currentPlayerData.chips, currentPlayerData.chips + currentPlayerData.current_bet)) - (availableActions.min_raise || gameState?.current_bet * 2))) * 100}%, #374151 100%)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Min: ${availableActions.min_raise}</span>
                            <span>Max: ${Math.min(availableActions.max_bet || currentPlayerData.chips, currentPlayerData.chips + currentPlayerData.current_bet)}</span>
                          </div>
                        </div>

                        {/* Raise Button */}
                        <Button 
                          className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2"
                          onClick={() => handlePlayerAction(currentPlayerData.id, 'raise', raiseAmount)}
                          disabled={raiseAmount < (availableActions.min_raise || gameState?.current_bet * 2)}
                        >
                          Raise to ${raiseAmount}
                        </Button>

                        {/* Quick Bet Buttons */}
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs border-gray-500 text-gray-300 hover:bg-gray-700"
                            onClick={() => setRaiseAmount(availableActions.min_raise || gameState?.current_bet * 2)}
                          >
                            Min
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs border-gray-500 text-gray-300 hover:bg-gray-700"
                            onClick={() => setRaiseAmount(Math.floor(gameState?.pot * 0.75) || gameState?.current_bet * 3)}
                          >
                            3/4 Pot
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs border-gray-500 text-gray-300 hover:bg-gray-700"
                            onClick={() => setRaiseAmount(gameState?.pot || gameState?.current_bet * 4)}
                          >
                            Pot
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 text-xs border-gray-500 text-gray-300 hover:bg-gray-700"
                            onClick={() => setRaiseAmount(Math.min(availableActions.max_bet || currentPlayerData.chips, currentPlayerData.chips + currentPlayerData.current_bet))}
                          >
                            All-In
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Current player info */}
                {currentPlayerData && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-white font-bold mb-2">Your Info: {selectedPlayer}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-gray-300">
                        <div>Chips:</div>
                        <div className="text-yellow-400 font-bold">${currentPlayerData.chips}</div>
                      </div>
                      <div className="text-gray-300">
                        <div>Current Bet:</div>
                        <div className="text-green-400 font-bold">${currentPlayerData.current_bet}</div>
                      </div>
                      <div className="text-gray-300">
                        <div>Total Bet:</div>
                        <div className="text-blue-400 font-bold">${currentPlayerData.total_bet}</div>
                      </div>
                      <div className="text-gray-300">
                        <div>Status:</div>
                        <div className={`font-bold ${
                          currentPlayerData.is_folded ? 'text-red-400' : 
                          currentPlayerData.is_all_in ? 'text-purple-400' : 'text-green-400'
                        }`}>
                          {currentPlayerData.is_folded ? 'Folded' : 
                           currentPlayerData.is_all_in ? 'All-in' : 'Active'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PokerTable;