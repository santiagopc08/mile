#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_QUERY_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_QUERY_HPP

#include <glm/glm.hpp>

namespace platform
{
    struct HeightSample
    {
        float Height{0.0f};
        float Slope{0.0f};
        glm::vec2 Normal{0.0f, -1.0f}; // Upwards normal by default
        bool Valid{false};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_QUERY_HPP
