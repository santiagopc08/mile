#ifndef PLATFORM_ENGINE_VEHICLE_VEHICLE_CONFIG_HPP
#define PLATFORM_ENGINE_VEHICLE_VEHICLE_CONFIG_HPP

#include <glm/glm.hpp>
#include <string>

namespace platform
{
    struct VehicleConfig
    {
        std::string Name{"Standard Vehicle"};
        float Mass{1200.0f};             // kg
        glm::vec2 CenterOfMass{0.0f, 0.0f};
        float WheelBase{120.0f};          // Distance between front & rear axles
        float TrackWidth{60.0f};          // Axle width
        float MaxSteeringAngle{30.0f};    // Degrees
        float MaxMotorTorque{500.0f};     // Nm
        float BrakeForce{1000.0f};        // N
        float MaximumSpeed{150.0f};       // km/h
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_VEHICLE_CONFIG_HPP
