from fastapi import APIRouter, HTTPException
from typing import Dict, List, Any
from poker_models import (
    PokerGame, PokerPlayer, PokerAction, PlayerAction, 
    GameStateResponse, GamePhase
)
from poker_engine import PokerEngine
import logging

logger = logging.getLogger(__name__)

# In-memory game storage (in production, use database)
active_games: Dict[str, PokerGame] = {}

# Known players from the ranking system
KNOWN_PLAYERS = [
    "Geri", "Sepp", "Toni", "Geri Ranner", "Manuel", 
    "Rene", "Gabi", "Roland", "Stefan", "Richi"
]

poker_router = APIRouter(prefix="/api/poker", tags=["Poker"])


@poker_router.post("/game/create")
async def create_game() -> Dict[str, str]:
    """Create a new poker game"""
    game = PokerGame()
    game.deck = game.create_deck()
    active_games[game.id] = game
    
    logger.info(f"Created new poker game: {game.id}")
    return {"game_id": game.id, "message": "Game created successfully"}


@poker_router.post("/game/{game_id}/join")
async def join_game(game_id: str, player_name: str) -> GameStateResponse:
    """Join a poker game"""
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = active_games[game_id]
    
    # Check if player name is allowed
    if player_name not in KNOWN_PLAYERS:
        raise HTTPException(status_code=400, detail="Player not allowed")
    
    # Check if player already in game
    if any(p.name == player_name for p in game.players):
        raise HTTPException(status_code=400, detail="Player already in game")
    
    # Check if game is full (max 8 players)
    if len(game.players) >= 8:
        raise HTTPException(status_code=400, detail="Game is full")
    
    # Add player to game
    player = PokerPlayer(
        name=player_name,
        position=len(game.players),
        chips=1000  # Starting chips
    )
    game.players.append(player)
    
    logger.info(f"Player {player_name} joined game {game_id}")
    
    # If we have enough players and game is waiting, start the game
    if len(game.players) >= 2 and game.phase == GamePhase.WAITING:
        game = PokerEngine.start_new_hand(game)
        logger.info(f"Started new hand in game {game_id}")
    
    return _create_game_state_response(game)


@poker_router.get("/game/{game_id}/state")
async def get_game_state(game_id: str) -> GameStateResponse:
    """Get current game state"""
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = active_games[game_id]
    return _create_game_state_response(game)


@poker_router.post("/game/{game_id}/action")
async def player_action(game_id: str, action: PokerAction) -> GameStateResponse:
    """Process a player action"""
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = active_games[game_id]
    
    # Validate it's the current player's turn
    if game.phase in [GamePhase.WAITING, GamePhase.FINISHED]:
        raise HTTPException(status_code=400, detail="Game not in playing state")
    
    current_player = game.players[game.current_player]
    if current_player.id != action.player_id:
        raise HTTPException(status_code=400, detail="Not your turn")
    
    # Process the action
    game = PokerEngine.process_action(game, action.player_id, action.action, action.amount)
    
    logger.info(f"Player action in game {game_id}: {game.last_action}")
    
    # Check if hand is finished and start new one
    if game.phase == GamePhase.FINISHED:
        # Wait a moment for showdown, then start new hand if players remain
        active_players = [p for p in game.players if p.chips > 0]
        if len(active_players) >= 2:
            # Move dealer button
            game.dealer_position = (game.dealer_position + 1) % len(game.players)
            # Start new hand after a delay (handled by frontend)
            # For now, set to waiting state
            game.phase = GamePhase.WAITING
    
    return _create_game_state_response(game)


@poker_router.post("/game/{game_id}/next-hand")
async def start_next_hand(game_id: str) -> GameStateResponse:
    """Start the next hand"""
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = active_games[game_id]
    
    # Check if we can start a new hand
    active_players = [p for p in game.players if p.chips > 0]
    if len(active_players) < 2:
        raise HTTPException(status_code=400, detail="Not enough players with chips")
    
    # Remove players with no chips
    game.players = [p for p in game.players if p.chips > 0]
    
    # Reassign positions
    for i, player in enumerate(game.players):
        player.position = i
    
    # Start new hand
    game = PokerEngine.start_new_hand(game)
    
    logger.info(f"Started next hand in game {game_id}")
    return _create_game_state_response(game)


@poker_router.get("/game/{game_id}/available-actions/{player_id}")
async def get_available_actions(game_id: str, player_id: str) -> Dict[str, any]:
    """Get available actions for a player"""
    if game_id not in active_games:
        raise HTTPException(status_code=404, detail="Game not found")
    
    game = active_games[game_id]
    player = next((p for p in game.players if p.id == player_id), None)
    
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    if game.phase in [GamePhase.WAITING, GamePhase.FINISHED]:
        return {"actions": [], "can_act": False}
    
    # Check if it's player's turn
    current_player = game.players[game.current_player]
    if current_player.id != player_id or player.is_folded:
        return {"actions": [], "can_act": False}
    
    actions = ["fold"]
    
    # Can check if no bet to call
    if player.current_bet == game.current_bet:
        actions.append("check")
    else:
        # Can call if there's a bet
        call_amount = game.current_bet - player.current_bet
        if player.chips >= call_amount:
            actions.append("call")
    
    # Can raise if player has enough chips
    min_raise = game.current_bet * 2
    if player.chips > (game.current_bet - player.current_bet):
        actions.append("raise")
    
    return {
        "actions": actions,
        "can_act": True,
        "call_amount": max(0, game.current_bet - player.current_bet),
        "min_raise": min_raise,
        "max_bet": player.chips + player.current_bet
    }


def _create_game_state_response(game: PokerGame) -> GameStateResponse:
    """Create a sanitized game state response"""
    current_player_name = ""
    if game.phase not in [GamePhase.WAITING, GamePhase.FINISHED] and game.players:
        current_player_name = game.players[game.current_player].name
    
    # Create public player info (hide hole cards from other players)
    players_info = []
    for player in game.players:
        player_info = {
            "id": player.id,
            "name": player.name,
            "chips": player.chips,
            "current_bet": player.current_bet,
            "total_bet": player.total_bet,
            "is_folded": player.is_folded,
            "is_all_in": player.is_all_in,
            "is_active": player.is_active,
            "position": player.position,
            "cards_count": len(player.cards)  # Don't show actual cards
        }
        
        # Show cards only in showdown phase or if player folded
        if game.phase == GamePhase.SHOWDOWN or game.phase == GamePhase.FINISHED:
            player_info["cards"] = player.cards
            
            # Show hand evaluation
            if not player.is_folded and len(game.community_cards) >= 3:
                all_cards = player.cards + game.community_cards
                if len(all_cards) >= 5:
                    hand = PokerEngine.evaluate_hand(all_cards)
                    player_info["hand"] = {
                        "ranking": hand.ranking,
                        "description": hand.description,
                        "rank_value": hand.rank_value
                    }
        
        players_info.append(player_info)
    
    return GameStateResponse(
        game=game,
        current_player_name=current_player_name,
        pot=game.pot,
        community_cards=game.community_cards,
        phase=game.phase,
        players_info=players_info,
        message=game.last_action or ""
    )