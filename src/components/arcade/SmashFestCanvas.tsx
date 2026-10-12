'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useSmashFest } from './smashfest/hooks/useSmashFest';
import { TopBars } from './smashfest/TopBars';
import { BottomControls } from './smashfest/BottomControls';
import { Modals } from './smashfest/Modals';

const SmashFest3D = dynamic(() => import('@/app/smash-fest/components/SmashFestGame'), {
  ssr: false,
  loading: () => (
    <div className="flex w-full h-full min-h-[500px] items-center justify-center text-white font-mono uppercase text-xs">
      <span className="animate-spin text-[#ff4b89] mr-2">◆</span> CARGANDO MOTOR 3D Y FÍSICA CANNON...
    </div>
  ),
});

interface SmashFestCanvasProps {
  accentColor?: string;
}

export function SmashFestCanvas({}: SmashFestCanvasProps) {
  const {
    levelId,
    setLevelId,
    activeWildcard,
    setActiveWildcard,
    shotPower,
    setShotPower,
    memoryToasts,
    comboToast,
    wildcardAmmo,
    overcharge,
    isVictoryModalOpen,
    isOutOfAmmoModalOpen,
    isSoundMuted,
    setIsSoundMuted,
    isHelpOpen,
    setIsHelpOpen,
    stats,
    resetKey,
    generated,
    setGenerated,
    scores,
    todayScore,
    lastRun,
    handleResetLevel,
    handleGenerateLevel,
    handleDailyChallenge,
    handleNextLevel,
    handleMemoryBlockTriggered,
    handleComboTriggered,
    handleWildcardAmmoUpdate,
    handleOverchargeUpdate,
    handleLevelCompleted,
    handleOutOfAmmo,
    handleStatsUpdate,
  } = useSmashFest();

  return (
    <div className="relative h-[74vh] max-h-[820px] min-h-[540px] w-full overflow-hidden rounded-3xl border border-white/15 bg-[#0a0814] shadow-[0_24px_70px_rgba(0,0,0,0.85)] select-none font-mono">
      <TopBars
        levelId={levelId}
        setLevelId={setLevelId}
        generated={generated}
        setGenerated={setGenerated}
        scores={scores}
        todayScore={todayScore}
        handleResetLevel={handleResetLevel}
        handleDailyChallenge={handleDailyChallenge}
        handleGenerateLevel={handleGenerateLevel}
        isSoundMuted={isSoundMuted}
        setIsSoundMuted={setIsSoundMuted}
        setIsHelpOpen={setIsHelpOpen}
        stats={stats}
      />

      {/* Interactive 3D Canvas */}
      <div className="absolute inset-0 w-full h-full">
        <SmashFest3D
          levelId={levelId}
          activeWildcard={activeWildcard}
          shotPower={shotPower}
          resetKey={resetKey}
          levelOverride={generated}
          onMemoryBlockTriggered={handleMemoryBlockTriggered}
          onComboTriggered={handleComboTriggered}
          onWildcardAmmoUpdate={handleWildcardAmmoUpdate}
          onOverchargeUpdate={handleOverchargeUpdate}
          onLevelCompleted={handleLevelCompleted}
          onOutOfAmmo={handleOutOfAmmo}
          onStatsUpdate={handleStatsUpdate}
          isSoundMuted={isSoundMuted}
        />
      </div>

      <BottomControls
        activeWildcard={activeWildcard}
        setActiveWildcard={setActiveWildcard}
        wildcardAmmo={wildcardAmmo}
        shotPower={shotPower}
        setShotPower={setShotPower}
        overcharge={overcharge}
      />

      {/* Floating Memory & Combo Toasts */}
      <div className="absolute top-20 right-4 z-30 flex flex-col gap-2 pointer-events-none">
        {comboToast && (
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 border border-pink-400 px-4 py-2 rounded-2xl shadow-[0_0_25px_rgba(236,72,153,0.7)] text-white text-xs font-black uppercase tracking-wider animate-bounce">
            {comboToast.label}
          </div>
        )}

        {memoryToasts.map((toast: { id: number; label: string; icon?: string }) => (
          <div
            key={toast.id}
            className="bg-black/90 border border-cyan-400/60 px-4 py-2 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] backdrop-blur-md text-cyan-300 text-xs font-bold flex items-center gap-2 animate-slide-in-bottom"
          >
            <span>{toast.icon || '✨'}</span>
            <span>{toast.label}</span>
          </div>
        ))}
      </div>

      <Modals
        isVictoryModalOpen={isVictoryModalOpen}
        isOutOfAmmoModalOpen={isOutOfAmmoModalOpen}
        isHelpOpen={isHelpOpen}
        setIsHelpOpen={setIsHelpOpen}
        lastRun={lastRun}
        handleResetLevel={handleResetLevel}
        handleNextLevel={handleNextLevel}
      />
    </div>
  );
}
