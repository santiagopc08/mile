#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_VALIDATION_SUITE_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_VALIDATION_SUITE_HPP

#include "engine/terrain/TerrainSystem.hpp"
#include "engine/terrain/ChunkManager.hpp"
#include "engine/terrain/StreamingSystem.hpp"
#include "engine/terrain/TerrainMaterialSystem.hpp"
#include "engine/terrain/ObstacleManager.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    struct TerrainValidationReport
    {
        bool passed{true};
        uint32_t chunkCount{0};
        uint32_t obstacleCount{0};
        uint32_t materialCount{0};
        double driveDistanceMeters{0.0};
        double generationTimeMs{0.0};
        double streamingTimeMs{0.0};
        size_t peakMemoryBytes{0};
        double averageFrameTimeMs{0.0};
        double maxFrameTimeMs{0.0};
        int runtimeWarnings{0};

        [[nodiscard]] std::string ToJSON() const;
    };

    class TerrainValidationSuite
    {
    public:
        TerrainValidationSuite() = default;

        TerrainValidationReport RunFullValidation(Registry &registry, uint64_t seed);
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_VALIDATION_SUITE_HPP
