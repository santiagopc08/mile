#ifndef PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct ResourceRuntimeComponent
    {
        float current{100.0f};
        float previous{100.0f};
        bool depleted{false};
        bool low{false};
        bool dirty{false};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_RUNTIME_COMPONENT_HPP
