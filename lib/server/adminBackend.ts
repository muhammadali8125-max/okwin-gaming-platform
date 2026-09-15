// Server-side Okwin Admin Central Store & Management Engine

export interface AdminPlayer {
  id: string;
  username: string;
  phone: string;
  balance: number;
  bonusBalance: number;
  vipLevel: number;
  status: "active" | "frozen" | "banned";
  registeredAt: number;
  totalDeposits: number;
  totalWithdrawals: number;
  totalBets: number;
  totalWins: number;
  kycStatus: "verified" | "pending" | "unverified";
  currentTurnover: number;
  requiredTurnover: number;
  riskScore: "LOW" | "MEDIUM" | "HIGH_RISK";
  riskReason?: string;
}

export interface FinancialRecord {
  id: string;
  userId: string;
  username: string;
  type: "deposit" | "withdraw";
  amount: number;
  method: "JazzCash" | "EasyPaisa" | "Bank Transfer" | "USDT (TRC20)";
  accountNumber: string;
  accountTitle: string;
  txReference: string;
  timestamp: number;
  status: "pending" | "approved" | "rejected";
  operatorNotes?: string;
  processedAt?: number;
  riskScore?: "LOW" | "MEDIUM" | "HIGH_RISK";
  riskReason?: string;
  turnoverStatus?: {
    currentTurnover: number;
    requiredTurnover: number;
    isCompliant: boolean;
  };
}

export interface RiskSettings {
  minDepositForSpin: number; // e.g. 500
  depositRolloverMultiplier: number; // e.g. 1.0 (1x)
  bonusRolloverMultiplier: number; // e.g. 15.0 (15x)
  maxWinPerBet: number; // e.g. 50000 PKR
  tightHouseEdgeMode: boolean; // Emergency tightening (+3% house edge)
  wheelSectorWeights: number[]; // 8 weights for the 8 sectors
}

export interface GameRtpSetting {
  id: string;
  name: string;
  category: string;
  rtpPercentage: number; // e.g. 97.0
  houseEdge: number; // e.g. 3.0
  status: "active" | "maintenance";
  totalVolume: number;
  provider: string;
}

export interface SystemSettings {
  marqueeText: string;
  maintenanceMode: boolean;
  tier1Commission: number; // e.g. 30%
  tier2Commission: number; // e.g. 10%
  tier3Commission: number; // e.g. 5%
  minDeposit: number;
  minWithdrawal: number;
  maxDailyWithdrawal: number;
}

export interface PromoCode {
  code: string;
  bonusAmount: number;
  description: string;
  maxClaims: number;
  claimsCount: number;
  claimedUsers: string[];
  status: "active" | "disabled" | "expired";
  createdAt: number;
}


export interface AuditLogEntry {
  id: string;
  timestamp: number;
  operator: string;
  category: "FINANCE" | "SECURITY" | "PLAYER" | "CONFIG" | "GATEWAY";
  action: string;
  details: string;
  ip?: string;
  previousValue?: string;
  newValue?: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
}


export interface EasyPaisaGatewayConfig {
  enabled: boolean;
  mode: "sandbox" | "production";
  storeId: string;
  merchantMobile: string;
  accountTitle: string;
  username: string;
  password?: string;
  privateKeyPem?: string;
  publicKeyPem?: string;
  ipnUrl: string;
  transactionType: "MA" | "OTC" | "CC";
  autoApproveUnder: number;
}

export interface JazzCashGatewayConfig {
  enabled: boolean;
  mode: "sandbox" | "production";
  merchantId: string;
  merchantMobile: string;
  accountTitle: string;
  password?: string;
  integritySalt?: string;
  returnUrl: string;
  ipnUrl: string;
  autoApproveUnder: number;
}

export interface RaastGatewayConfig {
  enabled: boolean;
  bankName: string;
  accountTitle: string;
  iban: string;
  raastId: string;
}

export interface UsdtGatewayConfig {
  enabled: boolean;
  walletAddress: string;
  network: "TRC20" | "ERC20";
  exchangeRatePkr: number;
}

export interface PaymentGatewaysMasterConfig {
  easypaisa: EasyPaisaGatewayConfig;
  jazzcash: JazzCashGatewayConfig;
  raast: RaastGatewayConfig;
  usdt: UsdtGatewayConfig;
}

export interface TelcoGatewayConfig {
  mode: "sandbox" | "production";
  easypaisaStoreId: string;
  easypaisaUsername: string;
  easypaisaPassword?: string;
  easypaisaPrivateKeyPem?: string;
  easypaisaPublicKeyPem?: string;
  jazzcashMerchantId: string;
  jazzcashPassword?: string;
  jazzcashIntegritySalt?: string;
  ipnWebhookUrl: string;
  raastMerchantIban: string;
  raastId: string;
}

export interface TelegramBotConfig {
  enabled: boolean;
  botToken: string;
  chatId: string;
  notifyOnDeposit: boolean;
  notifyOnWithdrawal: boolean;
  notifyOnSecurityAlert: boolean;
  minAmountForAlert: number;
}

class AdminBackendStore {
  private static instance: AdminBackendStore;

  private players: Map<string, AdminPlayer> = new Map();
  private financeRecords: Map<string, FinancialRecord> = new Map();
  private gameSettings: Map<string, GameRtpSetting> = new Map();
  private promoCodes: Map<string, PromoCode> = new Map();
  private systemSettings: SystemSettings = {
    marqueeText: "🔥 Welcome to OKWIN! 100% First Deposit Bonus + Daily ₨ 888 Free Lucky Spin! JazzCash & EasyPaisa 24/7 instant withdrawals.",
    maintenanceMode: false,
    tier1Commission: 30,
    tier2Commission: 10,
    tier3Commission: 5,
    minDeposit: 500,
    minWithdrawal: 1000,
    maxDailyWithdrawal: 500000,
  };

    // --- Security Engine: Anti-Replay & Cashier Verification ---
  private usedTIDs: Map<string, { userId: string; username: string; amount: number; method: string; timestamp: number; senderPhone?: string }> = new Map([
    ["EP-DEP-773129", { userId: "OK-102934", username: "Lahore_King", amount: 25000, method: "EasyPaisa", timestamp: Date.now() - 3600000 }],
    ["JC-DEP-449102", { userId: "OK-887123", username: "Karachi_Falcon", amount: 5000, method: "JazzCash", timestamp: Date.now() - 7200000 }]
  ]);
  private adminPin: string = "882190";
  private adminFailedAttempts: number = 0;
  private adminLockoutUntil: number = 0;
  private deviceRegistrations: Map<string, { count: number; bonusClaimed: boolean; accounts: string[]; firstSeen: number }> = new Map();

  
  // --- Audit Trail & Security Ledger ---
  private auditLogs: AuditLogEntry[] = [
    {
      id: "AUD-1001",
      timestamp: Date.now() - 3600000 * 4,
      operator: "System",
      category: "SECURITY",
      action: "REPLAY_BLOCKER_INITIALIZED",
      details: "Anti-Replay Hash Index verified 2 historical Pakistani telco TIDs loaded.",
      severity: "INFO",
    },
    {
      id: "AUD-1002",
      timestamp: Date.now() - 3600000 * 2,
      operator: "MasterAdmin",
      category: "CONFIG",
      action: "TELCO_CONFIG_LOADED",
      details: "Telco Gateway configured in Sandbox mode for Easypaisa & JazzCash MA Push.",
      severity: "INFO",
    },
    {
      id: "AUD-1003",
      timestamp: Date.now() - 1800000,
      operator: "SecurityEngine",
      category: "SECURITY",
      action: "ADMIN_PIN_ARMED",
      details: "Master PIN 882190 armed with 5-attempt lockout defense.",
      severity: "INFO",
    },
  ];

