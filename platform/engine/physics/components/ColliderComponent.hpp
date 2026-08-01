#ifndef PLATFORM_ENGINE_PHYSICS_COMPONENTS_COLLIDER_COMPONENT_HPP
#define PLATFORM_ENGINE_PHYSICS_COMPONENTS_COLLIDER_COMPONENT_HPP

#include "engine/physics/PhysicsMaterial.hpp"
#include "engine/physics/PhysicsLayer.hpp"
#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    enum class ColliderShape : uint8_t
    {
        Rectangle = 0,
        Circle
    };

    struct ColliderComponent
    {
        ColliderShape Shape{ColliderShape::Rectangle};
        glm::vec2 Size{64.0f, 64.0f}; // Width, Height for Rectangle
        float Radius{32.0f};          // Radius for Circle
        glm::vec2 Offset{0.0f, 0.0f};
        PhysicsMaterial Material{};
        bool IsSensor{false};
        uint16_t CategoryBits{static_cast<uint16_t>(PhysicsLayer::Default)};
        uint16_t MaskBits{static_cast<uint16_t>(PhysicsLayer::All)};
    };
}

#endif // PLATFORM_ENGINE_PHYSICS_COMPONENTS_COLLIDER_COMPONENT_HPP
