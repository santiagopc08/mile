#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_RUNTIME_COMPONENT_HPP

#include <cstdint>
#include <glm/glm.hpp>

namespace platform
{
    enum class ChunkState
    {
        Allocated,
        Generated,
        PhysicsBuilt,
        RenderBuilt,
        Active,
        Inactive,
        Destroyed
    };

    struct AABB
    {
        glm::vec2 minPos{0.0f, 0.0f};
        glm::vec2 maxPos{0.0f, 0.0f};

        [[nodiscard]] bool Contains(const glm::vec2 &pt) const
        {
            return pt.x >= minPos.x && pt.x <= maxPos.x && pt.y >= minPos.y && pt.y <= maxPos.y;
        }
    };

    struct TerrainChunkRuntimeComponent
    {
        uint32_t chunkIndex{0};
        uint64_t chunkID{0};
        uint64_t generationSeed{0};
        glm::vec2 worldPosition{0.0f, 0.0f};
        bool generated{false};
        bool active{false};
        ChunkState state{ChunkState::Allocated};
        AABB bounds{};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_RUNTIME_COMPONENT_HPP