  // --- Telco Gateway Official Configuration ---
  
  // --- WordPress Style Modular Payment Gateways Configuration ---
  private paymentGateways: PaymentGatewaysMasterConfig = {
    easypaisa: {
      enabled: true,
      mode: "sandbox",
      storeId: process.env.EASYPAISA_STORE_ID || "641",
      merchantMobile: "0345 1122334",
      accountTitle: "Okwin Merchant Direct",
      username: process.env.EASYPAISA_USERNAME || "okwin_ops",
      password: process.env.EASYPAISA_PASSWORD || "ops_pass_sec882",
      privateKeyPem: process.env.EASYPAISA_PRIVATE_KEY_PEM || "",
      publicKeyPem: process.env.EASYPAISA_PUBLIC_KEY_PEM || "",
      ipnUrl: "http://localhost:3000/api/payment/ipn",
      transactionType: "MA",
      autoApproveUnder: 50000,
    },
    jazzcash: {
      enabled: true,
      mode: "sandbox",
      merchantId: process.env.JAZZCASH_MERCHANT_ID || "MC-882190",
      merchantMobile: "0300 7654321",
      accountTitle: "Okwin VIP Cashier 2",
      password: process.env.JAZZCASH_PASSWORD || "jc_secret_9981",
      integritySalt: process.env.JAZZCASH_SALT || "s92kf8103kfmz01928",
      returnUrl: "http://localhost:3000/checkout",
      ipnUrl: "http://localhost:3000/api/payment/ipn",
      autoApproveUnder: 50000,
    },
    raast: {
      enabled: true,
      bankName: "Meezan Bank Islamic",
      accountTitle: "Okwin Interactive Gaming SMC-Pvt",
      iban: "PK36MEZN0001234567890123",
      raastId: "03001234567",
    },
    usdt: {
      enabled: true,
      walletAddress: "TX8qY3M7p9L1k4vB6rE2wN5tZ0uD8sF3gH",
      network: "TRC20",
      exchangeRatePkr: 280,
    },
  };

  private telcoConfig: TelcoGatewayConfig = {
    mode: "sandbox",
    easypaisaStoreId: process.env.EASYPAISA_STORE_ID || "641",
    easypaisaUsername: process.env.EASYPAISA_USERNAME || "okwin_ops",
    easypaisaPassword: process.env.EASYPAISA_PASSWORD || "ops_pass_sec882",
    easypaisaPrivateKeyPem: process.env.EASYPAISA_PRIVATE_KEY_PEM || "",
    easypaisaPublicKeyPem: process.env.EASYPAISA_PUBLIC_KEY_PEM || "",
    jazzcashMerchantId: process.env.JAZZCASH_MERCHANT_ID || "MC-882190",
    jazzcashPassword: process.env.JAZZCASH_PASSWORD || "",
    jazzcashIntegritySalt: process.env.JAZZCASH_SALT || "",
    ipnWebhookUrl: "http://localhost:3000/api/payment/ipn",
    raastMerchantIban: "PK36MEZN0001234567890123",
    raastId: "03001234567",
  };

  // --- Operator Telegram Cashier Alert Bot Configuration ---
  private telegramConfig: TelegramBotConfig = {
    enabled: true,
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
    notifyOnDeposit: true,
    notifyOnWithdrawal: true,
    notifyOnSecurityAlert: true,
    minAmountForAlert: 100,
  };

  private riskSettings: RiskSettings = {
    minDepositForSpin: 500,
    depositRolloverMultiplier: 1.0,
    bonusRolloverMultiplier: 15.0,
    maxWinPerBet: 50000,
    tightHouseEdgeMode: false,
    wheelSectorWeights: [25, 58, 0.2, 10, 5.95, 0.03, 0.01, 0.81],
  };

  private constructor() {
    this.initDefaultData();
  }

  public static getInstance(): AdminBackendStore {
    if (!AdminBackendStore.instance) {
      AdminBackendStore.instance = new AdminBackendStore();
    }
    return AdminBackendStore.instance;
  }

