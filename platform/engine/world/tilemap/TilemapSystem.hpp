#ifndef PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_SYSTEM_HPP
#define PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_SYSTEM_HPP

#include "engine/world/tilemap/TilemapSettingsComponent.hpp"
#include "engine/world/tilemap/TilemapRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include "engine/diagnostics/IRuntimeProfiler.hpp"
#include <glm/glm.hpp>
#include <string>

namespace platform
{
    class TilemapSystem : public IRuntimeProfiler
    {
    public:
        TilemapSystem() = default;

        bool loadTilemap(Registry &registry, EntityID tilemapEntity, const std::string &path);
        void unloadTilemap(Registry &registry, EntityID tilemapEntity);
        void reloadTilemap(Registry &registry, EntityID tilemapEntity);

        [[nodiscard]] TileData getTile(Registry &registry, EntityID tilemapEntity, uint32_t x, uint32_t y) const;
        void setTile(Registry &registry, EntityID tilemapEntity, uint32_t x, uint32_t y, const TileData &tile);

        [[nodiscard]] glm::ivec2 worldToTile(Registry &registry, EntityID tilemapEntity, const glm::vec2 &worldPos) const;
        [[nodiscard]] glm::vec2 tileToWorld(Registry &registry, EntityID tilemapEntity, const glm::ivec2 &tilePos) const;

        [[nodiscard]] size_t tileCount(Registry &registry, EntityID tilemapEntity) const;
        [[nodiscard]] uint32_t layerCount(Registry &registry, EntityID tilemapEntity) const;
        [[nodiscard]] uint32_t loadedChunks(Registry &registry, EntityID tilemapEntity) const;
        [[nodiscard]] uint32_t visibleTiles(Registry &registry, EntityID tilemapEntity) const;

        [[nodiscard]] SubsystemProfilerMetrics GetProfilerMetrics() const override;
    };
}

#endif // PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_SYSTEM_HPP
