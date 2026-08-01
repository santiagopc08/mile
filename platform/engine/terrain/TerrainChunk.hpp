#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_HPP

#include "engine/terrain/TerrainConfig.hpp"
#include "engine/terrain/TerrainQuery.hpp"
#include <vector>
#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    class PhysicsWorld;

    enum class ChunkState : uint8_t
    {
        Created = 0,
        Generated,
        PhysicsBuilt,
        Active,
        Unloaded
    };

    class TerrainChunk
    {
    public:
        TerrainChunk(int32_t chunkIndex, float startX, float chunkWidth);
        ~TerrainChunk();

        void Generate(const class TerrainGenerator &generator, const TerrainConfig &config);
        void BuildPhysics(PhysicsWorld &physicsWorld);
        void DestroyPhysics(PhysicsWorld &physicsWorld);

        [[nodiscard]] int32_t GetChunkIndex() const { return m_chunkIndex; }
        [[nodiscard]] float GetStartX() const { return m_startX; }
        [[nodiscard]] float GetEndX() const { return m_endX; }
        [[nodiscard]] ChunkState GetState() const { return m_state; }

        [[nodiscard]] const std::vector<glm::vec2> &GetSurfacePoints() const { return m_surfacePoints; }
        [[nodiscard]] void *GetPhysicsBodyHandle() const { return m_physicsBodyHandle; }

    private:
        int32_t m_chunkIndex{0};
        float m_startX{0.0f};
        float m_endX{0.0f};
        ChunkState m_state{ChunkState::Created};

        std::vector<glm::vec2> m_surfacePoints;
        void *m_physicsBodyHandle{nullptr};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_CHUNK_HPP
