#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct TerrainChunkSettingsComponent
    {
        float chunkLength{200.0f};
        uint32_t samplesPerChunk{100};
        bool generateCollider{true};
        bool generateRenderMesh{true};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_SETTINGS_COMPONENT_HPP
