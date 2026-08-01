#ifndef PLATFORM_ENGINE_TIMELINE_TIMELINE_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_TIMELINE_TIMELINE_VALIDATION_CONTROLLER_HPP

#include "engine/timeline/TimelineSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>
#include <vector>

namespace platform
{
    enum class TimelineValidationStep
    {
        LoadTimeline,
        Play,
        Pause,
        Resume,
        Seek,
        Restart,
        Repeat
    };

    class TimelineValidationController
    {
    public:
        TimelineValidationController() = default;

        void Initialize();
        void Update(Registry &registry, TimelineSystem &timelineSystem, double dt);

        [[nodiscard]] TimelineValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }
        [[nodiscard]] bool IsEventOrderingDeterministic() const { return m_deterministicOrdering; }

    private:
        TimelineValidationStep m_step{TimelineValidationStep::LoadTimeline};
        EntityID m_timelineEntity{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
        bool m_deterministicOrdering{true};
        std::vector<uint32_t> m_executedEventOrder{};
    };
}

#endif // PLATFORM_ENGINE_TIMELINE_TIMELINE_VALIDATION_CONTROLLER_HPP
