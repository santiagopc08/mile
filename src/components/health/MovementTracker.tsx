'use client';

import { useProfile } from '@/context/ProfileContext';
import { useToast } from '@/components/ui/Toast';


import { useMovementData } from './movement/useMovementData';
import { useMovementMetrics } from './movement/useMovementMetrics';
import { SharedStatusHeader } from './movement/SharedStatusHeader';
import { DualUserPanels } from './movement/DualUserPanels';
import { QuickLogForm } from './movement/QuickLogForm';
import { ProgressAnalytics } from './movement/ProgressAnalytics';
import { ActivityHistory } from './movement/ActivityHistory';

import { REACTION_CONFIG, PRESETS_EL, PRESETS_ELLA } from './movement/constants';
import { useMovementLog } from './movement/useMovementLog';

export function MovementTracker() {
    const { profile } = useProfile();
    const { confirm, success, error: notifyError } = useToast();
    const isElla = profile === 'ella';
    
    // Core styling based on currently logged user
    const accentColor = isElla ? 'var(--color-user-a)' : 'var(--color-user-b)';
    const {
        sessions,
        setSessions,
        isUsingLocalStorage,
        loading,
        fetchSessions,
        handleDeleteSession,
        handleAddReaction
    } = useMovementData(profile);

    const {
        bothActiveToday,
        syncStreak,
        weeklyStats,
        motivationalMessage,
        painAnalytics
    } = useMovementMetrics(sessions);

    const formProps = useMovementLog({
        profile,
        isElla,
        isUsingLocalStorage,
        sessions,
        setSessions,
        fetchSessions
    });

    const handleDeleteSessionWrapper = async (id: string) => {
        const ok = await confirm({
            title: 'Eliminar sesión',
            message: 'Se borrará este registro de actividad. No se puede deshacer.',
            confirmLabel: 'Eliminar',
            tone: 'danger',
        });
        if (!ok) return;
        try {
            await handleDeleteSession(id, notifyError);
            success('Sesión eliminada.');
        } catch (err) {
            // Error handled in hook
            console.error(err);
        }
    };

    // Helper to render chunked progress bars (Brutalist Chunked Progress)
    const renderChunkedBar = (percentage: number, color: string) => {
        const totalChunks = 10;
        const activeChunks = Math.round((percentage / 100) * totalChunks);
        
        return (
            <div className="flex gap-1 w-full mt-2">
                {Array.from({ length: totalChunks }).map((_, index) => {
                    const isActive = index < activeChunks;
                    return (
                        <div 
                            key={index} 
                            className="h-3 flex-1 border border-white/10 transition-all duration-300"
                            style={{ 
                                backgroundColor: isActive ? color : 'transparent',
                                borderColor: isActive ? color : 'rgba(255,255,255,0.1)'
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 font-mono text-[#e5e2e1]">
            <SharedStatusHeader
                bothActiveToday={bothActiveToday}
                accentColor={accentColor}
                isUsingLocalStorage={isUsingLocalStorage}
                motivationalMessage={motivationalMessage}
                syncStreak={syncStreak}
                weeklyStats={weeklyStats}
                renderChunkedBar={renderChunkedBar}
                feedbackMessage={formProps.feedbackMessage}
            />

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
                {/* LEFT COLUMN: DUAL PANELS + SESSIONS LOG FORM */}
                <div className="space-y-6">
                    <DualUserPanels />
                    
                    <QuickLogForm
                        isElla={isElla}
                        accentColor={accentColor}
                        isSubmitting={formProps.isSubmitting}
                        sessionType={formProps.sessionType}
                        setSessionType={formProps.setSessionType}
                        duration={formProps.duration}
                        setDuration={formProps.setDuration}
                        difficulty={formProps.difficulty}
                        setDifficulty={formProps.setDifficulty}
                        energyLevel={formProps.energyLevel}
                        setEnergyLevel={formProps.setEnergyLevel}
                        completionStatus={formProps.completionStatus}
                        setCompletionStatus={formProps.setCompletionStatus}
                        notes={formProps.notes}
                        setNotes={formProps.setNotes}
                        showTherapyFields={formProps.showTherapyFields}
                        painBefore={formProps.painBefore}
                        setPainBefore={formProps.setPainBefore}
                        painAfter={formProps.painAfter}
                        setPainAfter={formProps.setPainAfter}
                        fatigueLevel={formProps.fatigueLevel}
                        setFatigueLevel={formProps.setFatigueLevel}
                        mobilityStatus={formProps.mobilityStatus}
                        setMobilityStatus={formProps.setMobilityStatus}
                        therapistNotes={formProps.therapistNotes}
                        setTherapistNotes={formProps.setTherapistNotes}
                        handleLogSession={formProps.handleLogSession}
                        applyPreset={formProps.applyPreset}
                        presetsEl={PRESETS_EL}
                        presetsElla={PRESETS_ELLA}
                    />
                </div>

                {/* RIGHT COLUMN: RECENT HISTORY + PROGRESS ANALYTICS */}
                <div className="space-y-6">
                    <ProgressAnalytics
                        isElla={isElla}
                        weeklyStats={weeklyStats}
                        sessions={sessions}
                        accentColor={accentColor}
                        painAnalytics={painAnalytics}
                    />

                    <ActivityHistory
                        sessions={sessions}
                        profile={profile as string}
                        loading={loading}
                        handleDeleteSession={handleDeleteSessionWrapper}
                        handleAddReaction={handleAddReaction}
                        REACTION_CONFIG={REACTION_CONFIG}
                    />
                </div>
            </div>

            {/* Custom gradients for layout glow effects */}
            <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                    <linearGradient id="syncGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#c3f400" />
                        <stop offset="100%" stopColor="#ff4b89" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
