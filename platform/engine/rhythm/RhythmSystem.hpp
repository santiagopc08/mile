#ifndef PLATFORM_ENGINE_RHYTHM_RHYTHM_SYSTEM_HPP
#define PLATFORM_ENGINE_RHYTHM_RHYTHM_SYSTEM_HPP

#include "engine/rhythm/RhythmSettingsComponent.hpp"
#include "engine/rhythm/RhythmRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"

namespace platform
{
    class RhythmSystem : public IRuntimeProfiler
    {
    public:
        RhythmSystem() = default;

        void play(Registry &registry, EntityID rhythmEntity);
        void pause(Registry &registry, EntityID rhythmEntity);
        void resume(Registry &registry, EntityID rhythmEntity);
        void stop(Registry &registry, EntityID rhythmEntity);
        void seekBeat(Registry &registry, EntityID rhythmEntity, uint64_t targetBeat);
        void seekTime(Registry &registry, EntityID rhythmEntity, double targetTime);
        void setBPM(Registry &registry, EntityID rhythmEntity, float newBPM);

        void Update(Registry &registry, double dt);

        [[nodiscard]] uint64_t currentBeat(Registry &registry, EntityID rhythmEntity) const;
        [[nodiscard]] uint64_t currentMeasure(Registry &registry, EntityID rhythmEntity) const;
        [[nodiscard]] double songTime(Registry &registry, EntityID rhythmEntity) const;
        [[nodiscard]] double beatProgress(Registry &registry, EntityID rhythmEntity) const;
        [[nodiscard]] bool isOnBeat(Registry &registry, EntityID rhythmEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_RHYTHM_RHYTHM_SYSTEM_HPP
