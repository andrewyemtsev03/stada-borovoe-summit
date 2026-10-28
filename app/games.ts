export type Game = { id: number; stage: string; name: string };

/** Nine Neo-Tokyo sectors — activity names kept, stage labels racing-framed. */
export const games: Game[] = [
  { id: 1, stage: 'SECTOR 01', name: 'Продай за минуту' },
  { id: 2, stage: 'SECTOR 02', name: 'Крокодил' },
  { id: 3, stage: 'SECTOR 03', name: 'Своя игра' },
  { id: 4, stage: 'SECTOR 04', name: 'Визит в аптеку / к врачу' },
  { id: 5, stage: 'SECTOR 05', name: 'Ситуации на карточках / КВН' },
  { id: 6, stage: 'SECTOR 06', name: 'Танцевальный баттл' },
  { id: 7, stage: 'SECTOR 07', name: 'Расставь в правильном порядке' },
  { id: 8, stage: '★ POLE', name: 'GRAND PRIX Бриф' },
  { id: 9, stage: '★ FINAL', name: 'GRAND PRIX Final Lap' },
];
