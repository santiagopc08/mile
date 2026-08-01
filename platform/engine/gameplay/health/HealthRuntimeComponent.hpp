#ifndef PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_RUNTIME_COMPONENT_HPP

namespace platform
{
    struct HealthRuntimeComponent
    {
        float currentHealth{100.0f};
        bool dead{false};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_RUNTIME_COMPONENT_HPP
