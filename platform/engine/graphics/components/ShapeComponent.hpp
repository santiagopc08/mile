#ifndef PLATFORM_ENGINE_GRAPHICS_COMPONENTS_SHAPE_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_COMPONENTS_SHAPE_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    enum class ShapeType : uint8_t
    {
        Rectangle = 0,
        Circle,
        Line
    };

    struct ShapeComponent
    {
        ShapeType Type{ShapeType::Rectangle};
        glm::vec2 Size{64.0f, 64.0f}; // Width, Height for Rectangle
        float Radius{32.0f};          // For Circle
        glm::vec2 LineEnd{0.0f, 0.0f};// For Line
        glm::vec4 Color{0.18f, 0.65f, 0.95f, 1.0f}; // Cyan/Blue
        bool Filled{true};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_COMPONENTS_SHAPE_COMPONENT_HPP
