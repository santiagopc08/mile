#include "engine/terrain/ChunkManager.hpp"
#include "engine/core/Logger.hpp"
#include <cmath>

namespace platform
{
    EntityID ChunkManager::createChunk(Registry &registry, uint32_t chunkIndex, uint64_t seed, float chunkLength)
    {
        EntityID entity = registry.CreateEntity("TerrainChunk_" + std::to_string(chunkIndex));
        auto &settings = registry.AddComponent<TerrainChunkSettingsComponent>(entity);
        auto &runtime = registry.AddComponent<TerrainChunkRuntimeComponent>(entity);

        settings.chunkLength = chunkLength;
        runtime.chunkIndex = chunkIndex;
        runtime.chunkID = static_cast<uint64_t>(chunkIndex) ^ seed;
        runtime.generationSeed = seed;
        runtime.worldPosition = {static_cast<float>(chunkIndex) * chunkLength, 0.0f};

        // Set AABB bounds
        runtime.bounds.minPos = {runtime.worldPosition.x, -500.0f};
        runtime.bounds.maxPos = {runtime.worldPosition.x + chunkLength, 500.0f};

        runtime.state = ChunkState::Active;
        runtime.generated = true;
        runtime.active = true;

        m_chunks[chunkIndex] = entity;
        m_activeCount++;

        LOG_INFO("[ChunkManager] Created terrain chunk #{} (ID: {}, WorldX: {:.1f}m).",
                 chunkIndex, runtime.chunkID, runtime.worldPosition.x);
        return entity;
    }

    void ChunkManager::destroyChunk(Registry &registry, EntityID chunkEntity)
    {
        auto *runtime = registry.GetComponent<TerrainChunkRuntimeComponent>(chunkEntity);
        if (runtime)
        {
            if (runtime->active && m_activeCount > 0)
            {
                m_activeCount--;
            }
            runtime->state = ChunkState::Destroyed;
            runtime->active = false;
            m_chunks.erase(runtime->chunkIndex);
        }
        registry.DestroyEntity(chunkEntity);
    }

    EntityID ChunkManager::findChunk(uint32_t chunkIndex) const
    {
        auto it = m_chunks.find(chunkIndex);
        return (it != m_chunks.end()) ? it->second : kNullEntity;
    }

    void ChunkManager::activateChunk(Registry &registry, EntityID chunkEntity)
    {
        auto *runtime = registry.GetComponent<TerrainChunkRuntimeComponent>(chunkEntity);
        if (runtime && !runtime->active)
        {
            runtime->active = true;
            runtime->state = ChunkState::Active;
            m_activeCount++;
        }
    }

    void ChunkManager::deactivateChunk(Registry &registry, EntityID chunkEntity)
    {
        auto *runtime = registry.GetComponent<TerrainChunkRuntimeComponent>(chunkEntity);
        if (runtime && runtime->active)
        {
            runtime->active = false;
            runtime->state = ChunkState::Inactive;
            if (m_activeCount > 0) m_activeCount--;
        }
    }

    void ChunkManager::rebuildChunk(Registry &registry, EntityID chunkEntity)
    {
        auto *runtime = registry.GetComponent<TerrainChunkRuntimeComponent>(chunkEntity);
        if (runtime)
        {
            runtime->state = ChunkState::Generated;
            runtime->state = ChunkState::Active;
        }
    }

    EntityID ChunkManager::getChunkByPosition(const glm::vec2 &position, float chunkLength) const
    {
        if (chunkLength <= 0.0f) return kNullEntity;
        int idx = static_cast<int>(std::floor(position.x / chunkLength));
        if (idx < 0) return kNullEntity;
        return findChunk(static_cast<uint32_t>(idx));
    }

    EntityID ChunkManager::getNeighbor(uint32_t chunkIndex, int offset) const
    {
        int targetIdx = static_cast<int>(chunkIndex) + offset;
        if (targetIdx < 0) return kNullEntity;
        return findChunk(static_cast<uint32_t>(targetIdx));
    }

    bool ChunkManager::containsPoint(EntityID chunkEntity, const glm::vec2 &point, Registry &registry) const
    {
        auto *runtime = registry.GetComponent<TerrainChunkRuntimeComponent>(chunkEntity);
        if (!runtime) return false;
        return runtime->bounds.Contains(point);
    }

    AABB ChunkManager::chunkBounds(Registry &registry, EntityID chunkEntity) const
    {
        auto *runtime = registry.GetComponent<TerrainChunkRuntimeComponent>(chunkEntity);
        return runtime ? runtime->bounds : AABB{};
    }
}