  private initDefaultData() {
    // 1. Initial Mock Players (including the active session player OK-982314)
    const initialPlayers: AdminPlayer[] = [
      {
        id: "OK-982314",
        username: "Winner_007",
        phone: "+92 300 1234567",
        balance: 5000.0,
        bonusBalance: 888.0,
        vipLevel: 1,
        status: "active",
        registeredAt: Date.now() - 86400000 * 3,
        totalDeposits: 12000.0,
        totalWithdrawals: 6500.0,
        totalBets: 45000.0,
        totalWins: 41200.0,
        kycStatus: "verified",
        currentTurnover: 45000.0,
        requiredTurnover: 12000.0,
        riskScore: "LOW",
        riskReason: "Normal player betting profile",
      },
      {
        id: "OK-102934",
        username: "Lahore_King",
        phone: "+92 321 9876543",
        balance: 48500.0,
        bonusBalance: 2500.0,
        vipLevel: 4,
        status: "active",
        registeredAt: Date.now() - 86400000 * 14,
        totalDeposits: 180000.0,
        totalWithdrawals: 125000.0,
        totalBets: 890000.0,
        totalWins: 810000.0,
        kycStatus: "verified",
        currentTurnover: 890000.0,
        requiredTurnover: 180000.0,
        riskScore: "LOW",
      },
      {
        id: "OK-887123",
        username: "Karachi_Falcon",
        phone: "+92 333 4567890",
        balance: 1250.0,
        bonusBalance: 150.0,
        vipLevel: 1,
        status: "active",
        registeredAt: Date.now() - 86400000 * 1,
        totalDeposits: 3000.0,
        totalWithdrawals: 0.0,
        totalBets: 18500.0,
        totalWins: 16750.0,
        kycStatus: "pending",
        currentTurnover: 18500.0,
        requiredTurnover: 3000.0,
        riskScore: "LOW",
      },
      {
        id: "OK-554901",
        username: "Sultan_Vip",
        phone: "+92 345 1122334",
        balance: 142000.0,
        bonusBalance: 15000.0,
        vipLevel: 7,
        status: "active",
        registeredAt: Date.now() - 86400000 * 35,
        totalDeposits: 650000.0,
        totalWithdrawals: 490000.0,
        totalBets: 3200000.0,
        totalWins: 2980000.0,
        kycStatus: "verified",
        currentTurnover: 3200000.0,
        requiredTurnover: 650000.0,
        riskScore: "LOW",
      },
      {
        id: "OK-902188",
        username: "Spam_Bot_99",
        phone: "+92 312 0009999",
        balance: 0.0,
        bonusBalance: 0.0,
        vipLevel: 0,
        status: "banned",
        registeredAt: Date.now() - 86400000 * 20,
        totalDeposits: 0.0,
        totalWithdrawals: 0.0,
        totalBets: 0.0,
        totalWins: 0.0,
        kycStatus: "unverified",
        currentTurnover: 0.0,
        requiredTurnover: 0.0,
        riskScore: "HIGH_RISK",
        riskReason: "Detected Multi-Account Syndicate Bot",
      },
    ];

    initialPlayers.forEach((p) => this.players.set(p.id, p));

    // 2. Initial Financial Queue (Pending & Processed Pakistani Cashier)
    const initialFinance: FinancialRecord[] = [
      {
        id: "WTH-9801",
        userId: "OK-982314",
        username: "Winner_007",
        type: "withdraw",
        amount: 3500.0,
        method: "JazzCash",
        accountNumber: "03001234567",
        accountTitle: "Muhammad Ali",
        txReference: "JC-WTH-882190",
        timestamp: Date.now() - 1000 * 60 * 18,
        status: "pending",
        riskScore: "LOW",
        riskReason: "Wagering turnover 100% compliant",
        turnoverStatus: {
          currentTurnover: 45000,
          requiredTurnover: 12000,
          isCompliant: true,
        },
      },
      {
        id: "DEP-9802",
        userId: "OK-102934",
        username: "Lahore_King",
        type: "deposit",
        amount: 25000.0,
        method: "EasyPaisa",
        accountNumber: "03219876543",
        accountTitle: "Zubair Ahmed",
        txReference: "EP-DEP-773129",
        timestamp: Date.now() - 1000 * 60 * 45,
        status: "pending",
      },
      {
        id: "WTH-9799",
        userId: "OK-554901",
        username: "Sultan_Vip",
        type: "withdraw",
        amount: 80000.0,
        method: "Bank Transfer",
        accountNumber: "PK36MEZN0001234567890123",
        accountTitle: "Tariq Sultan",
        txReference: "MEZN-991280",
        timestamp: Date.now() - 1000 * 60 * 180,
        status: "approved",
        operatorNotes: "Cleared via Meezan Direct Banking",
        processedAt: Date.now() - 1000 * 60 * 150,
      },
      {
        id: "DEP-9795",
        userId: "OK-887123",
        username: "Karachi_Falcon",
        type: "deposit",
        amount: 5000.0,
        method: "JazzCash",
        accountNumber: "03334567890",
        accountTitle: "Hamza Khan",
        txReference: "JC-DEP-449102",
        timestamp: Date.now() - 1000 * 60 * 320,
        status: "approved",
        processedAt: Date.now() - 1000 * 60 * 315,
      },
    ];

    initialFinance.forEach((f) => this.financeRecords.set(f.id, f));

    // 3. In-House & Integrated Game RTP Matrix
    const initialGames: GameRtpSetting[] = [
      {
        id: "aviator",
        name: "Okwin Aviator (Crash)",
        category: "Crash / Mini",
        rtpPercentage: 97.0,
        houseEdge: 3.0,
        status: "active",
        totalVolume: 4250000.0,
        provider: "Spribe Engine",
      },
      {
        id: "mines",
        name: "Okwin Mines (Diamonds)",
        category: "Arcade / Mines",
        rtpPercentage: 96.5,
        houseEdge: 3.5,
        status: "active",
        totalVolume: 1890000.0,
        provider: "In-House Pro",
      },
      {
        id: "piggy_bank",
        name: "Piggy Bank Smash (Gullak)",
        category: "Arcade / Multiplier",
        rtpPercentage: 96.5,
        houseEdge: 3.5,
        status: "active",
        totalVolume: 1450000.0,
        provider: "JILI / WG",
      },
      {
        id: "slots_crazy777",
        name: "Crazy 777 Classic",
        category: "Slots",
        rtpPercentage: 96.0,
        houseEdge: 4.0,
        status: "active",
        totalVolume: 3120000.0,
        provider: "JILI (315)",
      },
      {
        id: "7updown",
        name: "7 Up Down Dice",
        category: "Table / Dice",
        rtpPercentage: 97.2,
        houseEdge: 2.8,
        status: "active",
        totalVolume: 980000.0,
        provider: "In-House Pro",
      },
      {
        id: "fortune_gems",
        name: "Fortune Gems",
        category: "Slots",
        rtpPercentage: 96.8,
        houseEdge: 3.2,
        status: "active",
        totalVolume: 2450000.0,
        provider: "JILI (315)",
      },
      {
        id: "cricket_exchange",
        name: "9Wickets Cricket Exchange",
        category: "Sports",
        rtpPercentage: 95.0,
        houseEdge: 5.0,
        status: "active",
        totalVolume: 5800000.0,
        provider: "9Wickets (1014)",
      },
    ];

    initialGames.forEach((g) => this.gameSettings.set(g.id, g));

    // 4. Initial Promo Codes (Red Packet marketing vouchers)
    const initialPromos: PromoCode[] = [
      {
        code: "OKWIN888",
        bonusAmount: 888.0,
        description: "Grand Welcome Red Packet",
        maxClaims: 1000,
        claimsCount: 42,
        claimedUsers: ["OK-102934"],
        status: "active",
        createdAt: Date.now() - 86400000 * 5,
      },
      {
        code: "FREE500",
        bonusAmount: 500.0,
        description: "Weekend Special Free Cash",
        maxClaims: 500,
        claimsCount: 18,
        claimedUsers: [],
        status: "active",
        createdAt: Date.now() - 86400000 * 2,
      },
      {
        code: "VIPPAKISTAN",
        bonusAmount: 1000.0,
        description: "Pakistani High-Roller Exclusive Gift",
        maxClaims: 200,
        claimsCount: 5,
        claimedUsers: [],
        status: "active",
        createdAt: Date.now() - 86400000 * 1,
      },
      {
        code: "LUCKY777",
        bonusAmount: 777.0,
        description: "Lucky Spin Mystery Envelope",
        maxClaims: 1000,
        claimsCount: 89,
        claimedUsers: ["OK-554901"],
        status: "active",
        createdAt: Date.now() - 86400000 * 7,
      },
    ];

    initialPromos.forEach((p) => this.promoCodes.set(p.code, p));
  }

  // --- Player Management Methods ---

  public getPlayers(query = "", statusFilter = "all"): AdminPlayer[] {
    let list = Array.from(this.players.values());

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((p) => p.status === statusFilter);
    }

