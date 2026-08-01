#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_MOTOR_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_MOTOR_RUNTIME_COMPONENT_HPP

namespace platform
{
    struct MotorRuntimeComponent
    {
        float currentTorque{0.0f};
        float targetSpeed{0.0f};
        float appliedSpeed{0.0f};
        bool enabled{true};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_MOTOR_RUNTIME_COMPONENT_HPP
