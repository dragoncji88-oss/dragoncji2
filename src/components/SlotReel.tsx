import React from 'react';
import { Sparkles, Trophy, UserCheck } from 'lucide-react';

interface SlotReelProps {
  isRolling: boolean;
  pickCount: number;
  displayNames: string[];
  winners: string[] | null;
  totalRemaining: number;
}

export const SlotReel: React.FC<SlotReelProps> = ({
  isRolling,
  pickCount,
  displayNames,
  winners,
  totalRemaining,
}) => {
  // If not rolling and no winners yet
  const hasResult = winners && winners.length > 0;

  // Determine grid layout based on count
  const getGridCols = () => {
    if (pickCount === 1) return 'grid-cols-1 max-w-xl mx-auto';
    if (pickCount === 2) return 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto';
    if (pickCount === 3) return 'grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto';
    if (pickCount === 4) return 'grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 max-w-6xl mx-auto';
  };

  return (
    <div className="w-full">
      <div className={`grid gap-4 sm:gap-6 ${getGridCols()}`}>
        {Array.from({ length: pickCount }).map((_, index) => {
          const name = hasResult ? winners[index] : displayNames[index] || '준비 완료';
          const isWinnerSlot = hasResult && Boolean(winners[index]);

          return (
            <div
              key={index}
              className={`relative overflow-hidden rounded-2xl transition-all duration-300 border ${
                isWinnerSlot
                  ? 'bg-amber-500/10 border-amber-400 dark:border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                  : isRolling
                  ? 'bg-indigo-500/10 border-indigo-400 dark:border-indigo-400 shadow-lg shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-sm'
              }`}
            >
              {/* Header slot badge */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/50">
                <div className="flex items-center gap-1.5 text-xs font-bold tracking-tight text-slate-600 dark:text-slate-300">
                  {isWinnerSlot ? (
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  )}
                  <span>
                    {pickCount > 1 ? `발표자 ${index + 1}` : '발표자 슬롯'}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  {isRolling ? '추첨 진행 중...' : isWinnerSlot ? '선발 완료' : '대기 중'}
                </span>
              </div>

              {/* Reel Card Stage */}
              <div
                className={`flex flex-col items-center justify-center p-6 sm:p-8 min-h-[170px] sm:min-h-[200px] select-none text-center relative ${
                  isRolling ? 'animate-pulse' : ''
                }`}
              >
                {/* Background decorative watermark or light effects */}
                {isWinnerSlot && (
                  <div className="absolute inset-0 bg-radial from-amber-400/15 via-transparent to-transparent pointer-events-none" />
                )}

                {isRolling && (
                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-indigo-500/15 to-indigo-500/5 pointer-events-none animate-slot-fast" />
                )}

                {/* Status indicator icon above name */}
                {isWinnerSlot && (
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs tracking-wider mb-2 animate-bounce">
                    <Sparkles className="w-4 h-4" />
                    <span>당첨 축하합니다!</span>
                  </div>
                )}

                {/* Candidate Name Display */}
                <div
                  className={`font-black tracking-tight transition-transform duration-150 ${
                    pickCount === 1
                      ? 'text-4xl sm:text-5xl md:text-6xl'
                      : pickCount <= 3
                      ? 'text-3xl sm:text-4xl'
                      : 'text-2xl sm:text-3xl'
                  } ${
                    isWinnerSlot
                      ? 'text-amber-900 dark:text-amber-300 drop-shadow-sm scale-105'
                      : isRolling
                      ? 'text-indigo-900 dark:text-indigo-200 blur-[0.4px]'
                      : totalRemaining === 0
                      ? 'text-slate-600 dark:text-slate-300'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {name}
                </div>

                {/* Subtext info */}
                <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {isWinnerSlot
                    ? '멋진 발표를 응원합니다'
                    : isRolling
                    ? '두구두구두구...'
                    : totalRemaining === 0
                    ? '명단을 입력하거나 기록을 리셋하세요'
                    : '발표자 뽑기 버튼을 눌러주세요'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