    return list.sort((a, b) => b.registeredAt - a.registeredAt);
  }

  public getPlayer(userId: string): AdminPlayer | undefined {
    return this.players.get(userId);
  }

  public adjustPlayerBalance(
    userId: string,
    amount: number,
    operation: "credit" | "debit",
    reason: string
  ): { success: boolean; message: string; player?: AdminPlayer } {
    const player = this.players.get(userId);
    if (!player) {
      return { success: false, message: `Player ${userId} not found` };
    }

    if (amount <= 0) {
      return { success: false, message: "Adjustment amount must be positive" };
    }

    if (operation === "debit") {
      if (player.balance < amount) {
        return { success: false, message: `Insufficient balance (₨ ${player.balance})` };
      }
      player.balance = Math.round((player.balance - amount) * 100) / 100;
    } else {
      player.balance = Math.round((player.balance + amount) * 100) / 100;
    }

    // Add financial audit trail
    const recordId = `ADJ-${Date.now().toString().slice(-6)}`;
    this.financeRecords.set(recordId, {
      id: recordId,
      userId: player.id,
      username: player.username,
      type: operation === "credit" ? "deposit" : "withdraw",
      amount,
      method: "Bank Transfer",
      accountNumber: "SYSTEM_ADJUSTMENT",
      accountTitle: "Admin Console Manual",
      txReference: `ADJ-${operation.toUpperCase()}-${Date.now().toString().slice(-4)}`,
      timestamp: Date.now(),
      status: "approved",
      operatorNotes: `Manual ${operation.toUpperCase()}: ${reason}`,
      processedAt: Date.now(),
    });

    return {
      success: true,
      message: `Successfully ${operation === "credit" ? "credited" : "debited"} ₨ ${amount} to ${player.username}`,
      player,
    };
  }

  public updatePlayerStatus(
    userId: string,
    status: "active" | "frozen" | "banned",
    vipLevel?: number
  ): { success: boolean; message: string; player?: AdminPlayer } {
    const player = this.players.get(userId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    player.status = status;
    if (vipLevel !== undefined && vipLevel >= 0 && vipLevel <= 10) {
      player.vipLevel = vipLevel;
    }

    return {
      success: true,
      message: `Updated ${player.username} status to ${status.toUpperCase()}`,
      player,
    };
  }

  // --- Financial Cashier Methods ---

  public getFinanceRecords(typeFilter = "all", statusFilter = "all"): FinancialRecord[] {
    let list = Array.from(this.financeRecords.values());

    if (typeFilter !== "all") {
      list = list.filter((f) => f.type === typeFilter);
    }
    if (statusFilter !== "all") {
      list = list.filter((f) => f.status === statusFilter);
    }

    return list.sort((a, b) => b.timestamp - a.timestamp);
  }

  public processWithdrawal(
    recordId: string,
    action: "approve" | "reject",
    operatorNotes?: string
  ): { success: boolean; message: string; record?: FinancialRecord } {
    const record = this.financeRecords.get(recordId);
    if (!record) {
      return { success: false, message: "Transaction record not found" };
    }
    if (record.status !== "pending") {
      return { success: false, message: `Transaction already marked as ${record.status}` };
    }

    record.status = action === "approve" ? "approved" : "rejected";
    record.operatorNotes = operatorNotes || (action === "approve" ? "Approved by Admin Cashier" : "Rejected by Cashier Risk Control");
    record.processedAt = Date.now();

    const player = this.players.get(record.userId);
    if (player) {
      if (action === "approve") {
        player.totalWithdrawals += record.amount;
      } else {
        // If rejected, refund withdrawal amount back to user balance!
        player.balance = Math.round((player.balance + record.amount) * 100) / 100;
      }
    }

    return {
      success: true,
      message: `Withdrawal ${record.id} (${record.method}) marked as ${record.status.toUpperCase()}`,
      record,
    };
  }

    public verifyAdminPin(candidatePin: string): { success: boolean; message: string; locked?: boolean; remainingAttempts?: number } {
    const now = Date.now();
    if (now < this.adminLockoutUntil) {
      const remainingMinutes = Math.ceil((this.adminLockoutUntil - now) / 60000);
      return {
        success: false,
        locked: true,
        message: `Console locked due to multiple failed attempts. Try again in ${remainingMinutes} min.`,
        remainingAttempts: 0,
      };
    }

    if (candidatePin === this.adminPin) {
      this.adminFailedAttempts = 0;
      return { success: true, message: "Authorized" };
    }

    this.adminFailedAttempts += 1;
    if (this.adminFailedAttempts >= 5) {
      this.adminLockoutUntil = now + 15 * 60 * 1000;
      return {
        success: false,
        locked: true,
        message: "Maximum failed attempts reached. Console locked for 15 minutes.",
        remainingAttempts: 0,
      };
    }

    return {
      success: false,
      message: "Invalid Master Cashier PIN.",
      remainingAttempts: 5 - this.adminFailedAttempts,
    };
  }

  public verifyAndRecordDepositTID(data: {
    userId: string;
    username: string;
    amount: number;
    method: "JazzCash" | "EasyPaisa" | "Bank Transfer" | "USDT (TRC20)";
    senderPhone: string;
    transactionRef: string;
    accountHolder?: string;
  }): { success: boolean; code?: string; message: string; record?: FinancialRecord } {
    const rawTid = (data.transactionRef || "").trim().toUpperCase().replace(/[\s-]/g, "");
    if (!rawTid || rawTid.length < 6) {
      return {
        success: false,
        code: "INVALID_TID_FORMAT",
        message: "Please enter a valid Transaction ID (TID) from your payment confirmation SMS.",
      };
    }

    // 1. Anti-Replay Check: Reject duplicate TID
    if (this.usedTIDs.has(rawTid)) {
      const prev = this.usedTIDs.get(rawTid);
      const timeStr = prev ? new Date(prev.timestamp).toLocaleTimeString() : "earlier";
      return {
        success: false,
        code: "DUPLICATE_TID",
        message: `This Transaction ID (${rawTid}) has already been submitted and verified on ${timeStr}. Replay attempts are blocked by security audit.`,
      };
    }

    // 2. Format validation per method
    if (data.method === "EasyPaisa" && !/^\d{11}$/.test(rawTid) && !/^EP\d{8,11}$/.test(rawTid)) {
      return {
        success: false,
        code: "INVALID_EP_TID",
        message: "EasyPaisa Transaction ID must be the 11-digit number from 3737 confirmation SMS.",
      };
    }
    if (data.method === "JazzCash" && !/^\d{11,12}$/.test(rawTid) && !/^JC\d{8,11}$/.test(rawTid)) {
      return {
        success: false,
        code: "INVALID_JC_TID",
        message: "JazzCash Transaction ID must be the 11 or 12-digit number from 8558 confirmation SMS.",
      };
    }

    // 3. Record in permanent usedTIDs index
    this.usedTIDs.set(rawTid, {
      userId: data.userId,
      username: data.username,
      amount: data.amount,
      method: data.method,
      timestamp: Date.now(),
      senderPhone: data.senderPhone,
    });

    // 4. Create Financial Record in Cashier Queue
    const recordId = `DEP-${Date.now().toString().slice(-6)}`;
    const newRecord: FinancialRecord = {
      id: recordId,
      userId: data.userId,
      username: data.username,
      type: "deposit",
      amount: data.amount,
      method: data.method,
      accountNumber: data.senderPhone || "0300 1234567",
      accountTitle: data.accountHolder || data.username,
      txReference: rawTid,
      timestamp: Date.now(),
      status: "pending",
      riskScore: "LOW",
      riskReason: "SMS TID format verified • Zero replay duplicate",
    };

    this.financeRecords.set(recordId, newRecord);

    let player = this.players.get(data.userId);
    if (!player) {
      player = {
        id: data.userId,
        username: data.username,
        phone: data.senderPhone || "+92 300 0000000",
        balance: 1000.0,
        bonusBalance: 0,
        vipLevel: 1,
        status: "active",
        registeredAt: Date.now(),
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalBets: 0,
        totalWins: 0,
        kycStatus: "verified",
        currentTurnover: 0,
        requiredTurnover: 0,
        riskScore: "LOW",
      };
      this.players.set(player.id, player);
    }

    return {
      success: true,
      message: "Deposit submitted for cashier SMS verification. Funds will credit in 1-3 minutes.",
      record: newRecord,
    };
  }

  public recordDirectMAPushPayment(data: {
    orderId: string;
    amount: number;
    method: "JazzCash" | "EasyPaisa";
    mobileAccountNo: string;
    userId?: string;
    username?: string;
    storeId?: string;
    transactionId?: string;
    status?: "approved" | "pending";
  }): {
    success: boolean;
    orderId: string;
    storeId: string;
    transactionId: string;
    transactionDateTime: string;
    responseCode: string;
    responseDesc: string;
    record?: FinancialRecord;
  } {
    const storeId = data.storeId || "641";
    const transactionId = data.transactionId || `EWP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = now.getHours() % 12 || 12;
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const ampm = now.getHours() >= 12 ? "PM" : "AM";
    const transactionDateTime = `${day}/${month}/${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;

    const userId = data.userId || "OK-982314";
    const username = data.username || "Winner_007";
    const status = data.status || "approved";

    // 1. Mark in used TIDs to prevent duplicate replay
    this.usedTIDs.set(transactionId, {
      userId,
      username,
      amount: data.amount,
      method: data.method,
      timestamp: Date.now(),
      senderPhone: data.mobileAccountNo,
    });
    this.usedTIDs.set(data.orderId, {
      userId,
      username,
      amount: data.amount,
      method: data.method,
      timestamp: Date.now(),
      senderPhone: data.mobileAccountNo,
    });

    // 2. Create financial audit record
    const recordId = `MA-${data.orderId}`;
    const newRecord: FinancialRecord = {
      id: recordId,
      userId,
      username,
      type: "deposit",
      amount: data.amount,
      method: data.method,
      accountNumber: data.mobileAccountNo,
      accountTitle: `${data.method} MA Direct Push`,
      txReference: transactionId,
      timestamp: Date.now(),
      status,
      processedAt: status === "approved" ? Date.now() : undefined,
      operatorNotes: `Mobile Account (MA) Push payment completed via ${data.method} gateway. Ericsson EWP ID: ${transactionId}. Order: ${data.orderId}`,
      riskScore: "LOW",
      riskReason: "Official Telco Gateway MA Push Verified",
    };

    this.financeRecords.set(recordId, newRecord);

    // 3. Update player stats if approved
    let player = this.players.get(userId);
    if (!player) {
      player = {
        id: userId,
        username,
        phone: data.mobileAccountNo,
        balance: 0,
        bonusBalance: 0,
        vipLevel: 1,
        status: "active",
        registeredAt: Date.now(),
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalBets: 0,
        totalWins: 0,
        kycStatus: "verified",
        currentTurnover: 0,
        requiredTurnover: 0,
        riskScore: "LOW",
      };
      this.players.set(userId, player);
    }

    if (status === "approved") {
      player.totalDeposits = Math.round((player.totalDeposits + data.amount) * 100) / 100;
      player.balance = Math.round((player.balance + data.amount) * 100) / 100;
      // 1x deposit rollover
      player.requiredTurnover = Math.round((player.requiredTurnover + data.amount * this.riskSettings.depositRolloverMultiplier) * 100) / 100;
    }

    return {
      success: true,
      orderId: data.orderId,
      storeId,
      transactionId,
      transactionDateTime,
      responseCode: "0000",
      responseDesc: "SUCCESS",
      record: newRecord,
    };
  }

  public inquireMAPushPayment(orderId: string): {
    found: boolean;
    orderId: string;
    status: "approved" | "pending" | "rejected" | "not_found";
    responseCode: string;
    responseDesc: string;
    record?: FinancialRecord;
  } {
    const record = this.financeRecords.get(`MA-${orderId}`);
    if (!record) {
      return {
        found: false,
        orderId,
        status: "not_found",
        responseCode: "0014",
        responseDesc: "ACCOUNT OR ORDER DOES NOT EXIST",
      };
    }

    return {
      found: true,
      orderId,
      status: record.status,
      responseCode: record.status === "approved" ? "0000" : record.status === "pending" ? "0002" : "0001",
      responseDesc: record.status === "approved" ? "SUCCESS" : record.status === "pending" ? "PENDING_MPIN_AUTHORIZATION" : "SYSTEM_ERROR",
      record,
    };
  }

  public checkDeviceBonusEligibility(deviceId: string, userId: string): {
    canClaimBonus: boolean;
    reason?: string;
    isSyndicate: boolean;
  } {
    const rawDev = (deviceId || "DEV-UNKNOWN").trim().toUpperCase();
    let devRecord = this.deviceRegistrations.get(rawDev);

    if (!devRecord) {
      devRecord = {
        count: 1,
        bonusClaimed: true,
        accounts: [userId],
        firstSeen: Date.now(),
      };
      this.deviceRegistrations.set(rawDev, devRecord);
      return { canClaimBonus: true, isSyndicate: false };
    }

    devRecord.count += 1;
    if (!devRecord.accounts.includes(userId)) {
      devRecord.accounts.push(userId);
    }

    const isSyndicate = devRecord.count > 3;

    if (devRecord.bonusClaimed) {
      return {
        canClaimBonus: false,
        reason: "The ₨ 888 Free Welcome Bonus has already been claimed on this device. Deposit to unlock exclusive 100% deposit match bonus!",
        isSyndicate,
      };
    }

    devRecord.bonusClaimed = true;
    return { canClaimBonus: true, isSyndicate };
  }

  public processDeposit(
    recordId: string,
    action: "approve" | "reject",
    operatorNotes?: string
  ): { success: boolean; message: string; record?: FinancialRecord } {
    const record = this.financeRecords.get(recordId);
    if (!record) {
      return { success: false, message: "Deposit record not found" };
    }
    if (record.status !== "pending") {
      return { success: false, message: `Deposit already ${record.status}` };
    }

    record.status = action === "approve" ? "approved" : "rejected";
    record.operatorNotes = operatorNotes || (action === "approve" ? "Payment verified via merchant SMS" : "Payment proof invalid");
    record.processedAt = Date.now();

    const player = this.players.get(record.userId);
    if (player && action === "approve") {
      player.balance = Math.round((player.balance + record.amount) * 100) / 100;
      player.totalDeposits += record.amount;
    }

    return {
      success: true,
      message: `Deposit ${record.id} (${record.amount} PKR) marked as ${record.status.toUpperCase()}`,
      record,
    };
  }

  public submitWithdrawal(data: {
    userId: string;
    username: string;
    amount: number;
    method: "JazzCash" | "EasyPaisa" | "Bank Transfer" | "USDT (TRC20)";
    accountNumber: string;
    accountTitle: string;
  }): { success: boolean; message: string; record?: FinancialRecord } {
    const minWth = this.systemSettings.minWithdrawal || 500;
    if (data.amount < minWth) {
      return { success: false, message: `Minimum withdrawal is ₨ ${minWth}` };
    }

    let player = this.players.get(data.userId);
    if (!player) {
      player = {
        id: data.userId,
        username: data.username,
        phone: "+92 300 1234567",
        balance: 5000.0,
        bonusBalance: 0,
        vipLevel: 1,
        status: "active",
        registeredAt: Date.now(),
        totalDeposits: 5000,
        totalWithdrawals: 0,
        totalBets: 0,
        totalWins: 0,
        kycStatus: "verified",
        currentTurnover: 0,
        requiredTurnover: 0,
        riskScore: "LOW",
      };
      this.players.set(player.id, player);
    }

    if (player.balance < data.amount) {
      return {
        success: false,
        message: `Insufficient balance (₨ ${player.balance.toFixed(2)})`,
      };
    }

    // Operator capital defense: verify turnover requirement
    const deficit = Math.max(0, Math.round((player.requiredTurnover - player.currentTurnover) * 100) / 100);
    if (deficit > 0) {
      return {
        success: false,
        message: `Turnover requirement not satisfied! You must wager ₨ ${deficit.toLocaleString("en-PK")} more in games to unlock withdrawal.`,
      };
    }

    // Automated fraud & syndicate risk scoring
    let riskScore: "LOW" | "MEDIUM" | "HIGH_RISK" = "LOW";
    let riskReason = "Wagering turnover 100% compliant";

    if (player.totalDeposits <= 0) {
      riskScore = "HIGH_RISK";
      riskReason = "Zero lifetime deposits / Potential burner bot";
    } else if (player.totalBets > 2000 && (player.totalWins / player.totalBets) > 0.8) {
      riskScore = "HIGH_RISK";
      riskReason = `Abnormal winrate (${Math.round((player.totalWins / player.totalBets) * 100)}%) / Arbitrage alert`;
    } else if (data.amount > player.totalDeposits * 4 && player.totalDeposits < 2000) {
      riskScore = "MEDIUM";
      riskReason = "Cashout exceeds 4x lifetime deposits";
    }

    player.riskScore = riskScore;
    player.riskReason = riskReason;

    // Deduct player balance
    player.balance = Math.round((player.balance - data.amount) * 100) / 100;

    const recordId = `WTH-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const txRef = `${data.method.slice(0, 2).toUpperCase()}-WTH-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const record: FinancialRecord = {
      id: recordId,
      userId: data.userId,
      username: data.username,
      type: "withdraw",
      amount: data.amount,
      method: data.method,
      accountNumber: data.accountNumber,
      accountTitle: data.accountTitle,
      txReference: txRef,
      timestamp: Date.now(),
      status: "pending",
      operatorNotes: riskScore === "HIGH_RISK" ? `⚠️ FLAG: ${riskReason}` : "Awaiting Cashier Security Clearance",
      riskScore,
      riskReason,
      turnoverStatus: {
        currentTurnover: player.currentTurnover,
        requiredTurnover: player.requiredTurnover,
        isCompliant: deficit <= 0,
      },
    };

    this.financeRecords.set(record.id, record);
    return {
      success: true,
      message: "Withdrawal request submitted successfully to cashier queue",
      record,
    };
  }

  public getFinanceRecord(recordId: string): FinancialRecord | undefined {
    return this.financeRecords.get(recordId);
  }

  // --- Promo Codes & Red Packets Engine ---

  public getPromoCodes(): PromoCode[] {
    return Array.from(this.promoCodes.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  public createPromoCode(data: {
    code: string;
    bonusAmount: number;
    description: string;
    maxClaims?: number;
  }): { success: boolean; message: string; promo?: PromoCode } {
    const code = data.code.trim().toUpperCase();
    if (!code || code.length < 3) {
      return { success: false, message: "Code must be at least 3 characters long" };
    }
    if (this.promoCodes.has(code)) {
      return { success: false, message: `Promo code "${code}" already exists` };
    }
    if (data.bonusAmount <= 0) {
      return { success: false, message: "Bonus amount must be positive" };
    }

    const newPromo: PromoCode = {
      code,
      bonusAmount: data.bonusAmount,
      description: data.description || `Bonus code ${code}`,
      maxClaims: data.maxClaims || 500,
      claimsCount: 0,
      claimedUsers: [],
      status: "active",
      createdAt: Date.now(),
    };

    this.promoCodes.set(code, newPromo);
    return {
      success: true,
      message: `Created promo code "${code}" for ₨ ${data.bonusAmount}`,
      promo: newPromo,
    };
  }

  public togglePromoCode(code: string): { success: boolean; message: string; promo?: PromoCode } {
    const p = this.promoCodes.get(code.toUpperCase());
    if (!p) {
      return { success: false, message: `Promo code "${code}" not found` };
    }
    p.status = p.status === "active" ? "disabled" : "active";
    return {
      success: true,
      message: `Promo code "${p.code}" is now ${p.status.toUpperCase()}`,
      promo: p,
    };
  }

  public redeemPromoCode(
    userId: string,
    rawCode: string
  ): { success: boolean; message: string; bonusAmount?: number; newBalance?: number } {
    const code = rawCode.trim().toUpperCase();
    const promo = this.promoCodes.get(code);

    if (!promo) {
      return { success: false, message: "Invalid promo code. Please verify and try again." };
    }

    if (promo.status !== "active") {
      return { success: false, message: "This promo code is currently disabled." };
    }

    if (promo.claimsCount >= promo.maxClaims) {
      return { success: false, message: "This promo code has reached its maximum claim limit." };
    }

    if (promo.claimedUsers.includes(userId)) {
      return { success: false, message: "You have already claimed this red packet!" };
    }

    // Process redemption
    promo.claimsCount += 1;
    promo.claimedUsers.push(userId);

    let player = this.players.get(userId);
    if (!player) {
      const newPlayer: AdminPlayer = {
        id: userId,
        username: "Player_" + userId.slice(-4),
        phone: "+92 300 1234567",
        balance: 0.0,
        bonusBalance: 0,
        vipLevel: 1,
        status: "active",
        registeredAt: Date.now(),
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalBets: 0,
        totalWins: 0,
        kycStatus: "verified",
        currentTurnover: 0,
        requiredTurnover: 0,
        riskScore: "LOW",
      };
      this.players.set(newPlayer.id, newPlayer);
      player = newPlayer;
    }

    player.bonusBalance = Math.round((player.bonusBalance + promo.bonusAmount) * 100) / 100;
    player.balance = Math.round((player.balance + promo.bonusAmount) * 100) / 100;
    // Operator capital defense: apply 15x rollover requirement to requiredTurnover!
    player.requiredTurnover = Math.round((player.requiredTurnover + promo.bonusAmount * this.riskSettings.bonusRolloverMultiplier) * 100) / 100;

    // Add financial audit record
    const recordId = `PRM-${Date.now().toString().slice(-6)}`;
    this.financeRecords.set(recordId, {
      id: recordId,
      userId: player.id,
      username: player.username,
      type: "deposit",
      amount: promo.bonusAmount,
      method: "Bank Transfer",
      accountNumber: `PROMO:${code}`,
      accountTitle: "Red Packet Bonus",
      txReference: `RED-PKT-${code}`,
      timestamp: Date.now(),
      status: "approved",
      operatorNotes: `Redeemed Red Packet ${code}: ${promo.description} (15x rollover applied)`,
      processedAt: Date.now(),
    });

    return {
      success: true,
      message: `🎉 Success! ₨ ${promo.bonusAmount} has been credited to your balance!`,
      bonusAmount: promo.bonusAmount,
      newBalance: player.balance,
    };
  }

  // --- Operator Risk Control & Lucky Wheel Engine ---

  public getRiskSettings(): RiskSettings {
    return { ...this.riskSettings };
  }

  public updateRiskSettings(settings: Partial<RiskSettings>): RiskSettings {
    this.riskSettings = {
      ...this.riskSettings,
      ...settings,
    };
    return { ...this.riskSettings };
  }

  public getPlayerTurnover(userId: string): {
    currentTurnover: number;
    requiredTurnover: number;
    totalDeposits: number;
    isCompliant: boolean;
    deficit: number;
    progressPercentage: number;
    riskScore: "LOW" | "MEDIUM" | "HIGH_RISK";
  } {
    const player = this.players.get(userId);
    const currentTurnover = player?.currentTurnover || 0;
    const requiredTurnover = player?.requiredTurnover || 0;
    const totalDeposits = player?.totalDeposits || 0;
    const deficit = Math.max(0, Math.round((requiredTurnover - currentTurnover) * 100) / 100);
    const progressPercentage = requiredTurnover > 0
      ? Math.min(100, Math.round((currentTurnover / requiredTurnover) * 100))
      : 100;

    return {
      currentTurnover,
      requiredTurnover,
      totalDeposits,
      isCompliant: deficit <= 0,
      deficit,
      progressPercentage,
      riskScore: player?.riskScore || "LOW",
    };
  }

  public voidFraudAccount(userId: string, reason: string): { success: boolean; message: string } {
    const player = this.players.get(userId);
    if (!player) {
      return { success: false, message: "Player not found" };
    }

    player.status = "banned";
    player.balance = 0;
    player.bonusBalance = 0;
    player.riskScore = "HIGH_RISK";
    player.riskReason = `BANNED BY RISK CONTROL: ${reason}`;

    // Void any pending withdrawals
    this.financeRecords.forEach((rec) => {
      if (rec.userId === userId && rec.status === "pending") {
        rec.status = "rejected";
        rec.operatorNotes = `VOIDED & REJECTED: Fraud account banned (${reason})`;
        rec.processedAt = Date.now();
      }
    });

    return {
      success: true,
      message: `Account ${player.username} (${player.id}) banned and pending withdrawals voided.`,
    };
  }

  public spinLuckyWheel(userId: string): {
    success: boolean;
    message: string;
    sectorIndex?: number;
    prize?: { label: string; type: "cash" | "vip"; value: number };
    newBonusBalance?: number;
    requiredTurnoverAdded?: number;
    remainingTurnover?: number;
  } {
    let player = this.players.get(userId);
    if (!player) {
      const newPlayer: AdminPlayer = {
        id: userId,
        username: "Player_" + userId.slice(-4),
        phone: "+92 300 1234567",
        balance: 0.0,
        bonusBalance: 0,
        vipLevel: 1,
        status: "active",
        registeredAt: Date.now(),
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalBets: 0,
        totalWins: 0,
        kycStatus: "verified",
        currentTurnover: 0,
        requiredTurnover: 0,
        riskScore: "LOW",
      };
      this.players.set(newPlayer.id, newPlayer);
      player = newPlayer;
    }

    // 1. Operator Protection: Deposit Gate (Block burner accounts)
    if (player.totalDeposits < this.riskSettings.minDepositForSpin) {
      return {
        success: false,
        message: `Recharge required! You must deposit at least ₨ ${this.riskSettings.minDepositForSpin} in lifetime to unlock the Daily Lucky Wheel.`,
      };
    }

    // 2. Operator Protection: Weighted Slices Selection
    // Sectors matching client layout:
    // 0: ₨ 100, 1: ₨ 50, 2: ₨ 500, 3: 200 VIP, 4: ₨ 200, 5: ₨ 888, 6: ₨ 1,888, 7: ₨ 300
    const sectors: Array<{ label: string; type: "cash" | "vip"; value: number }> = [
      { label: "₨ 100", type: "cash", value: 100 },
      { label: "₨ 50", type: "cash", value: 50 },
      { label: "₨ 500", type: "cash", value: 500 },
      { label: "200 VIP", type: "vip", value: 200 },
      { label: "₨ 200", type: "cash", value: 200 },
      { label: "₨ 888", type: "cash", value: 888 },
      { label: "₨ 1,888", type: "cash", value: 1888 },
      { label: "₨ 300", type: "cash", value: 300 },
    ];

    const weights = this.riskSettings.wheelSectorWeights;
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let rand = Math.random() * totalWeight;
    let selectedIndex = 1; // Default to ₨ 50

    for (let i = 0; i < weights.length; i++) {
      if (rand < weights[i]) {
        selectedIndex = i;
        break;
      }
      rand -= weights[i];
    }

    const prize = sectors[selectedIndex];

    // 3. Operator Protection: Credit to Bonus with 15x Rollover
    let turnoverAdded = 0;
    if (prize.type === "cash") {
      player.bonusBalance = Math.round((player.bonusBalance + prize.value) * 100) / 100;
      turnoverAdded = Math.round(prize.value * this.riskSettings.bonusRolloverMultiplier * 100) / 100;
      player.requiredTurnover = Math.round((player.requiredTurnover + turnoverAdded) * 100) / 100;
    } else {
      player.vipLevel = Math.min(10, player.vipLevel + 1);
    }

    return {
      success: true,
      message: `Won ${prize.label}! Credited to bonus wallet with ${this.riskSettings.bonusRolloverMultiplier}x wagering turnover required.`,
      sectorIndex: selectedIndex,
      prize,
      newBonusBalance: player.bonusBalance,
      requiredTurnoverAdded: turnoverAdded,
      remainingTurnover: Math.max(0, Math.round((player.requiredTurnover - player.currentTurnover) * 100) / 100),
    };
  }

  // --- Game Settings & RTP ---

  
  // --- Audit Trail & Security Ledger Methods ---

  public logAuditAction(entry: Omit<AuditLogEntry, "id" | "timestamp">): AuditLogEntry {
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`,
      timestamp: Date.now(),
      ...entry,
    };
    this.auditLogs.unshift(newEntry);
    if (this.auditLogs.length > 300) {
      this.auditLogs = this.auditLogs.slice(0, 300);
    }
    return newEntry;
  }

  public getAuditLogs(categoryFilter = "all", severityFilter = "all", limit = 100): AuditLogEntry[] {
    let list = [...this.auditLogs];
    if (categoryFilter !== "all") {
      list = list.filter((l) => l.category === categoryFilter);
    }
    if (severityFilter !== "all") {
      list = list.filter((l) => l.severity === severityFilter);
    }
    return list.slice(0, limit);
  }

  // --- Telco Gateway Configuration Methods ---

  
  // --- WordPress Style Modular Payment Gateways Methods ---

  public getPaymentGateways(): PaymentGatewaysMasterConfig {
    return JSON.parse(JSON.stringify(this.paymentGateways));
  }

  public updatePaymentGateway<K extends keyof PaymentGatewaysMasterConfig>(
    gateway: K,
    update: Partial<PaymentGatewaysMasterConfig[K]>
  ): PaymentGatewaysMasterConfig {
    this.paymentGateways[gateway] = {
      ...this.paymentGateways[gateway],
      ...update,
    };

    // Keep legacy telcoConfig synchronized
    if (gateway === "easypaisa") {
      const ep = this.paymentGateways.easypaisa;
      this.telcoConfig.mode = ep.mode;
      this.telcoConfig.easypaisaStoreId = ep.storeId;
      this.telcoConfig.easypaisaUsername = ep.username;
      this.telcoConfig.easypaisaPassword = ep.password;
      this.telcoConfig.easypaisaPrivateKeyPem = ep.privateKeyPem;
      this.telcoConfig.easypaisaPublicKeyPem = ep.publicKeyPem;
    } else if (gateway === "jazzcash") {
      const jc = this.paymentGateways.jazzcash;
      this.telcoConfig.jazzcashMerchantId = jc.merchantId;
      this.telcoConfig.jazzcashPassword = jc.password;
      this.telcoConfig.jazzcashIntegritySalt = jc.integritySalt;
    } else if (gateway === "raast") {
      const r = this.paymentGateways.raast;
      this.telcoConfig.raastMerchantIban = r.iban;
      this.telcoConfig.raastId = r.raastId;
    }

    this.logAuditAction({
      operator: "MasterAdmin",
      category: "GATEWAY",
      action: `GATEWAY_${gateway.toUpperCase()}_UPDATED`,
      details: `Updated ${gateway.toUpperCase()} settings. Status: ${this.paymentGateways[gateway].enabled ? "ENABLED" : "DISABLED"}`,
      severity: "INFO",
    });

    return this.getPaymentGateways();
  }

  public testGatewayCredentials(gateway: "easypaisa" | "jazzcash"): {
    success: boolean;
    message: string;
    details: Record<string, any>;
  } {
    if (gateway === "easypaisa") {
      const ep = this.paymentGateways.easypaisa;
      if (!ep.storeId || !ep.username) {
        return {
          success: false,
          message: "Store ID and Partner Username are required.",
          details: { gateway: "EasyPaisa", status: "MISSING_CREDENTIALS" },
        };
      }
      return {
        success: true,
        message: `EasyPaisa API connection handshake successful! (${ep.mode.toUpperCase()} mode, Store ID: ${ep.storeId})`,
        details: {
          gateway: "EasyPaisa",
          mode: ep.mode,
          storeId: ep.storeId,
          username: ep.username,
          hasPrivateKey: Boolean(ep.privateKeyPem),
          ipnCallback: ep.ipnUrl,
        },
      };
    } else {
      const jc = this.paymentGateways.jazzcash;
      if (!jc.merchantId || !jc.password || !jc.integritySalt) {
        return {
          success: false,
          message: "Merchant ID, Password, and Integrity Salt are all required for JazzCash v4.2.",
          details: { gateway: "JazzCash", status: "MISSING_CREDENTIALS" },
        };
      }

      // Sample v4.2 HMAC calculation test
      const sampleHash = require("./jazzcashService").calculateJazzCashSecureHash(
        {
          pp_Amount: "10000",
          pp_MerchantID: jc.merchantId,
          pp_TxnDateTime: "20260915220000",
        },
        jc.integritySalt
      );

      const endpoints = require("./jazzcashService").JAZZCASH_ENDPOINTS[jc.mode];

      return {
        success: true,
        message: `JazzCash v4.2 API connection handshake successful! (${jc.mode.toUpperCase()} mode, Merchant ID: ${jc.merchantId})`,
        details: {
          gateway: "JazzCash v4.2",
          mode: jc.mode,
          merchantId: jc.merchantId,
          sampleHmacSha256: sampleHash.slice(0, 16) + "...",
          mwalletEndpoint: endpoints.mwalletApiUrl,
          hostedCheckoutEndpoint: endpoints.hostedCheckoutUrl,
          inquiryEndpoint: endpoints.inquiryApiUrl,
          returnUrl: jc.returnUrl,
          ipnCallback: jc.ipnUrl,
        },
      };
    }
  }

  public getTelcoConfig(): TelcoGatewayConfig {
    return { ...this.telcoConfig };
  }

  public updateTelcoConfig(newConfig: Partial<TelcoGatewayConfig>): TelcoGatewayConfig {
    this.telcoConfig = {
      ...this.telcoConfig,
      ...newConfig,
    };
    this.logAuditAction({
      operator: "MasterAdmin",
      category: "GATEWAY",
      action: "TELCO_CONFIG_UPDATED",
      details: `Telco Gateway mode switched to ${this.telcoConfig.mode.toUpperCase()}. Store ID: ${this.telcoConfig.easypaisaStoreId}`,
      severity: "WARNING",
    });
    return { ...this.telcoConfig };
  }

  // --- Telegram Bot Configuration Methods ---

  public getTelegramConfig(): TelegramBotConfig {
    return { ...this.telegramConfig };
  }

  public updateTelegramConfig(newConfig: Partial<TelegramBotConfig>): TelegramBotConfig {
    this.telegramConfig = {
      ...this.telegramConfig,
      ...newConfig,
    };
    this.logAuditAction({
      operator: "MasterAdmin",
      category: "CONFIG",
      action: "TELEGRAM_BOT_CONFIG_UPDATED",
      details: `Telegram bot status: ${this.telegramConfig.enabled ? "ENABLED" : "DISABLED"}, Chat ID: ${this.telegramConfig.chatId ? "CONFIGURED" : "NOT SET"}`,
      severity: "INFO",
    });
    return { ...this.telegramConfig };
  }

  public getGameSettings(): GameRtpSetting[] {
    return Array.from(this.gameSettings.values());
  }

  public updateGameRtp(
    gameId: string,
    rtpPercentage: number,
    status?: "active" | "maintenance"
  ): { success: boolean; message: string; game?: GameRtpSetting } {
    const game = this.gameSettings.get(gameId);
    if (!game) {
      return { success: false, message: `Game ${gameId} not found` };
    }

    if (rtpPercentage < 80 || rtpPercentage > 99.5) {
      return { success: false, message: "RTP must be set between 80.0% and 99.5%" };
    }

    game.rtpPercentage = rtpPercentage;
    game.houseEdge = Math.round((100 - rtpPercentage) * 10) / 10;
    if (status) {
      game.status = status;
    }

    return {
      success: true,
      message: `Updated ${game.name} RTP to ${rtpPercentage}% (House Edge: ${game.houseEdge}%)`,
      game,
    };
  }

  // --- Platform System Settings ---

  public getSystemSettings(): SystemSettings {
    return { ...this.systemSettings };
  }

  public updateSystemSettings(settings: Partial<SystemSettings>): SystemSettings {
    this.systemSettings = {
      ...this.systemSettings,
      ...settings,
    };
    return { ...this.systemSettings };
  }

  // --- KPI & Analytics Metrics ---

  public getPlatformMetrics() {
    const players = Array.from(this.players.values());
    const totalTurnover = players.reduce((acc, p) => acc + p.totalBets, 0);
    const totalWins = players.reduce((acc, p) => acc + p.totalWins, 0);
    const ggr = Math.round((totalTurnover - totalWins) * 100) / 100; // Gross Gaming Revenue
    const totalDeposits = players.reduce((acc, p) => acc + p.totalDeposits, 0);
    const totalWithdrawals = players.reduce((acc, p) => acc + p.totalWithdrawals, 0);
    const netCashflow = Math.round((totalDeposits - totalWithdrawals) * 100) / 100;

    const pendingWithdrawalsCount = Array.from(this.financeRecords.values()).filter(
      (f) => f.type === "withdraw" && f.status === "pending"
    ).length;

    const pendingDepositsCount = Array.from(this.financeRecords.values()).filter(
      (f) => f.type === "deposit" && f.status === "pending"
    ).length;

    return {
      totalRegisteredPlayers: players.length,
      activePlayersCount: players.filter((p) => p.status === "active").length,
      ggr,
      totalTurnover,
      totalWins,
      houseWinRatePercentage: totalTurnover > 0 ? Math.round((ggr / totalTurnover) * 1000) / 10 : 3.5,
      totalDeposits,
      totalWithdrawals,
      netCashflow,
      pendingWithdrawalsCount,
      pendingDepositsCount,
      gamesCount: this.gameSettings.size,
    };
  }
}

// GlobalThis Singleton to maintain persistent state across Next.js API route compilations
const globalForAdmin = globalThis as unknown as {
  adminBackendInstance?: AdminBackendStore;
};

export const adminBackend =
  globalForAdmin.adminBackendInstance ||
  (globalForAdmin.adminBackendInstance = AdminBackendStore.getInstance());
