// Mines Game Engine
export interface TileState {
  index: number;
  isMine: boolean;
  isRevealed: boolean;
  isExploded?: boolean;
}

export function calculateMinesMultiplier(minesCount: number, gemsRevealed: number): number {
  if (gemsRevealed === 0) return 1.0;
  const totalTiles = 25;
  const safeTiles = totalTiles - minesCount;

  if (gemsRevealed > safeTiles) return 1.0;

  // Probability of picking 'gemsRevealed' safe tiles sequentially
  let probability = 1.0;
  for (let i = 0; i < gemsRevealed; i++) {
    probability *= (safeTiles - i) / (totalTiles - i);
  }

  // With 97% RTP house edge
  const rawMultiplier = (1 / probability) * 0.97;
  return Math.round(rawMultiplier * 100) / 100;
}

export function generateMinesGrid(minesCount: number): TileState[] {
  const totalTiles = 25;
  const mineIndices = new Set<number>();

  while (mineIndices.size < minesCount) {
    const randomIndex = Math.floor(Math.random() * totalTiles);
    mineIndices.add(randomIndex);
  }

  const grid: TileState[] = [];
  for (let i = 0; i < totalTiles; i++) {
    grid.push({
      index: i,
      isMine: mineIndices.has(i),
      isRevealed: false,
    });
  }
  return grid;
}
