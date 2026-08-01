#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_CONFIG_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_CONFIG_HPP

#include <cstdint>

namespace platform
{
    struct TerrainConfig
    {
        float ChunkWidth{500.0f};
        int ChunkResolution{50};         // Samples per chunk
        int MaximumLoadedChunks{10};
        uint32_t GenerationSeed{48192};
        float StreamingDistance{1500.0f}; // Load radius
        int PhysicsResolution{25};
        int RenderResolution{50};

        // Layered noise parameters
        float BaseFrequency{0.003f};
        float Amplitude{120.0f};
        float Persistence{0.5f};
        float Lacunarity{2.0f};
        int Octaves{4};
        float BaseHeight{200.0f};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_CONFIG_HPP
