#ifndef PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_VALIDATION_CONTROLLER_HPP

#include "engine/core/time/FixedTickSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>
#include <vector>

namespace platform
{
    enum class FixedTickValidationStep
    {
        FPS30,
        FPS60,
        FPS144,
        FPS240,
        RandomFPS,
        Repeat
    };

    class FixedTickValidationController
    {
    public:
        FixedTickValidationController() = default;

        void Initialize();
        void Update(Registry &registry, FixedTickSystem &tickSystem, double dt);

        [[nodiscard]] FixedTickValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }
        [[nodiscard]] bool IsDeterministicMatch() const { return m_deterministicMatch; }

    private:
        FixedTickValidationStep m_step{FixedTickValidationStep::FPS30};
        EntityID m_tickEntity{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
        uint64_t m_baselineHash{0};
        bool m_deterministicMatch{true};
    };
}

#endif // PLATFORM_ENGINE_CORE_TIME_FIXED_TICK_VALIDATION_CONTROLLER_HPP
