#include "engine/rhythm/RhythmSystem.hpp"
#include "engine/core/Logger.hpp"
#include <cmath>

namespace platform
{
    void RhythmSystem::play(Registry &registry, EntityID rhythmEntity)
    {
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);
        if (!runtime) runtime = &registry.AddComponent<RhythmRuntimeComponent>(rhythmEntity);

        runtime->playing = true;
        LOG_INFO("[RhythmSystem] Started rhythm playback on entity #{}.", rhythmEntity);
    }

    void RhythmSystem::pause(Registry &registry, EntityID rhythmEntity)
    {
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);
        if (runtime) runtime->playing = false;
    }

    void RhythmSystem::resume(Registry &registry, EntityID rhythmEntity)
    {
        play(registry, rhythmEntity);
    }

    void RhythmSystem::stop(Registry &registry, EntityID rhythmEntity)
    {
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);
        if (runtime)
        {
            runtime->playing = false;
            runtime->songTime = 0.0;
            runtime->beatIndex = 0;
            runtime->subdivisionIndex = 0;
            runtime->currentMeasure = 1;
            runtime->currentPhrase = 1;
            runtime->beatProgress = 0.0;
            LOG_INFO("[RhythmSystem] Stopped rhythm playback on entity #{}.", rhythmEntity);
        }
    }

    void RhythmSystem::seekBeat(Registry &registry, EntityID rhythmEntity, uint64_t targetBeat)
    {
        auto *settings = registry.GetComponent<RhythmSettingsComponent>(rhythmEntity);
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);

        if (!settings) settings = &registry.AddComponent<RhythmSettingsComponent>(rhythmEntity);
        if (!runtime) runtime = &registry.AddComponent<RhythmRuntimeComponent>(rhythmEntity);

        double secondsPerBeat = 60.0 / static_cast<double>(settings->bpm);
        runtime->beatIndex = targetBeat;
        runtime->songTime = static_cast<double>(targetBeat) * secondsPerBeat;
        runtime->currentMeasure = (targetBeat / settings->beatsPerMeasure) + 1;
        runtime->currentPhrase = (targetBeat / (settings->beatsPerMeasure * 4)) + 1;
        runtime->beatProgress = 0.0;
        LOG_INFO("[RhythmSystem] Seeked entity #{} to beat index {}.", rhythmEntity, targetBeat);
    }

    void RhythmSystem::seekTime(Registry &registry, EntityID rhythmEntity, double targetTime)
    {
        auto *settings = registry.GetComponent<RhythmSettingsComponent>(rhythmEntity);
        if (!settings) settings = &registry.AddComponent<RhythmSettingsComponent>(rhythmEntity);

        double secondsPerBeat = 60.0 / static_cast<double>(settings->bpm);
        uint64_t beat = static_cast<uint64_t>(targetTime / secondsPerBeat);
        seekBeat(registry, rhythmEntity, beat);
    }

    void RhythmSystem::setBPM(Registry &registry, EntityID rhythmEntity, float newBPM)
    {
        auto *settings = registry.GetComponent<RhythmSettingsComponent>(rhythmEntity);
        if (!settings) settings = &registry.AddComponent<RhythmSettingsComponent>(rhythmEntity);

        settings->bpm = newBPM;
        LOG_INFO("[RhythmSystem] Set BPM to {:.1f} on entity #{}.", newBPM, rhythmEntity);
    }

    void RhythmSystem::Update(Registry &registry, double dt)
    {
        auto view = registry.GetView<RhythmSettingsComponent, RhythmRuntimeComponent>();
        for (auto entity : view)
        {
            auto *settings = registry.GetComponent<RhythmSettingsComponent>(entity);
            auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(entity);

            if (!settings || !runtime || !runtime->playing) continue;

            runtime->songTime += dt;
            double secondsPerBeat = 60.0 / static_cast<double>(settings->bpm);

            uint64_t newBeatIndex = static_cast<uint64_t>(runtime->songTime / secondsPerBeat);
            runtime->onBeatThisTick = (newBeatIndex > runtime->beatIndex);
            runtime->beatIndex = newBeatIndex;

            runtime->beatProgress = fmod(runtime->songTime, secondsPerBeat) / secondsPerBeat;
            runtime->currentMeasure = (runtime->beatIndex / settings->beatsPerMeasure) + 1;
            runtime->currentPhrase = (runtime->beatIndex / (settings->beatsPerMeasure * 4)) + 1;
            runtime->subdivisionIndex = static_cast<uint64_t>(runtime->songTime / (secondsPerBeat / 4.0));
        }
    }

    uint64_t RhythmSystem::currentBeat(Registry &registry, EntityID rhythmEntity) const
    {
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);
        return runtime ? runtime->beatIndex : 0;
    }

    uint64_t RhythmSystem::currentMeasure(Registry &registry, EntityID rhythmEntity) const
    {
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);
        return runtime ? runtime->currentMeasure : 1;
    }

    double RhythmSystem::songTime(Registry &registry, EntityID rhythmEntity) const
    {
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);
        return runtime ? runtime->songTime : 0.0;
    }

    double RhythmSystem::beatProgress(Registry &registry, EntityID rhythmEntity) const
    {
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);
        return runtime ? runtime->beatProgress : 0.0;
    }

    bool RhythmSystem::isOnBeat(Registry &registry, EntityID rhythmEntity) const
    {
        auto *runtime = registry.GetComponent<RhythmRuntimeComponent>(rhythmEntity);
        return runtime ? runtime->onBeatThisTick : false;
    }

    SubsystemProfilerMetrics RhythmSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Synchronized";
        metrics.cpuTimeMs = 0.01;
        metrics.memoryUsageBytes = sizeof(RhythmRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
