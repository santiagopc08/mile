'use client';

import { AnimatedBrutalistCorners } from '@/components/ui/AnimatedBrutalistCorners';
import { usePomodoroTimer } from './pomodoro/usePomodoroTimer';
import { PomodoroHeader } from './pomodoro/PomodoroHeader';
import { PomodoroTaskSelector } from './pomodoro/PomodoroTaskSelector';
import { PomodoroDisplay } from './pomodoro/PomodoroDisplay';
import { PomodoroSessionMap } from './pomodoro/PomodoroSessionMap';
import { PomodoroPresets } from './pomodoro/PomodoroPresets';
import { PomodoroChecklist } from './pomodoro/PomodoroChecklist';
import { PomodoroControls } from './pomodoro/PomodoroControls';
import { PomodoroFullscreen } from './pomodoro/PomodoroFullscreen';

export function PomodoroTimer() {
    const {
        mounted,
        totalBudget,
        currentSession,
        mode,
        timeLeft,
        isRunning,
        elapsedSeconds,
        isFullscreen,
        setIsFullscreen,
        showConfig,
        setShowConfig,
        accentHex,
        selectedTaskId,
        setSelectedTaskId,
        isDropdownOpen,
        setIsDropdownOpen,
        tasks,
        activeTask,
        sessionPlan,
        totalPlannedDuration,
        totalSessions,
        currentSessionDuration,
        isSessionActive,
        handleStart,
        handlePause,
        handleSkip,
        handleReset,
        handleExitFullscreen,
        updateBudget,
        formatTime,
        toggleTaskChecklist,
        progressPercent
    } = usePomodoroTimer();

    return (
        <div className="w-full font-mono text-[#e5e2e1] space-y-5 max-w-2xl mx-auto">
            
            <PomodoroHeader
                isRunning={isRunning}
                mode={mode}
                isSessionActive={isSessionActive}
                currentSession={currentSession}
                totalSessions={totalSessions}
                totalBudget={totalBudget}
                accentHex={accentHex}
            />

            <PomodoroTaskSelector
                isRunning={isRunning}
                selectedTaskId={selectedTaskId}
                setSelectedTaskId={setSelectedTaskId}
                activeTask={activeTask}
                isDropdownOpen={isDropdownOpen}
                setIsDropdownOpen={setIsDropdownOpen}
                tasks={tasks}
                accentHex={accentHex}
            />

            {/* MAIN CORE: Displays Digital Clock & Reactor when running/active, or Presets Configurator when idle */}
            <div className="relative border border-white/12 bg-black/40 backdrop-blur-xl p-5 sm:p-7 overflow-hidden">
                <AnimatedBrutalistCorners color={mode === 'work' ? accentHex : '#00dbe9'} size={10} />

                <PomodoroDisplay
                    mode={mode}
                    isRunning={isRunning}
                    timeLeft={timeLeft}
                    elapsedSeconds={elapsedSeconds}
                    currentSessionDuration={currentSessionDuration}
                    progressPercent={progressPercent}
                    formatTime={formatTime}
                    accentHex={accentHex}
                />

                <PomodoroSessionMap
                    sessionPlan={sessionPlan}
                    totalPlannedDuration={totalPlannedDuration}
                    currentSession={currentSession}
                    elapsedSeconds={elapsedSeconds}
                    totalBudget={totalBudget}
                    accentHex={accentHex}
                />

                {!isRunning && (
                    <PomodoroPresets
                        totalBudget={totalBudget}
                        updateBudget={updateBudget}
                        showConfig={showConfig}
                        setShowConfig={setShowConfig}
                        accentHex={accentHex}
                    />
                )}

                <PomodoroChecklist
                    activeTask={activeTask}
                    toggleTaskChecklist={toggleTaskChecklist}
                />
            </div>

            <PomodoroControls
                isRunning={isRunning}
                isSessionActive={isSessionActive}
                accentHex={accentHex}
                handleStart={handleStart}
                handlePause={handlePause}
                handleSkip={handleSkip}
                handleReset={handleReset}
                setIsFullscreen={setIsFullscreen}
            />

            {mounted && (
                <PomodoroFullscreen
                    isFullscreen={isFullscreen}
                    isRunning={isRunning}
                    mode={mode}
                    currentSession={currentSession}
                    totalSessions={totalSessions}
                    timeLeft={timeLeft}
                    elapsedSeconds={elapsedSeconds}
                    currentSessionDuration={currentSessionDuration}
                    progressPercent={progressPercent}
                    selectedTaskId={selectedTaskId}
                    activeTask={activeTask}
                    accentHex={accentHex}
                    formatTime={formatTime}
                    handleStart={handleStart}
                    handlePause={handlePause}
                    handleSkip={handleSkip}
                    handleReset={handleReset}
                    handleExitFullscreen={handleExitFullscreen}
                    toggleTaskChecklist={toggleTaskChecklist}
                />
            )}
        </div>
    );
}
