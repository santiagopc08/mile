#ifndef PLATFORM_ENGINE_TRIGGER_TRIGGER_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_TRIGGER_TRIGGER_VALIDATION_CONTROLLER_HPP

#include "engine/trigger/TriggerSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class TriggerValidationStep
    {
        LoadTimeline,
        ExecuteTriggerA,
        ExecuteTriggerB,
        ExecuteSimultaneousTriggers,
        Restart,
        Repeat
    };

    class TriggerValidationController
    {
    public:
        TriggerValidationController() = default;

        void Initialize();
        void Update(Registry &registry, TriggerSystem &triggerSystem, double dt);

        [[nodiscard]] TriggerValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        TriggerValidationStep m_step{TriggerValidationStep::LoadTimeline};
        EntityID m_triggerA{kNullEntity};
        EntityID m_triggerB{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_TRIGGER_TRIGGER_VALIDATION_CONTROLLER_HPP
