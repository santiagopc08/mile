#ifndef PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    enum class FailureType
    {
        FuelDepletion,
        OutOfBounds,
        MissionFailure,
        TimerExpiration
    };

    struct FailureSettingsComponent
    {
        FailureType type{FailureType::FuelDepletion};
        bool enabled{true};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_SETTINGS_COMPONENT_HPP
