#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_MOTOR_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_MOTOR_SETTINGS_COMPONENT_HPP

namespace platform
{
    struct MotorSettingsComponent
    {
        float maxTorque{600.0f};
        float maxSpeed{1500.0f};
        float accelerationRate{800.0f};
        float decelerationRate{1200.0f};
        bool frontWheelDrive{true};
        bool rearWheelDrive{true};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_MOTOR_SETTINGS_COMPONENT_HPP
