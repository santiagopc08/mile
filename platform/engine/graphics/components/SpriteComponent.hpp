#ifndef PLATFORM_ENGINE_GRAPHICS_COMPONENTS_SPRITE_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_COMPONENTS_SPRITE_COMPONENT_HPP

#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    enum class SpriteFlip : uint8_t
    {
        None = 0,
        Horizontal = 1,
        Vertical = 2,
        Both = 3
    };

    struct SpriteComponent
    {
        uint64_t TextureHandle{0};
        glm::vec4 SourceRectangle{0.0f, 0.0f, 0.0f, 0.0f}; // X, Y, Width, Height
        glm::vec4 TintColor{1.0f, 1.0f, 1.0f, 1.0f};
        SpriteFlip FlipMode{SpriteFlip::None};
        int SortingOrder{0};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_COMPONENTS_SPRITE_COMPONENT_HPP
