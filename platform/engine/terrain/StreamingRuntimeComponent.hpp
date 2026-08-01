#ifndef PLATFORM_ENGINE_TERRAIN_STREAMING_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_STREAMING_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct StreamingRuntimeComponent
    {
        uint32_t centerChunk{0};
        uint32_t loadedChunks{0};
        uint32_t pendingLoads{0};
        uint32_t pendingUnloads{0};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_STREAMING_RUNTIME_COMPONENT_HPP
