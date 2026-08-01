#ifndef PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_RUNTIME_COMPONENT_HPP

#include "engine/gameplay/failure/FailureSettingsComponent.hpp"

namespace platform
{
    struct FailureRuntimeComponent
    {
        bool failed{false};
        FailureType reason{FailureType::FuelDepletion};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_FAILURE_FAILURE_RUNTIME_COMPONENT_HPP
