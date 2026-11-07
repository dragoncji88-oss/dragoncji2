import React, { useEffect } from 'react';
import { Trophy, Sparkles, X, RotateCcw, Volume2, Share2, Check } from 'lucide-react';
import { speakStudentWinner } from '../utils/audio';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  winners: string[];
  startOrder: number;
  onPickAgain: () => void;
  canPickAgain: boolean;
  ttsEnabled: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  isOpen,
  onClose,
  winners,
  startOrder,
  onPickAgain,
  canPickAgain,
  ttsEnabled,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    if (isOpen && winners.length > 0 && ttsEnabled) {
      speakStudentWinner(winners);
    }
  }, [isOpen, winners, ttsEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || winners.length === 0) return null;

  const handleCopy = () => {
    const text = winners.map((name, i) => `${startOrder + i}번째 발표자: ${name}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-amber-300 dark:border-amber-500/40 shadow-2xl overflow-hidden p-6 sm:p-10 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="닫기"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Celebratory Icon & Badge */}
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 mb-4 animate-bounce">
          <Trophy className="w-9 h-9 sm:w-11 sm:h-11" />
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
          <Sparkles className="w-4 h-4" />
          <span>축하합니다! 발표자 당첨</span>
          <Sparkles className="w-4 h-4" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 mb-6">
          {winners.length === 1 ? '오늘의 멋진 발표자' : `선발된 발표자 (${winners.length}명)`}
        </h2>

        {/* Winner Display Cards */}
        <div className="space-y-3 sm:space-y-4 my-6">
          {winners.map((name, index) => {
            const currentOrder = startOrder + index;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-indigo-500/10 border-2 border-amber-400/50 dark:border-amber-400/30 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500 text-white font-black text-sm sm:text-base shadow-sm">
                    #{currentOrder}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                    {currentOrder}번째 발표 순서
                  </span>
                </div>

                <div className="text-3xl sm:text-5xl font-black text-slate-950 dark:text-amber-300 tracking-tight">
                  {name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cheering subtitle */}
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 font-medium mb-8">
          준비된 내용을 당당하고 자신감 있게 발표해 주세요! 👏
        </p>

        {/* Action button controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {canPickAgain && (
            <button
              onClick={() => {
                onClose();
                onPickAgain();
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>다음 발표자 바로 뽑기</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : '당첨자 복사'}</span>
          </button>

          <button
            onClick={() => speakStudentWinner(winners)}
            className="w-full sm:w-auto px-4 py-3.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            title="이름 다시 읽어주기"
          >
            <Volume2 className="w-4 h-4" />
            <span>음성 다시 듣기</span>
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
