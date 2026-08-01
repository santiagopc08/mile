#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_COMPONENT_HPP

#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    enum class WheelRole : uint8_t
    {
        Drive = 1 << 0,
        Steering = 1 << 1,
        FreeRolling = 1 << 2,
        DriveAndSteer = Drive | Steering
    };

    struct WheelConfig
    {
        float Radius{18.0f};           // Pixels / Units
        float Width{10.0f};
        float Mass{15.0f};
        float Grip{1.0f};
        float RollingResistance{0.02f};
        float BrakeStrength{800.0f};
        bool MotorEnabled{true};
        bool SteeringEnabled{false};
        WheelRole Role{WheelRole::Drive};
        glm::vec2 LocalOffset{0.0f, 0.0f};
    };

    struct WheelState
    {
        float AngularVelocity{0.0f};
        float LinearVelocity{0.0f};
        float SlipRatio{0.0f};
        bool GroundContact{false};
        float Compression{0.0f};
        float CurrentSteerAngle{0.0f};
    };

    struct WheelComponent
    {
        float radius{18.0f};
        bool powered{true};

        WheelConfig Config{};
        WheelState State{};
        EntityID WheelEntity{kNullEntity};
        void *PhysicsJointHandle{nullptr};
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_WHEEL_COMPONENT_HPP
