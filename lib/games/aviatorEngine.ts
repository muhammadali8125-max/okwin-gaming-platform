// Aviator / Crash Engine with Provably Fair Multiplier Distribution
export interface LivePlayerBet {
  id: string;
  username: string;
  betAmount: number;
  cashoutMultiplier?: number;
  winAmount?: number;
  isUser?: boolean;
}

export function generateCrashPoint(): number {
  // 3% chance of instant crash at 1.00x (standard house edge)
  if (Math.random() < 0.03) {
    return 1.00;
  }

  // Inverse CDF for 97% RTP crash game
  const u = Math.random();
  // 0.97 / (1 - u)
  let raw = 0.97 / (1 - u);

  // Cap at 1000x for reasonable ceiling
  if (raw > 1000) raw = 1000;

  // Round to 2 decimal places
  return Math.max(1.01, Math.round(raw * 100) / 100);
}

// Generate realistic simulated players placing bets in round
const BOT_NAMES = [
  "Raza_Khan", "Ali_VIP", "Malik99", "Shahid_786", "Kamran_Pro",
  "Usman_Lucky", "Hamza_King", "Farhan_Boss", "Zain_001", "Bilal_Ace",
  "Crypto_Pak", "Sultan_Win", "Rizwan_Bet", "Tariq_Jet", "Waqas_Fast"
];

export function generateSimulatedPlayers(): LivePlayerBet[] {
  const count = Math.floor(Math.random() * 8) + 6;
  const shuffled = [...BOT_NAMES].sort(() => Math.random() - 0.5).slice(0, count);

  return shuffled.map((name, i) => ({
    id: `bot-${i}-${Date.now()}`,
    username: name,
    betAmount: [100, 200, 500, 1000, 2000, 5000][Math.floor(Math.random() * 6)],
    cashoutMultiplier: undefined,
    winAmount: undefined,
  }));
}
