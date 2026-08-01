#ifndef PLATFORM_ENGINE_TIMELINE_TIMELINE_SYSTEM_HPP
#define PLATFORM_ENGINE_TIMELINE_TIMELINE_SYSTEM_HPP

#include "engine/timeline/TimelineSettingsComponent.hpp"
#include "engine/timeline/TimelineRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"
#include <functional>

namespace platform
{
    class TimelineSystem : public IRuntimeProfiler
    {
    public:
        TimelineSystem() = default;

        void loadTimeline(Registry &registry, EntityID timelineEntity, const std::vector<TimelineEventData> &events, double duration);
        void play(Registry &registry, EntityID timelineEntity);
        void pause(Registry &registry, EntityID timelineEntity);
        void resume(Registry &registry, EntityID timelineEntity);
        void stop(Registry &registry, EntityID timelineEntity);
        void seek(Registry &registry, EntityID timelineEntity, double targetTime);
        void restart(Registry &registry, EntityID timelineEntity);

        void Update(Registry &registry, double dt, const std::function<void(const TimelineEventData &event)> &onEventExecuted = nullptr);

        [[nodiscard]] double currentTime(Registry &registry, EntityID timelineEntity) const;
        [[nodiscard]] double remainingTime(Registry &registry, EntityID timelineEntity) const;
        [[nodiscard]] uint32_t currentEvent(Registry &registry, EntityID timelineEntity) const;
        [[nodiscard]] uint32_t completedEvents(Registry &registry, EntityID timelineEntity) const;
        [[nodiscard]] TimelineState timelineState(Registry &registry, EntityID timelineEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_TIMELINE_TIMELINE_SYSTEM_HPP
