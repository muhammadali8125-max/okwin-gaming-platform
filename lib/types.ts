export type GameCategory = "hot" | "mini" | "slots" | "fishing" | "cards" | "live" | "sports";

export interface GameItem {
  id: string;
  name: string;
  category: GameCategory;
  provider: string; // e.g., JILI, Spribe, PG Soft, WG
  image: string;
  imageCover?: string;
  isHot?: boolean;
  isNew?: boolean;
  route?: string;
  rating: number;
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdraw" | "bet" | "win" | "bonus" | "commission";
  amount: number;
  gameTitle?: string;
  timestamp: number;
  status: "completed" | "pending" | "failed";
  method?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  phone: string;
  balance: number;
  bonusBalance: number;
  vipLevel: number;
  vipPoints: number;
  nextVipPoints: number;
  referralCode: string;
  referredCount: number;
  commissionEarned: number;
  lastDailyRewardDate?: string;
  dailyStreak: number;
  totalDeposits: number;
  currentTurnover: number;
  requiredTurnover: number;
}
