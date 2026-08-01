#ifndef PLATFORM_ENGINE_TIMELINE_TIMELINE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_TIMELINE_TIMELINE_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    enum class TimelineState
    {
        Created,
        Loaded,
        Ready,
        Running,
        Paused,
        Completed,
        Destroyed
    };

    struct TimelineRuntimeComponent
    {
        double currentTime{0.0};
        uint64_t currentTick{0};
        TimelineState state{TimelineState::Created};
        uint32_t nextEventIndex{0};
        uint32_t completedEvents{0};
        uint32_t lastExecutedEventID{0};
    };
}

#endif // PLATFORM_ENGINE_TIMELINE_TIMELINE_RUNTIME_COMPONENT_HPP
