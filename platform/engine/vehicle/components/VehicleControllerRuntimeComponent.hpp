#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_CONTROLLER_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_CONTROLLER_RUNTIME_COMPONENT_HPP

namespace platform
{
    struct VehicleControllerRuntimeComponent
    {
        float throttle{0.0f};  // 0.0 -> 1.0
        float steering{0.0f};  // -1.0 -> +1.0
        float brake{0.0f};     // 0.0 -> 1.0
        bool reverse{false};   // Gear direction
        bool enabled{true};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_VEHICLE_CONTROLLER_RUNTIME_COMPONENT_HPP
