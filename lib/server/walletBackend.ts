// Server-side Seamless Wallet State & Idempotency Store

export interface ServerUserWallet {
  userId: string;
  username: string;
  currency: string;
  balance: number;
  vipPoints: number;
}

export interface WebhookTransactionRecord {
  transactionId: string;
  referenceId?: string;
  userId: string;
  type: "bet" | "win" | "rollback";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  roundId?: string;
  gameId?: string;
  providerId?: string;
  timestamp: number;
  status: "success" | "failed" | "rolled_back";
}

class ServerWalletBackend {
  private static instance: ServerWalletBackend;

  // In-memory persistent server ledger
  private wallets: Map<string, ServerUserWallet> = new Map();
  private transactions: Map<string, WebhookTransactionRecord> = new Map();
  private idempotencyCache: Map<string, { status: number; body: unknown }> = new Map();

  private constructor() {
    // Initialize default Okwin player wallet
    this.wallets.set("OK-982314", {
      userId: "OK-982314",
      username: "Winner_007",
      currency: "PKR",
      balance: 5000.0,
      vipPoints: 120,
    });
  }

  public static getInstance(): ServerWalletBackend {
    if (!ServerWalletBackend.instance) {
      ServerWalletBackend.instance = new ServerWalletBackend();
    }
    return ServerWalletBackend.instance;
  }

  public getWallet(userId: string): ServerUserWallet {
    if (!this.wallets.has(userId)) {
      // Auto-provision player wallet if first time
      this.wallets.set(userId, {
        userId,
        username: `Player_${userId.slice(-4)}`,
        currency: "PKR",
        balance: 1000.0,
        vipPoints: 0,
      });
    }
    return this.wallets.get(userId)!;
  }

  public getCachedResponse(transactionId: string) {
    return this.idempotencyCache.get(transactionId);
  }

  public setCachedResponse(transactionId: string, status: number, body: unknown) {
    this.idempotencyCache.set(transactionId, { status, body });
  }

  public processBet(
    userId: string,
    amount: number,
    transactionId: string,
    roundId?: string,
    gameId?: string,
    providerId?: string
  ): { success: boolean; code?: string; message: string; balance: number; tx?: WebhookTransactionRecord } {
    const wallet = this.getWallet(userId);

    if (amount <= 0) {
      return { success: false, code: "INVALID_AMOUNT", message: "Bet amount must be greater than 0", balance: wallet.balance };
    }

    if (wallet.balance < amount) {
      return {
        success: false,
        code: "INSUFFICIENT_FUNDS",
        message: `Insufficient balance. Available: ₨ ${wallet.balance}, Required: ₨ ${amount}`,
        balance: wallet.balance,
      };
    }

    const before = wallet.balance;
    wallet.balance = Math.round((wallet.balance - amount) * 100) / 100;
    wallet.vipPoints += Math.floor(amount * 0.1);

    const tx: WebhookTransactionRecord = {
      transactionId,
      userId,
      type: "bet",
      amount,
      balanceBefore: before,
      balanceAfter: wallet.balance,
      roundId,
      gameId,
      providerId,
      timestamp: Date.now(),
      status: "success",
    };

    this.transactions.set(transactionId, tx);

    return {
      success: true,
      message: "Bet successfully deducted",
      balance: wallet.balance,
      tx,
    };
  }

  public processWin(
    userId: string,
    amount: number,
    transactionId: string,
    roundId?: string,
    gameId?: string,
    providerId?: string
  ): { success: boolean; message: string; balance: number; tx: WebhookTransactionRecord } {
    const wallet = this.getWallet(userId);

    const before = wallet.balance;
    wallet.balance = Math.round((wallet.balance + amount) * 100) / 100;

    const tx: WebhookTransactionRecord = {
      transactionId,
      userId,
      type: "win",
      amount,
      balanceBefore: before,
      balanceAfter: wallet.balance,
      roundId,
      gameId,
      providerId,
      timestamp: Date.now(),
      status: "success",
    };

    this.transactions.set(transactionId, tx);

    return {
      success: true,
      message: "Win successfully credited",
      balance: wallet.balance,
      tx,
    };
  }

  public processRollback(
    userId: string,
    referenceBetId: string,
    transactionId: string,
    reason?: string
  ): { success: boolean; code?: string; message: string; balance: number; refundedAmount: number } {
    const wallet = this.getWallet(userId);
    const originalBet = this.transactions.get(referenceBetId);

    if (!originalBet) {
      return {
        success: false,
        code: "BET_NOT_FOUND",
        message: `Original bet transaction ${referenceBetId} not found`,
        balance: wallet.balance,
        refundedAmount: 0,
      };
    }

    if (originalBet.status === "rolled_back") {
      return {
        success: true,
        code: "ALREADY_ROLLED_BACK",
        message: "Bet was already refunded previously",
        balance: wallet.balance,
        refundedAmount: originalBet.amount,
      };
    }

    // Mark original as rolled back and refund player
    originalBet.status = "rolled_back";
    const before = wallet.balance;
    wallet.balance = Math.round((wallet.balance + originalBet.amount) * 100) / 100;

    const rollbackTx: WebhookTransactionRecord = {
      transactionId,
      referenceId: referenceBetId,
      userId,
      type: "rollback",
      amount: originalBet.amount,
      balanceBefore: before,
      balanceAfter: wallet.balance,
      timestamp: Date.now(),
      status: "success",
    };

    this.transactions.set(transactionId, rollbackTx);

    return {
      success: true,
      message: `Bet ${referenceBetId} refunded successfully: ${reason || "Provider Rollback"}`,
      balance: wallet.balance,
      refundedAmount: originalBet.amount,
    };
  }

  public getRecentTransactions(limit = 20): WebhookTransactionRecord[] {
    return Array.from(this.transactions.values()).reverse().slice(0, limit);
  }
}

const globalForWallet = globalThis as unknown as {
  serverWalletInstance?: ServerWalletBackend;
};

export const serverWallet =
  globalForWallet.serverWalletInstance ||
  (globalForWallet.serverWalletInstance = ServerWalletBackend.getInstance());

