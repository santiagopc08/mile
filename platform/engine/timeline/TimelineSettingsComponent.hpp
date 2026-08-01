#ifndef PLATFORM_ENGINE_TIMELINE_TIMELINE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_TIMELINE_TIMELINE_SETTINGS_COMPONENT_HPP

#include <cstdint>
#include <string>
#include <vector>

namespace platform
{
    enum class TimelineMode
    {
        SimulationTime,
        FixedTick,
        Beat,
        Frame
    };

    struct TimelineEventData
    {
        uint32_t eventID{0};
        double timestamp{0.0};          // Seconds, Ticks, or Beats depending on TimelineMode
        uint32_t priority{0};
        std::string payload{};
    };

    struct TimelineSettingsComponent
    {
        TimelineMode mode{TimelineMode::SimulationTime};
        bool looping{false};
        double duration{10.0};
        std::vector<TimelineEventData> events{};
    };
}

#endif // PLATFORM_ENGINE_TIMELINE_TIMELINE_SETTINGS_COMPONENT_HPP
