#ifndef PLATFORM_ENGINE_RHYTHM_RHYTHM_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_RHYTHM_RHYTHM_VALIDATION_CONTROLLER_HPP

#include "engine/rhythm/RhythmSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class RhythmValidationStep
    {
        StartSong,
        Run60Seconds,
        Pause,
        Resume,
        Seek,
        Restart,
        Repeat
    };

    class RhythmValidationController
    {
    public:
        RhythmValidationController() = default;

        void Initialize();
        void Update(Registry &registry, RhythmSystem &rhythmSystem, double dt);

        [[nodiscard]] RhythmValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }
        [[nodiscard]] double AccumulatedDrift() const { return m_accumulatedDrift; }

    private:
        RhythmValidationStep m_step{RhythmValidationStep::StartSong};
        EntityID m_rhythmEntity{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
        double m_accumulatedDrift{0.0};
    };
}

#endif // PLATFORM_ENGINE_RHYTHM_RHYTHM_VALIDATION_CONTROLLER_HPP
