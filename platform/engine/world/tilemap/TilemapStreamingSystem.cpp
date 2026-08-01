#include "engine/world/tilemap/TilemapStreamingSystem.hpp"
#include "engine/world/tilemap/TilemapRuntimeComponent.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void TilemapStreamingSystem::UpdateStreaming(Registry &registry, EntityID tilemapEntity, const glm::vec2 &focalPoint)
    {
        uint32_t currentCenterChunk = static_cast<uint32_t>(std::max(0.0f, focalPoint.x / 100.0f));
        m_loadedChunks = {currentCenterChunk, currentCenterChunk + 1, currentCenterChunk + 2, currentCenterChunk + 3};
        m_activeChunkCount = static_cast<uint32_t>(m_loadedChunks.size());

        auto *runtime = registry.GetComponent<TilemapRuntimeComponent>(tilemapEntity);
        if (runtime)
        {
            runtime->visibleChunks = m_activeChunkCount;
        }

        LOG_INFO("[TilemapStreamingSystem] Updated stream focus at ({:.1f}, {:.1f}). Active chunks: {}.",
                 focalPoint.x, focalPoint.y, m_activeChunkCount);
    }

    bool TilemapStreamingSystem::isChunkLoaded(uint32_t chunkID) const
    {
        return std::find(m_loadedChunks.begin(), m_loadedChunks.end(), chunkID) != m_loadedChunks.end();
    }
}
