#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_CONTROLLER_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_CONTROLLER_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct VehicleControllerSettingsComponent
    {
        float throttleSensitivity{1.0f};
        float steeringSensitivity{1.0f};
        float brakeSensitivity{1.0f};
        bool invertSteering{false};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_CONTROLLER_SETTINGS_COMPONENT_HPP
