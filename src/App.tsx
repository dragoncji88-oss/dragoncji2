import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Users,
  History,
  RotateCcw,
  Dice5,
  Shuffle,
  Trash2,
  Copy,
  Check,
  Download,
  Code,
  FileText,
  AlertCircle,
  HelpCircle,
  Megaphone,
} from 'lucide-react';

import { sound } from './utils/audio';
import { launchConfetti } from './utils/confetti';
import { PRESET_ROSTERS } from './utils/presets';
import { generateStandaloneHtml } from './utils/standaloneHtml';
import { SlotReel } from './components/SlotReel';
import { WinnerModal } from './components/WinnerModal';
import { PickHistoryItem } from './types';

export default function App() {
  // --- Persistent State ---
  const [rosterText, setRosterText] = useState<string>(() => {
    const saved = localStorage.getItem('smart_picker_roster');
    if (saved !== null) return saved;
    return PRESET_ROSTERS[0].students.join('\n');
  });

  const [excludePicked, setExcludePicked] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_picker_exclude');
    return saved !== null ? saved === 'true' : true;
  });

  const [pickCount, setPickCount] = useState<number>(1);
  const [rollDuration, setRollDuration] = useState<number>(2.5); // seconds

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_picker_sound');
    return saved !== null ? saved === 'true' : true;
  });

  const [ttsEnabled, setTtsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_picker_tts');
    return saved !== null ? saved === 'true' : true;
  });

  const [pickedHistory, setPickedHistory] = useState<PickHistoryItem[]>(() => {
    const saved = localStorage.getItem('smart_picker_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // --- Runtime UI State ---
  const [activeTab, setActiveTab] = useState<'roster' | 'history'>('roster');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayNames, setDisplayNames] = useState<string[]>(['준비 완료']);
  const [lastWinners, setLastWinners] = useState<string[] | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedHistory, setCopiedHistory] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rollingIntervalRef = useRef<number | null>(null);

  // Sync sound settings with audio engine
  useEffect(() => {
    sound.enabled = soundEnabled;
    localStorage.setItem('smart_picker_sound', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('smart_picker_tts', String(ttsEnabled));
  }, [ttsEnabled]);

  useEffect(() => {
    localStorage.setItem('smart_picker_roster', rosterText);
  }, [rosterText]);

  useEffect(() => {
    localStorage.setItem('smart_picker_exclude', String(excludePicked));
  }, [excludePicked]);

  useEffect(() => {
    localStorage.setItem('smart_picker_history', JSON.stringify(pickedHistory));
  }, [pickedHistory]);

  // Clean parsed student roster with trim & filter
  const allStudents = useMemo(() => {
    return rosterText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }, [rosterText]);

  // Set of already picked names
  const pickedNamesSet = useMemo(() => {
    return new Set(pickedHistory.map((h) => h.name));
  }, [pickedHistory]);

  // Eligible candidates
  const eligibleCandidates = useMemo(() => {
    if (!excludePicked) {
      return allStudents;
    }
    return allStudents.filter((name) => !pickedNamesSet.has(name));
  }, [allStudents, excludePicked, pickedNamesSet]);

  // Update default display names when idle
  useEffect(() => {
    if (!isRolling && !lastWinners) {
      if (eligibleCandidates.length === 0) {
        setDisplayNames(Array.from({ length: pickCount }, () => '명단 필요'));
      } else {
        setDisplayNames(
          Array.from({ length: pickCount }, (_, i) => eligibleCandidates[i % eligibleCandidates.length] || '준비 완료')
        );
      }
    }
  }, [eligibleCandidates, pickCount, isRolling, lastWinners]);

  // Handle Fullscreen events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard Spacebar to draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT' && !showExportModal) {
          e.preventDefault();
          if (showWinnerModal) {
            setShowWinnerModal(false);
          } else if (!isRolling) {
            startDraw();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // --- Main Draw Logic ---
  const startDraw = () => {
    if (isRolling) return;
    setAlertMessage(null);

    if (eligibleCandidates.length === 0) {
      sound.playWarning();
      setAlertMessage('추첨 가능한 학생이 없습니다! 명단을 확인하거나 [추첨 기록 리셋]을 눌러주세요.');
      return;
    }

    const availableCount = eligibleCandidates.length;
    const actualPickCount = Math.min(pickCount, availableCount);

    if (pickCount > availableCount && excludePicked) {
      setAlertMessage(`남은 학생이 ${availableCount}명뿐이어서 남은 전원을 선발합니다.`);
    }

    // Pick random unique winners from eligibleCandidates
    const pool = [...eligibleCandidates];
    const chosenWinners: string[] = [];
    for (let i = 0; i < actualPickCount; i++) {
      const randIdx = Math.floor(Math.random() * pool.length);
      chosenWinners.push(pool[randIdx]);
      pool.splice(randIdx, 1);
    }

    setIsRolling(true);
    setLastWinners(null);

    // Audio riser for suspense
    sound.playRiser(rollDuration);

    const startTime = performance.now();
    const durationMs = rollDuration * 1000;
    let lastTickTime = 0;

    const frameStep = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // Dynamically slowing tick intervals
      const tickInterval = 50 + Math.pow(progress, 2.8) * 220;
      if (currentTime - lastTickTime > tickInterval) {
        sound.playTick(1.0 + (1 - progress) * 0.3);
        lastTickTime = currentTime;
      }

      // Rapidly shuffle random names
      setDisplayNames(
        Array.from({ length: actualPickCount }, () => {
          return eligibleCandidates[Math.floor(Math.random() * eligibleCandidates.length)];
        })
      );

      if (elapsed < durationMs) {
        rollingIntervalRef.current = requestAnimationFrame(frameStep);
      } else {
        // Complete the roll!
        setIsRolling(false);
        setLastWinners(chosenWinners);
        setDisplayNames(chosenWinners);

        // Record in history
        const nowStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const startOrder = pickedHistory.length + 1;
        const newHistoryItems: PickHistoryItem[] = chosenWinners.map((name, i) => ({
          id: `${Date.now()}_${i}`,
          name,
          order: startOrder + i,
          timestamp: nowStr,
        }));

        setPickedHistory((prev) => [...prev, ...newHistoryItems]);

        // Celebrate!
        sound.playFanfare();
        if (canvasRef.current) {
          launchConfetti(canvasRef.current, 3600);
        }
        setShowWinnerModal(true);
      }
    };

    rollingIntervalRef.current = requestAnimationFrame(frameStep);
  };

  // Restore single student
  const handleRestoreStudent = (studentName: string) => {
    setPickedHistory((prev) => prev.filter((h) => h.name !== studentName));
  };

  // Reset all history
  const handleResetHistory = () => {
    if (pickedHistory.length === 0) return;
    if (window.confirm('추첨 기록을 모두 초기화할까요? 모든 학생이 다시 추첨 대상이 됩니다.')) {
      setPickedHistory([]);
      setLastWinners(null);
      setAlertMessage('추첨 기록이 초기화되었습니다. 전체 학생 대상 추첨이 가능합니다.');
    }
  };

  // Preset roster selection
  const handleSelectPreset = (students: string[]) => {
    setRosterText(students.join('\n'));
    setPickedHistory([]);
    setLastWinners(null);
  };

  // Shuffle names
  const handleShuffleRoster = () => {
    const shuffled = [...allStudents].sort(() => Math.random() - 0.5);
    setRosterText(shuffled.join('\n'));
  };

  // Copy history text
  const handleCopyHistory = () => {
    if (pickedHistory.length === 0) return;
    const text = pickedHistory
      .map((h) => `${h.order}번째 발표자: ${h.name} (${h.timestamp})`)
      .join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedHistory(true);
      setTimeout(() => setCopiedHistory(false), 2000);
    });
  };

  // Download history as text file
  const handleDownloadHistory = () => {
    if (pickedHistory.length === 0) return;
    const text = `=== 스마트 학생 발표자 선발 명단 ===\n일시: ${new Date().toLocaleDateString('ko-KR')} ${new Date().toLocaleTimeString('ko-KR')}\n\n` +
      pickedHistory.map((h) => `${h.order}번째 발표자: ${h.name} (${h.timestamp})`).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `발표자선발기록_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy standalone HTML code
  const handleCopyStandaloneCode = () => {
    const html = generateStandaloneHtml();
    navigator.clipboard.writeText(html).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  // Download standalone HTML file
  const handleDownloadStandaloneHtml = () => {
    const html = generateStandaloneHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'smart-presenter-picker.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col antialiased">
      {/* Canvas Confetti Layer */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Top Bar Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Trophy className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  스마트 학생 발표자 뽑기
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  교실 수업용
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                초·중·고 교사용 스마트 추첨 프로그램
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
              }`}
              title="효과음 켜기/끄기"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-500" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">{soundEnabled ? '효과음 ON' : '음소거'}</span>
            </button>

            {/* TTS Voice Toggle */}
            <button
              onClick={() => setTtsEnabled((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                ttsEnabled
                  ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                  : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
              title="이름 음성 낭독 (TTS) 켜기/끄기"
            >
              <Megaphone className={`w-3.5 h-3.5 ${ttsEnabled ? 'text-amber-500' : 'text-slate-400'}`} />
              <span className="hidden md:inline">{ttsEnabled ? '이름 낭독 ON' : '낭독 OFF'}</span>
            </button>

            {/* Standalone HTML Export Modal Trigger */}
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 transition-colors shadow-xs"
              title="단일 파일 HTML 다운로드 / 코드 복사"
            >
              <Code className="w-3.5 h-3.5" />
              <span>단일 HTML 저장</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 items-center gap-1.5 transition-colors"
              title="전체화면 모드 (TV / 프로젝터용)"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? '창모드' : '전체화면'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Arena: Drawing Stage (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-5">
          {/* Main Stage Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Top Status Bar */}
            <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isRolling ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
                  }`}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {isRolling ? '긴장감 넘치는 추첨 진행 중...' : '추첨 대기 중'}
                </span>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 font-semibold text-slate-700 dark:text-slate-200">
                <span>
                  전체: <strong className="text-slate-900 dark:text-white tabular-nums">{allStudents.length}</strong>명
                </span>
                <span>·</span>
                <span>
                  남은 인원:{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400 tabular-nums text-sm">
                    {eligibleCandidates.length}
                  </strong>
                  명
                </span>
                <span>·</span>
                <span>
                  선발 완료:{' '}
                  <strong className="text-amber-600 dark:text-amber-400 tabular-nums text-sm">
                    {pickedHistory.length}
                  </strong>
                  명
                </span>
              </div>
            </div>

            {/* Dynamic Slot Reels */}
            <div className="w-full my-4">
              <SlotReel
                isRolling={isRolling}
                pickCount={pickCount}
                displayNames={displayNames}
                winners={lastWinners}
                totalRemaining={eligibleCandidates.length}
              />
            </div>

            {/* Selection Options Toolbar */}
            <div className="w-full bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
              {/* Pick Count Selector */}
              <div className="flex items-center gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  한 번에 뽑을 인원:
                </label>
                <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs">
                  {[1, 2, 3, 4, 5].map((count) => (
                    <button
                      key={count}
                      type="button"
                      disabled={isRolling}
                      onClick={() => setPickCount(count)}
                      className={`px-3 py-1 rounded-md font-bold text-xs transition-colors ${
                        pickCount === count
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {count}명
                    </button>
                  ))}
                </div>
              </div>

              {/* Exclusion & Speed Settings */}
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none font-medium text-slate-700 dark:text-slate-300 text-xs">
                  <input
                    type="checkbox"
                    checked={excludePicked}
                    disabled={isRolling}
                    onChange={(e) => setExcludePicked(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>한 번 뽑힌 학생은 제외 (중복 방지)</span>
                </label>
              </div>
            </div>

            {/* Giant Pick Presenter Button */}
            <div className="w-full mt-6">
              <button
                type="button"
                disabled={isRolling || eligibleCandidates.length === 0}
                onClick={startDraw}
                className={`w-full py-5 sm:py-6 rounded-2xl font-black text-2xl sm:text-3xl tracking-tight shadow-xl transition-all flex items-center justify-center gap-3 ${
                  isRolling
                    ? 'bg-slate-400 dark:bg-slate-700 text-white cursor-wait animate-pulse'
                    : eligibleCandidates.length === 0
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-700 hover:via-indigo-600 hover:to-indigo-700 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.01] active:scale-[0.98]'
                }`}
              >
                <Dice5 className={`w-8 h-8 ${isRolling ? 'animate-spin' : ''}`} />
                <span>{isRolling ? '발표자 추첨 중...' : '발표자 뽑기'}</span>
              </button>
              <p className="text-center text-xs text-slate-600 dark:text-slate-300 mt-2.5 font-medium flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>키보드 [Space] 스페이스바를 눌러도 즉시 추첨할 수 있습니다</span>
              </p>
            </div>
          </div>

          {/* Alert Message Toast */}
          {alertMessage && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>{alertMessage}</span>
              </div>
              <button
                onClick={() => setAlertMessage(null)}
                className="text-amber-700 dark:text-amber-300 hover:text-amber-900 text-xs font-bold underline"
              >
                닫기
              </button>
            </div>
          )}

          {/* Classroom Tips Banner */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-3">
            <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">선생님 수업 팁</p>
              <p>
                빔프로젝터나 전자칠판 연결 시 우측 상단의 <strong>[전체화면]</strong> 버튼을 누르면 교실 맨 뒷자리에서도 학생 이름이 선명하게 보입니다. 모둠 활동 시에는 상단에서 <strong>[3명]</strong> 또는 <strong>[4명]</strong>을 선택하여 조별 대표를 한 번에 선발할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* Right Deck: Roster Management & Selection History (5 cols) */}
        <aside className="lg:col-span-5 flex flex-col gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
            {/* Segmented Tab Headers */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'roster'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-500" />
                <span>학생 명단 관리 ({allStudents.length}명)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <History className="w-4 h-4 text-amber-500" />
                <span>완료된 발표자 ({pickedHistory.length}명)</span>
              </button>
            </div>

            {/* TAB 1: Roster Textarea & Preset Controls */}
            {activeTab === 'roster' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                {/* Roster Presets Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      추천 명단 불러오기:
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_ROSTERS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.students)}
                        className="p-2 rounded-xl text-left border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 transition-colors"
                      >
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {preset.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {preset.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea Input */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="rosterArea" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      학생 이름 명단 (줄바꿈 또는 쉼표 구분):
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleShuffleRoster}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Shuffle className="w-3 h-3" />
                        <span>명단 섞기</span>
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('명단을 모두 비우시겠습니까?')) {
                            setRosterText('');
                            setPickedHistory([]);
                            setLastWinners(null);
                          }
                        }}
                        className="text-xs text-rose-500 hover:underline font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>비우기</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    id="rosterArea"
                    rows={7}
                    value={rosterText}
                    onChange={(e) => setRosterText(e.target.value)}
                    placeholder="김도윤&#10;이시우&#10;박서준&#10;최예준..."
                    className="w-full p-3.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium leading-relaxed resize-y"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>공백이나 빈 줄은 자동으로 제거됩니다.</span>
                    <span>
                      추출된 유효 인원:{' '}
                      <strong className="text-slate-700 dark:text-slate-200 font-bold">{allStudents.length}명</strong>
                    </span>
                  </div>
                </div>

                {/* Current Eligible Candidates Chips */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    <span>현재 추첨 가능 학생 ({eligibleCandidates.length}명)</span>
                    {excludePicked && pickedHistory.length > 0 && (
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-normal">
                        ({pickedHistory.length}명 제외됨)
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                    {eligibleCandidates.length === 0 ? (
                      <span className="text-slate-400 text-xs py-2">추첨 가능한 학생이 없습니다.</span>
                    ) : (
                      eligibleCandidates.map((name, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 font-medium shadow-2xs"
                        >
                          {name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Selection History */}
            {activeTab === 'history' && (
              <div className="flex flex-col gap-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    오늘의 발표자 선발 기록:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyHistory}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold flex items-center gap-1"
                    >
                      {copiedHistory ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHistory ? '복사됨' : '기록 복사'}</span>
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <button
                      type="button"
                      onClick={handleDownloadHistory}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>파일 저장</span>
                    </button>
                  </div>
                </div>

                {/* History List */}
                <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto p-1">
                  {pickedHistory.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <Trophy className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <p>아직 선발된 발표자가 없습니다.</p>
                      <p className="mt-1">발표자를 뽑으면 여기에 순서대로 기록됩니다.</p>
                    </div>
                  ) : (
                    pickedHistory.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                            #{item.order}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-400">{item.timestamp}</div>
                          </div>
                        </div>

                        {excludePicked && (
                          <button
                            type="button"
                            onClick={() => handleRestoreStudent(item.name)}
                            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold px-2 py-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                          >
                            후보 복귀
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Reset History Action */}
                {pickedHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetHistory}
                    className="w-full py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>추첨 기록 리셋 (모든 학생 다시 추첨 대상으로)</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* Winner Pop-up Modal */}
      <WinnerModal
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        winners={lastWinners || []}
        startOrder={pickedHistory.length - (lastWinners?.length || 0) + 1}
        onPickAgain={startDraw}
        canPickAgain={eligibleCandidates.length > 0}
        ttsEnabled={ttsEnabled}
      />

      {/* Standalone HTML Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-2xl w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  단일 파일 (index.html) 내보내기 & 복사
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4">
              외부 서버나 추가 설치 없이 브라우저에서 바로 더블 클릭해 실행 가능한 <strong>단일 파일(index.html)</strong> 형태입니다. USB 메모리에 담아가거나 인터넷이 없는 교실 컴퓨터에서도 즉시 작동합니다.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-6 flex flex-col gap-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                포함된 기능:
              </div>
              <ul className="text-xs text-slate-500 dark:text-slate-400 list-disc list-inside space-y-1">
                <li>줄바꿈/쉼표 명단 입력 및 실시간 인원 카운터</li>
                <li>카지노 슬롯 롤링 연출 및 Web Audio API 효과음 (비프음 & 팡파르)</li>
                <li>순수 HTML5 Canvas Confetti 축하 폭죽 효과</li>
                <li>중복 당첨 방지 및 완료된 발표자 순서 기록</li>
                <li>1명~5명 다인원 동시 선발 및 대형 당첨 팝업 모달</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={handleCopyStandaloneCode}
                className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? '전체 코드 복사 완료!' : 'HTML 코드 전체 복사'}</span>
              </button>

              <button
                onClick={handleDownloadStandaloneHtml}
                className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md shadow-indigo-600/30"
              >
                <Download className="w-4 h-4" />
                <span>단일 HTML 파일 다운로드 (.html)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
