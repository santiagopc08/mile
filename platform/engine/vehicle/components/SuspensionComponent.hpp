#ifndef PLATFORM_ENGINE_VEHICLE_COMPONENTS_SUSPENSION_COMPONENT_HPP
#define PLATFORM_ENGINE_VEHICLE_COMPONENTS_SUSPENSION_COMPONENT_HPP

#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>

namespace platform
{
    struct SuspensionConfig
    {
        float RestLength{30.0f};
        float MinimumLength{10.0f};
        float MaximumLength{45.0f};
        float SpringStiffness{150.0f}; // N/m or force per compression unit
        float DamperCoefficient{15.0f};
        float Travel{20.0f};
        float Preload{5.0f};
    };

    struct SuspensionState
    {
        float Compression{0.0f};
        float Velocity{0.0f};
        float Force{0.0f};
        bool Grounded{false};
    };

    struct SuspensionComponent
    {
        EntityID body{kNullEntity};
        EntityID wheel{kNullEntity};
        float restLength{30.0f};
        float stiffness{150.0f};
        float damping{15.0f};
        glm::vec2 axis{0.0f, 1.0f};
        bool enabled{true};
        void *jointHandle{nullptr};

        SuspensionConfig Config{};
        SuspensionState State{};

        [[nodiscard]] float currentCompression() const { return State.Compression; }
        [[nodiscard]] float currentExtension() const { return Config.RestLength - State.Compression; }
        [[nodiscard]] bool isGrounded() const { return State.Grounded; }
    };
}

#endif // PLATFORM_ENGINE_VEHICLE_COMPONENTS_SUSPENSION_COMPONENT_HPP
