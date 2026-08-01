#ifndef PLATFORM_ENGINE_GRAPHICS_RENDER_CONTEXT_HPP
#define PLATFORM_ENGINE_GRAPHICS_RENDER_CONTEXT_HPP

#include <glm/glm.hpp>

namespace platform
{
    struct RenderContext
    {
        // Runtime default clear color RGB(25, 25, 25) -> 25/255 = 0.098039f
        glm::vec4 ClearColor{0.098039f, 0.098039f, 0.098039f, 1.0f};
        int ViewportWidth{1280};
        int ViewportHeight{720};
        bool VSync{true};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_RENDER_CONTEXT_HPP
