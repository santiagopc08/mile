#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_RUNTIME_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct TerrainRuntimeComponent
    {
        uint64_t currentSeed{0};
        uint32_t generatedSegments{0};
        float lastGeneratedX{0.0f};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_RUNTIME_COMPONENT_HPP
