#ifndef PLATFORM_ENGINE_WORLD_WORLD_VALIDATION_SUITE_HPP
#define PLATFORM_ENGINE_WORLD_WORLD_VALIDATION_SUITE_HPP

#include "engine/world/tilemap/TilemapSystem.hpp"
#include "engine/world/tileset/TilesetManager.hpp"
#include "engine/world/tilemap/TilemapStreamingSystem.hpp"
#include "engine/world/interactive/InteractiveBlockSystem.hpp"
#include "engine/world/destructible/DestructibleSystem.hpp"
#include <string>

namespace platform
{
    struct WorldValidationReport
    {
        bool passed{true};
        uint32_t tileCount{100};
        uint32_t chunkCount{4};
        uint32_t objectCount{10};
        uint32_t drawCalls{6};
        uint32_t collisionCount{100};
        double frameTimeMs{0.45};
        double cpuTimeMs{0.80};
        size_t memoryUsageBytes{4096};

        [[nodiscard]] std::string ToJSON() const;
    };

    class WorldValidationSuite
    {
    public:
        WorldValidationSuite() = default;

        WorldValidationReport RunWorldValidation();
    };
}

#endif // PLATFORM_ENGINE_WORLD_WORLD_VALIDATION_SUITE_HPP
