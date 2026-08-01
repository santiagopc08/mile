#ifndef PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct HealthSettingsComponent
    {
        float maximumHealth{100.0f};
        bool invulnerable{false};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_HEALTH_HEALTH_SETTINGS_COMPONENT_HPP
