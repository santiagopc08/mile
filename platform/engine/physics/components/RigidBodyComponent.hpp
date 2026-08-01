#ifndef PLATFORM_ENGINE_PHYSICS_COMPONENTS_RIGID_BODY_COMPONENT_HPP
#define PLATFORM_ENGINE_PHYSICS_COMPONENTS_RIGID_BODY_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    enum class BodyType : uint8_t
    {
        Static = 0,
        Dynamic,
        Kinematic
    };

    struct RigidBodyComponent
    {
        BodyType Type{BodyType::Dynamic};
        float Mass{1.0f};
        float GravityScale{1.0f};
        glm::vec2 LinearVelocity{0.0f, 0.0f};
        float AngularVelocity{0.0f};
        bool FixedRotation{false};
        bool SleepingAllowed{true};

        /// Opaque internal pointer to Box2D b2Body
        void *RuntimeBodyHandle{nullptr};
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_COMPONENTS_RIGID_BODY_COMPONENT_HPP
