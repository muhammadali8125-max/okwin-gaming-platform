import { UserProfile, Transaction } from "./types";

const STORAGE_KEY_USER = "jjwin_user_profile_v1";
const STORAGE_KEY_TX = "jjwin_transactions_v1";

const DEFAULT_USER: UserProfile = {
  id: "OK-982314",
  username: "Winner_007",
  phone: "+92 300 1234567",
  balance: 5000.0, // Starting trial PKR balance
  bonusBalance: 888.0, // Okwin welcome bonus
  vipLevel: 1,
  vipPoints: 120,
  nextVipPoints: 500,
  referralCode: "OKWIN777",
  referredCount: 3,
  commissionEarned: 1800.0,
  dailyStreak: 1,
  totalDeposits: 12000.0,
  currentTurnover: 45000.0,
  requiredTurnover: 12000.0, // 1x deposit rollover
};

export class WalletManager {
  private static instance: WalletManager;

  private constructor() {}

  public static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }

  public getDefaultUser(): UserProfile {
    return { ...DEFAULT_USER };
  }

  public getUser(): UserProfile {
    if (typeof window === "undefined") return DEFAULT_USER;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_USER,
          ...parsed,
          totalDeposits: typeof parsed.totalDeposits === "number" ? parsed.totalDeposits : DEFAULT_USER.totalDeposits,
          currentTurnover: typeof parsed.currentTurnover === "number" ? parsed.currentTurnover : DEFAULT_USER.currentTurnover,
          requiredTurnover: typeof parsed.requiredTurnover === "number" ? parsed.requiredTurnover : DEFAULT_USER.requiredTurnover,
        };
      }
    } catch {}
    this.saveUser(DEFAULT_USER);
    return DEFAULT_USER;
  }

  public saveUser(user: UserProfile): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
      window.dispatchEvent(new CustomEvent("jjwin_user_updated", { detail: user }));
    } catch {}
  }

  public getTransactions(): Transaction[] {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TX);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  }

  public addTransaction(tx: Omit<Transaction, "id" | "timestamp"> & { id?: string }): Transaction {
    const newTx: Transaction = {
      id: tx.id || "TX-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      ...tx,
      timestamp: Date.now(),
    };
    if (typeof window !== "undefined") {
      try {
        const list = this.getTransactions();
        list.unshift(newTx);
        localStorage.setItem(STORAGE_KEY_TX, JSON.stringify(list.slice(0, 50)));
        window.dispatchEvent(new CustomEvent("jjwin_tx_updated", { detail: list }));
      } catch {}
    }
    return newTx;
  }

  public placeBet(amount: number, gameTitle: string): boolean {
    const user = this.getUser();
    if (user.balance < amount) {
      return false;
    }
    user.balance -= amount;
    user.currentTurnover = Math.round((user.currentTurnover + amount) * 100) / 100;
    user.vipPoints += Math.floor(amount * 0.1);
    // Level up check
    if (user.vipPoints >= user.nextVipPoints && user.vipLevel < 10) {
      user.vipLevel += 1;
      user.nextVipPoints = user.nextVipPoints * 2;
    }
    this.saveUser(user);
    this.addTransaction({
      type: "bet",
      amount,
      gameTitle,
      status: "completed",
    });
    return true;
  }

  public creditWin(amount: number, gameTitle: string): void {
    const user = this.getUser();
    user.balance += amount;
    this.saveUser(user);
    this.addTransaction({
      type: "win",
      amount,
      gameTitle,
      status: "completed",
    });
  }

  public deposit(amount: number, method: string): void {
    const user = this.getUser();
    user.balance += amount;
    user.totalDeposits = Math.round((user.totalDeposits + amount) * 100) / 100;
    // 1x deposit rollover
    user.requiredTurnover = Math.round((user.requiredTurnover + amount * 1.0) * 100) / 100;
    // Add 10% recharge bonus like JJWin
    const bonus = amount * 0.1;
    user.bonusBalance += bonus;
    // 15x bonus rollover
    user.requiredTurnover = Math.round((user.requiredTurnover + bonus * 15.0) * 100) / 100;
    this.saveUser(user);
    this.addTransaction({
      type: "deposit",
      amount,
      method,
      status: "completed",
    });
  }

  public applyBonus(amount: number, reason: string, rolloverMultiplier = 15): void {
    const user = this.getUser();
    user.balance += amount;
    user.bonusBalance += amount;
    // 15x turnover rollover lock on all bonuses
    user.requiredTurnover = Math.round((user.requiredTurnover + amount * rolloverMultiplier) * 100) / 100;
    this.saveUser(user);
    this.addTransaction({
      type: "bonus",
      amount,
      gameTitle: reason,
      status: "completed",
    });
  }

  public getTurnoverStatus(): {
    currentTurnover: number;
    requiredTurnover: number;
    canWithdraw: boolean;
    deficit: number;
    progressPercentage: number;
    isCompliant: boolean;
    remainingTurnover: number;
  } {
    const user = this.getUser();
    const deficit = Math.max(0, Math.round((user.requiredTurnover - user.currentTurnover) * 100) / 100);
    const canWithdraw = deficit <= 0;
    const progressPercentage = user.requiredTurnover > 0
      ? Math.min(100, Math.round((user.currentTurnover / user.requiredTurnover) * 100))
      : 100;

    return {
      currentTurnover: user.currentTurnover,
      requiredTurnover: user.requiredTurnover,
      canWithdraw,
      deficit,
      progressPercentage,
      isCompliant: canWithdraw,
      remainingTurnover: deficit,
    };
  }

  public getTurnoverCompliance() {
    return this.getTurnoverStatus();
  }

  public withdraw(amount: number, method: string, recordId?: string): boolean {
    const user = this.getUser();
    if (user.balance < amount) return false;
    // Operator security: block withdrawal if turnover requirement is not met!
    if (user.currentTurnover < user.requiredTurnover) return false;

    user.balance -= amount;
    this.saveUser(user);
    this.addTransaction({
      id: recordId,
      type: "withdraw",
      amount,
      method,
      status: "pending",
    });
    return true;
  }

  public claimDailyReward(): { success: boolean; amount: number; message: string } {
    const user = this.getUser();
    const today = new Date().toISOString().slice(0, 10);
    if (user.lastDailyRewardDate === today) {
      return { success: false, amount: 0, message: "Already claimed today! Come back tomorrow." };
    }
    const reward = 100 + user.dailyStreak * 50;
    user.balance += reward;
    user.lastDailyRewardDate = today;
    user.dailyStreak = (user.dailyStreak % 7) + 1;
    this.saveUser(user);
    this.addTransaction({
      type: "bonus",
      amount: reward,
      gameTitle: "Daily Sign-in Streak",
      status: "completed",
    });
    return { success: true, amount: reward, message: `Claimed ${reward} PKR Daily Bonus!` };
  }
}

export const wallet = WalletManager.getInstance();
