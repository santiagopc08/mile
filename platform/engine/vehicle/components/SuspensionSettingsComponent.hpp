#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_SUSPENSION_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_SUSPENSION_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct SuspensionSettingsComponent
    {
        float frequencyHz{5.0f};
        float dampingRatio{0.7f};
        float travel{0.35f};
        float preload{5.0f};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_SUSPENSION_SETTINGS_COMPONENT_HPP
