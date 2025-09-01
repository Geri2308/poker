from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import random


class Suit(str, Enum):
    HEARTS = "hearts"
    DIAMONDS = "diamonds"
    CLUBS = "clubs"
    SPADES = "spades"


class Rank(str, Enum):
    TWO = "2"
    THREE = "3"
    FOUR = "4"
    FIVE = "5"
    SIX = "6"
    SEVEN = "7"
    EIGHT = "8"
    NINE = "9"
    TEN = "10"
    JACK = "J"
    QUEEN = "Q"
    KING = "K"
    ACE = "A"


class Card(BaseModel):
    suit: Suit
    rank: Rank
    
    def __str__(self):
        return f"{self.rank}{self.suit}"
    
    @property
    def value(self) -> int:
        """Get numeric value for comparison (Ace high)"""
        values = {
            "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8,
            "9": 9, "10": 10, "J": 11, "Q": 12, "K": 13, "A": 14
        }
        return values[self.rank]


class HandRanking(str, Enum):
    HIGH_CARD = "high_card"
    PAIR = "pair"
    TWO_PAIR = "two_pair"
    THREE_OF_A_KIND = "three_of_a_kind"
    STRAIGHT = "straight"
    FLUSH = "flush"
    FULL_HOUSE = "full_house"
    FOUR_OF_A_KIND = "four_of_a_kind"
    STRAIGHT_FLUSH = "straight_flush"
    ROYAL_FLUSH = "royal_flush"


class PlayerAction(str, Enum):
    FOLD = "fold"
    CHECK = "check"
    CALL = "call"
    RAISE = "raise"
    ALL_IN = "all_in"


class GamePhase(str, Enum):
    WAITING = "waiting"
    PRE_FLOP = "pre_flop"
    FLOP = "flop"
    TURN = "turn"
    RIVER = "river"
    SHOWDOWN = "showdown"
    FINISHED = "finished"


class PokerPlayer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    chips: int = 1000  # Starting chips
    cards: List[Card] = []
    current_bet: int = 0
    total_bet: int = 0  # Total bet in current hand
    is_folded: bool = False
    is_all_in: bool = False
    is_active: bool = True
    position: int  # 0-7 for 8 players
    
    class Config:
        json_encoders = {
            Card: lambda v: {"suit": v.suit, "rank": v.rank}
        }


class PokerHand(BaseModel):
    cards: List[Card]
    ranking: HandRanking
    rank_value: int  # For comparison
    description: str


class PokerGame(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    players: List[PokerPlayer] = []
    community_cards: List[Card] = []
    deck: List[Card] = []
    pot: int = 0
    current_bet: int = 0
    small_blind: int = 10
    big_blind: int = 20
    dealer_position: int = 0
    current_player: int = 0
    phase: GamePhase = GamePhase.WAITING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_action: Optional[str] = None
    winner_id: Optional[str] = None
    
    def create_deck(self) -> List[Card]:
        """Create and shuffle a standard 52-card deck"""
        deck = []
        for suit in Suit:
            for rank in Rank:
                deck.append(Card(suit=suit, rank=rank))
        random.shuffle(deck)
        return deck
    
    def deal_cards(self):
        """Deal 2 cards to each active player"""
        if not self.deck:
            self.deck = self.create_deck()
        
        # Deal 2 cards to each player
        for _ in range(2):
            for player in self.players:
                if player.is_active and not player.is_folded:
                    if self.deck:
                        player.cards.append(self.deck.pop())
    
    def deal_community_cards(self, count: int):
        """Deal community cards (flop=3, turn=1, river=1)"""
        if not self.deck:
            return
        
        # Burn one card before dealing
        if self.deck:
            self.deck.pop()
        
        # Deal community cards
        for _ in range(count):
            if self.deck:
                self.community_cards.append(self.deck.pop())


class PokerAction(BaseModel):
    player_id: str
    action: PlayerAction
    amount: int = 0


class GameStateResponse(BaseModel):
    game: PokerGame
    current_player_name: str
    pot: int
    community_cards: List[Card]
    phase: GamePhase
    players_info: List[Dict[str, Any]]  # Public player info
    message: str = ""