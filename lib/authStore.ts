import { UserProfile } from "./types";
import { wallet } from "./walletStore";

const STORAGE_KEY_AUTH_USER = "okwin_auth_session_v1";

export interface AuthSession {
  isLoggedIn: boolean;
  user: UserProfile;
}

class AuthManager {
  private static instance: AuthManager;

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  public getSession(): AuthSession {
    if (typeof window === "undefined") {
      return { isLoggedIn: true, user: wallet.getUser() };
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    // Default logged in demo player
    const defaultSession: AuthSession = {
      isLoggedIn: true,
      user: wallet.getUser(),
    };
    return defaultSession;
  }

  public saveSession(session: AuthSession): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent("okwin_auth_changed", { detail: session }));
    } catch {}
  }

  public login(phone: string, password: string): { success: boolean; message: string } {
    if (!phone || !password) {
      return { success: false, message: "Please enter phone and password" };
    }

    const current = wallet.getUser();
    current.phone = phone;
    wallet.saveUser(current);

    this.saveSession({
      isLoggedIn: true,
      user: current,
    });

    return { success: true, message: `Welcome back, ${current.username}!` };
  }

  public register(
    phone: string,
    username: string,
    password: string,
    referralCode?: string,
    deviceId?: string
  ): { success: boolean; message: string; isBonusClaimed?: boolean } {
    if (!phone || !username || !password) {
      return { success: false, message: "All fields are required" };
    }

    const newUserId = `OK-${Math.floor(100000 + Math.random() * 900000)}`;
    // Multi-Account Device Fingerprint Audit
    const storageKeyClaimed = "okwin_device_bonus_claimed_v1";
    let isDuplicateDevice = false;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKeyClaimed);
        if (stored) {
          isDuplicateDevice = true;
        }
      } catch {}
    }

    const bonusAmount = isDuplicateDevice ? 0.0 : 888.0;
    const requiredTurnover = isDuplicateDevice ? 0.0 : 888.0 * 15;

    const newUser: UserProfile = {
      id: newUserId,
      username,
      phone,
      balance: 1000.0, // Initial balance
      bonusBalance: bonusAmount,
      vipLevel: 1,
      vipPoints: 100,
      nextVipPoints: 500,
      referralCode: referralCode || "OKWIN777",
      referredCount: 0,
      commissionEarned: 0.0,
      dailyStreak: 1,
      totalDeposits: 0,
      currentTurnover: 0,
      requiredTurnover,
    };

    wallet.saveUser(newUser);

    if (!isDuplicateDevice) {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(storageKeyClaimed, JSON.stringify({
            deviceId: deviceId || "DEV-DEFAULT",
            claimedAt: Date.now(),
            phone,
          }));
        } catch {}
      }
      wallet.addTransaction({
        type: "bonus",
        amount: 888.0,
        gameTitle: "₨ 888 New Player Sign-up Bonus",
        status: "completed",
      });
    }

    this.saveSession({
      isLoggedIn: true,
      user: newUser,
    });

    return {
      success: true,
      message: isDuplicateDevice
        ? `Account ${newUserId} created! (₨ 888 Welcome Bonus was already claimed on this device. First deposit gets 100% bonus!)`
        : `Account ${newUserId} created with ₨ 888 Free Bonus!`,
      isBonusClaimed: !isDuplicateDevice,
    };
  }

  public logout(): void {
    const guestUser: UserProfile = {
      id: "GUEST-000",
      username: "Guest_Player",
      phone: "+92 300 0000000",
      balance: 0.0,
      bonusBalance: 0.0,
      vipLevel: 0,
      vipPoints: 0,
      nextVipPoints: 500,
      referralCode: "OKWIN777",
      referredCount: 0,
      commissionEarned: 0.0,
      dailyStreak: 0,
      totalDeposits: 0,
      currentTurnover: 0,
      requiredTurnover: 0,
    };

    this.saveSession({
      isLoggedIn: false,
      user: guestUser,
    });
  }
}

export const authStore = AuthManager.getInstance();
