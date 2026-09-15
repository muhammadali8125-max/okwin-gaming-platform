// Crazy 777 / JILI Slot Engine with 4th Special Bonus Reel
export interface SlotSymbol {
  id: string;
  name: string;
  payout3: number;
  color: string;
  iconText: string;
  weight: number;
}

export const SYMBOLS: SlotSymbol[] = [
  { id: "777", name: "Triple Red 7", payout3: 100, color: "#EA4E3D", iconText: "777", weight: 3 },
  { id: "77", name: "Double 7", payout3: 50, color: "#FFAA09", iconText: "77", weight: 6 },
  { id: "7", name: "Lucky 7", payout3: 20, color: "#78E02C", iconText: "7", weight: 10 },
  { id: "BAR3", name: "Triple Bar", payout3: 15, color: "#3B82F6", iconText: "BAR³", weight: 14 },
  { id: "BAR2", name: "Double Bar", payout3: 10, color: "#8B5CF6", iconText: "BAR²", weight: 18 },
  { id: "BAR", name: "Single Bar", payout3: 5, color: "#64748B", iconText: "BAR", weight: 22 },
  { id: "BELL", name: "Golden Bell", payout3: 3, color: "#EAB308", iconText: "🔔", weight: 25 },
];

export const SPECIAL_REEL_ITEMS = [
  { id: "BLANK", name: "None", multiplier: 1, text: "—", weight: 45 },
  { id: "2X", name: "2X Multiplier", multiplier: 2, text: "2X", weight: 25 },
  { id: "5X", name: "5X Multiplier", multiplier: 5, text: "5X", weight: 15 },
  { id: "10X", name: "10X Mega Multiplier", multiplier: 10, text: "10X", weight: 10 },
  { id: "RESPIN", name: "Free Respin", multiplier: 1, text: "RESPIN", weight: 5 },
];

function getRandomItem<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((acc, curr) => acc + curr.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return items[0];
}

export interface SpinResult {
  reels: [SlotSymbol, SlotSymbol, SlotSymbol];
  specialItem: (typeof SPECIAL_REEL_ITEMS)[0];
  isWin: boolean;
  isJackpot: boolean;
  baseMultiplier: number;
  totalMultiplier: number;
  winAmount: number;
  isRespin: boolean;
}

export function spinSlot(betAmount: number): SpinResult {
  const r1 = getRandomItem(SYMBOLS);
  const r2 = getRandomItem(SYMBOLS);
  const r3 = getRandomItem(SYMBOLS);
  const special = getRandomItem(SPECIAL_REEL_ITEMS);

  let isWin = false;
  let baseMultiplier = 0;
  let isJackpot = false;

  // 3 of a kind match
  if (r1.id === r2.id && r2.id === r3.id) {
    isWin = true;
    baseMultiplier = r1.payout3;
    if (r1.id === "777") isJackpot = true;
  }
  // Any 7 combination
  else if (r1.id.startsWith("7") && r2.id.startsWith("7") && r3.id.startsWith("7")) {
    isWin = true;
    baseMultiplier = 8;
  }
  // Any BAR combination
  else if (r1.id.startsWith("BAR") && r2.id.startsWith("BAR") && r3.id.startsWith("BAR")) {
    isWin = true;
    baseMultiplier = 3;
  }

  const totalMultiplier = isWin ? baseMultiplier * special.multiplier : 0;
  const winAmount = totalMultiplier * betAmount;

  return {
    reels: [r1, r2, r3],
    specialItem: special,
    isWin,
    isJackpot,
    baseMultiplier,
    totalMultiplier,
    winAmount,
    isRespin: special.id === "RESPIN",
  };
}
