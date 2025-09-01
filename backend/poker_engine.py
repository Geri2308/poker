from typing import List, Tuple, Dict, Optional
from collections import Counter
from poker_models import (
    Card, PokerGame, PokerPlayer, PokerHand, HandRanking, 
    PlayerAction, GamePhase, Rank, Suit
)


class PokerEngine:
    """Texas Hold'em Poker Game Engine"""
    
    @staticmethod
    def evaluate_hand(cards: List[Card]) -> PokerHand:
        """Evaluate the best 5-card hand from 7 cards (2 hole + 5 community)"""
        if len(cards) < 5:
            return PokerHand(
                cards=cards,
                ranking=HandRanking.HIGH_CARD,
                rank_value=0,
                description="Invalid hand"
            )
        
        # Get all possible 5-card combinations
        from itertools import combinations
        best_hand = None
        best_value = -1
        
        for combo in combinations(cards, 5):
            hand = PokerEngine._evaluate_5_cards(list(combo))
            if hand.rank_value > best_value:
                best_hand = hand
                best_value = hand.rank_value
        
        return best_hand
    
    @staticmethod
    def _evaluate_5_cards(cards: List[Card]) -> PokerHand:
        """Evaluate exactly 5 cards"""
        cards_sorted = sorted(cards, key=lambda x: x.value, reverse=True)
        ranks = [card.rank for card in cards_sorted]
        suits = [card.suit for card in cards_sorted]
        values = [card.value for card in cards_sorted]
        
        rank_counts = Counter(ranks)
        suit_counts = Counter(suits)
        
        is_flush = len(suit_counts) == 1
        is_straight = PokerEngine._is_straight(values)
        
        # Royal Flush
        if is_flush and is_straight and values[0] == 14:  # Ace high straight
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.ROYAL_FLUSH,
                rank_value=100000,
                description="Royal Flush"
            )
        
        # Straight Flush
        if is_flush and is_straight:
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.STRAIGHT_FLUSH,
                rank_value=90000 + values[0],
                description=f"Straight Flush, {ranks[0]} high"
            )
        
        # Four of a Kind
        if 4 in rank_counts.values():
            quad_rank = [rank for rank, count in rank_counts.items() if count == 4][0]
            kicker = [rank for rank, count in rank_counts.items() if count == 1][0]
            quad_value = Rank(quad_rank).value if hasattr(Rank, quad_rank) else 0
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.FOUR_OF_A_KIND,
                rank_value=80000 + quad_value * 100,
                description=f"Four of a Kind, {quad_rank}s"
            )
        
        # Full House
        if 3 in rank_counts.values() and 2 in rank_counts.values():
            trips = [rank for rank, count in rank_counts.items() if count == 3][0]
            pair = [rank for rank, count in rank_counts.items() if count == 2][0]
            trips_value = next((r.value for r in Rank if r.value == trips), 0)
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.FULL_HOUSE,
                rank_value=70000 + trips_value * 100,
                description=f"Full House, {trips}s over {pair}s"
            )
        
        # Flush
        if is_flush:
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.FLUSH,
                rank_value=60000 + values[0],
                description=f"Flush, {ranks[0]} high"
            )
        
        # Straight
        if is_straight:
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.STRAIGHT,
                rank_value=50000 + values[0],
                description=f"Straight, {ranks[0]} high"
            )
        
        # Three of a Kind
        if 3 in rank_counts.values():
            trips = [rank for rank, count in rank_counts.items() if count == 3][0]
            trips_value = next((r.value for r in Rank if r.value == trips), 0)
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.THREE_OF_A_KIND,
                rank_value=40000 + trips_value * 100,
                description=f"Three of a Kind, {trips}s"
            )
        
        # Two Pair
        pairs = [rank for rank, count in rank_counts.items() if count == 2]
        if len(pairs) == 2:
            high_pair = max(pairs, key=lambda x: next((r.value for r in Rank if r.value == x), 0))
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.TWO_PAIR,
                rank_value=30000 + values[0],
                description=f"Two Pair, {high_pair}s"
            )
        
        # One Pair
        if 2 in rank_counts.values():
            pair = [rank for rank, count in rank_counts.items() if count == 2][0]
            pair_value = next((r.value for r in Rank if r.value == pair), 0)
            return PokerHand(
                cards=cards_sorted,
                ranking=HandRanking.PAIR,
                rank_value=20000 + pair_value * 100,
                description=f"Pair of {pair}s"
            )
        
        # High Card
        return PokerHand(
            cards=cards_sorted,
            ranking=HandRanking.HIGH_CARD,
            rank_value=10000 + values[0],
            description=f"High Card, {ranks[0]}"
        )
    
    @staticmethod
    def _is_straight(values: List[int]) -> bool:
        """Check if values form a straight"""
        values_set = set(values)
        
        # Regular straight
        for i in range(len(values) - 4):
            if all(val in values_set for val in range(values[i] - 4, values[i] + 1)):
                return True
        
        # Ace-low straight (A, 2, 3, 4, 5)
        if {14, 5, 4, 3, 2}.issubset(values_set):
            return True
        
        return False
    
    @staticmethod
    def start_new_hand(game: PokerGame) -> PokerGame:
        """Start a new hand - reset players, deal cards"""
        # Reset all players for new hand
        for player in game.players:
            player.cards = []
            player.current_bet = 0
            player.total_bet = 0
            player.is_folded = False
            player.is_all_in = False
        
        # Reset game state
        game.community_cards = []
        game.pot = 0
        game.current_bet = 0
        game.phase = GamePhase.PRE_FLOP
        game.deck = game.create_deck()
        
        # Post blinds
        PokerEngine._post_blinds(game)
        
        # Deal hole cards
        game.deal_cards()
        
        # Set first player to act (left of big blind)
        game.current_player = (game.dealer_position + 3) % len(game.players)
        
        return game
    
    @staticmethod
    def _post_blinds(game: PokerGame):
        """Post small and big blinds"""
        if len(game.players) < 2:
            return
        
        # Small blind (left of dealer)
        sb_pos = (game.dealer_position + 1) % len(game.players)
        if sb_pos < len(game.players):
            game.players[sb_pos].current_bet = game.small_blind
            game.players[sb_pos].total_bet = game.small_blind
            game.players[sb_pos].chips -= game.small_blind
            game.pot += game.small_blind
        
        # Big blind (left of small blind)
        bb_pos = (game.dealer_position + 2) % len(game.players)
        if bb_pos < len(game.players):
            game.players[bb_pos].current_bet = game.big_blind
            game.players[bb_pos].total_bet = game.big_blind
            game.players[bb_pos].chips -= game.big_blind
            game.pot += game.big_blind
            game.current_bet = game.big_blind
    
    @staticmethod
    def process_action(game: PokerGame, player_id: str, action: PlayerAction, amount: int = 0) -> PokerGame:
        """Process a player action"""
        player = next((p for p in game.players if p.id == player_id), None)
        if not player or player.is_folded:
            return game
        
        if action == PlayerAction.FOLD:
            player.is_folded = True
            game.last_action = f"{player.name} folds"
        
        elif action == PlayerAction.CHECK:
            if player.current_bet == game.current_bet:
                game.last_action = f"{player.name} checks"
            else:
                return game  # Can't check if bet to call
        
        elif action == PlayerAction.CALL:
            call_amount = game.current_bet - player.current_bet
            actual_call = min(call_amount, player.chips)
            player.chips -= actual_call
            player.current_bet += actual_call
            player.total_bet += actual_call
            game.pot += actual_call
            
            if player.chips == 0:
                player.is_all_in = True
                game.last_action = f"{player.name} calls {actual_call} (All-in)"
            else:
                game.last_action = f"{player.name} calls {actual_call}"
        
        elif action == PlayerAction.RAISE:
            if amount <= game.current_bet:
                return game  # Invalid raise
            
            total_bet = min(amount, player.chips + player.current_bet)
            bet_amount = total_bet - player.current_bet
            player.chips -= bet_amount
            player.current_bet = total_bet
            player.total_bet += bet_amount
            game.pot += bet_amount
            game.current_bet = total_bet
            
            if player.chips == 0:
                player.is_all_in = True
                game.last_action = f"{player.name} raises to {total_bet} (All-in)"
            else:
                game.last_action = f"{player.name} raises to {total_bet}"
        
        # Move to next player
        PokerEngine._next_player(game)
        
        # Check if betting round is complete
        if PokerEngine._is_betting_round_complete(game):
            PokerEngine._advance_phase(game)
        
        return game
    
    @staticmethod
    def _next_player(game: PokerGame):
        """Move to next active player"""
        for _ in range(len(game.players)):
            game.current_player = (game.current_player + 1) % len(game.players)
            player = game.players[game.current_player]
            if player.is_active and not player.is_folded and not player.is_all_in:
                break
    
    @staticmethod
    def _is_betting_round_complete(game: PokerGame) -> bool:
        """Check if current betting round is complete"""
        active_players = [p for p in game.players if p.is_active and not p.is_folded]
        
        if len(active_players) <= 1:
            return True
        
        # All players have either folded, called, or are all-in
        for player in active_players:
            if not player.is_all_in and player.current_bet != game.current_bet:
                return False
        
        return True
    
    @staticmethod
    def _advance_phase(game: PokerGame):
        """Advance to next phase of the hand"""
        # Reset current bets for next round
        for player in game.players:
            player.current_bet = 0
        game.current_bet = 0
        
        if game.phase == GamePhase.PRE_FLOP:
            game.phase = GamePhase.FLOP
            game.deal_community_cards(3)  # Deal flop
        elif game.phase == GamePhase.FLOP:
            game.phase = GamePhase.TURN
            game.deal_community_cards(1)  # Deal turn
        elif game.phase == GamePhase.TURN:
            game.phase = GamePhase.RIVER
            game.deal_community_cards(1)  # Deal river
        elif game.phase == GamePhase.RIVER:
            game.phase = GamePhase.SHOWDOWN
            PokerEngine._determine_winner(game)
        
        # Set current player to left of dealer for new betting round
        if game.phase != GamePhase.SHOWDOWN:
            game.current_player = (game.dealer_position + 1) % len(game.players)
    
    @staticmethod
    def _determine_winner(game: PokerGame):
        """Determine winner and distribute pot"""
        active_players = [p for p in game.players if p.is_active and not p.is_folded]
        
        if len(active_players) == 1:
            # Only one player left
            winner = active_players[0]
            winner.chips += game.pot
            game.winner_id = winner.id
            game.last_action = f"{winner.name} wins {game.pot} chips!"
        else:
            # Evaluate hands
            best_hands = {}
            for player in active_players:
                all_cards = player.cards + game.community_cards
                best_hands[player.id] = PokerEngine.evaluate_hand(all_cards)
            
            # Find winner(s)
            best_value = max(hand.rank_value for hand in best_hands.values())
            winners = [
                player for player in active_players 
                if best_hands[player.id].rank_value == best_value
            ]
            
            # Split pot among winners
            pot_per_winner = game.pot // len(winners)
            for winner in winners:
                winner.chips += pot_per_winner
            
            if len(winners) == 1:
                game.winner_id = winners[0].id
                hand_desc = best_hands[winners[0].id].description
                game.last_action = f"{winners[0].name} wins {pot_per_winner} chips with {hand_desc}!"
            else:
                winner_names = ", ".join(w.name for w in winners)
                game.last_action = f"Split pot! {winner_names} each win {pot_per_winner} chips!"
        
        game.phase = GamePhase.FINISHED
        game.pot = 0