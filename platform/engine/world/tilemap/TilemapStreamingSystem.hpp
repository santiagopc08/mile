#ifndef PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_STREAMING_SYSTEM_HPP
#define PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_STREAMING_SYSTEM_HPP

#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include <glm/glm.hpp>
#include <vector>

namespace platform
{
    class TilemapStreamingSystem
    {
    public:
        TilemapStreamingSystem() = default;

        void UpdateStreaming(Registry &registry, EntityID tilemapEntity, const glm::vec2 &focalPoint);

        [[nodiscard]] uint32_t activeChunksCount() const { return m_activeChunkCount; }
        [[nodiscard]] bool isChunkLoaded(uint32_t chunkID) const;

    private:
        uint32_t m_activeChunkCount{4};
        std::vector<uint32_t> m_loadedChunks{0, 1, 2, 3};
    };
}

#endif // PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_STREAMING_SYSTEM_HPP
