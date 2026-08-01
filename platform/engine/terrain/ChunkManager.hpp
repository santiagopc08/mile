#ifndef PLATFORM_ENGINE_TERRAIN_CHUNK_MANAGER_HPP
#define PLATFORM_ENGINE_TERRAIN_CHUNK_MANAGER_HPP

#include "engine/terrain/TerrainChunkSettingsComponent.hpp"
#include "engine/terrain/TerrainChunkRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include <unordered_map>
#include <optional>
#include <vector>

namespace platform
{
    class ChunkManager
    {
    public:
        ChunkManager() = default;

        EntityID createChunk(Registry &registry, uint32_t chunkIndex, uint64_t seed, float chunkLength = 200.0f);
        void destroyChunk(Registry &registry, EntityID chunkEntity);

        EntityID findChunk(uint32_t chunkIndex) const;
        void activateChunk(Registry &registry, EntityID chunkEntity);
        void deactivateChunk(Registry &registry, EntityID chunkEntity);
        void rebuildChunk(Registry &registry, EntityID chunkEntity);

        // Spatial Queries
        EntityID getChunk(uint32_t chunkIndex) const { return findChunk(chunkIndex); }
        EntityID getChunkByPosition(const glm::vec2 &position, float chunkLength = 200.0f) const;
        EntityID getNeighbor(uint32_t chunkIndex, int offset) const;
        bool containsPoint(EntityID chunkEntity, const glm::vec2 &point, Registry &registry) const;

        // Runtime Queries
        [[nodiscard]] size_t chunkCount() const { return m_chunks.size(); }
        [[nodiscard]] size_t activeChunks() const { return m_activeCount; }
        [[nodiscard]] size_t chunkMemory() const { return m_chunks.size() * sizeof(TerrainChunkRuntimeComponent); }
        [[nodiscard]] AABB chunkBounds(Registry &registry, EntityID chunkEntity) const;

    private:
        std::unordered_map<uint32_t, EntityID> m_chunks;
        size_t m_activeCount{0};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_CHUNK_MANAGER_HPP
