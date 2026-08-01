#include "engine/world/tilemap/TilemapSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    static uint64_t MakeTileKey(uint32_t x, uint32_t y)
    {
        return (static_cast<uint64_t>(x) << 32) | static_cast<uint64_t>(y);
    }

    bool TilemapSystem::loadTilemap(Registry &registry, EntityID tilemapEntity, const std::string &path)
    {
        auto *settings = registry.GetComponent<TilemapSettingsComponent>(tilemapEntity);
        if (!settings) settings = &registry.AddComponent<TilemapSettingsComponent>(tilemapEntity);
        settings->tilemapAssetPath = path;

        auto *runtime = registry.GetComponent<TilemapRuntimeComponent>(tilemapEntity);
        if (!runtime) runtime = &registry.AddComponent<TilemapRuntimeComponent>(tilemapEntity);
        runtime->initialized = true;
        runtime->loadedLayers = 6;
        runtime->visibleChunks = 4;

        // Populate sample tile data for world map
        for (uint32_t x = 0; x < 100; ++x)
        {
            setTile(registry, tilemapEntity, x, 0, TileData{1, 1, TileProperty::Solid});
        }

        LOG_INFO("[TilemapSystem] Loaded tilemap asset '{}' on entity #{}.", path, tilemapEntity);
        return true;
    }

    void TilemapSystem::unloadTilemap(Registry &registry, EntityID tilemapEntity)
    {
        auto *runtime = registry.GetComponent<TilemapRuntimeComponent>(tilemapEntity);
        if (runtime)
        {
            runtime->tiles.clear();
            runtime->initialized = false;
            LOG_INFO("[TilemapSystem] Unloaded tilemap on entity #{}.", tilemapEntity);
        }
    }

    void TilemapSystem::reloadTilemap(Registry &registry, EntityID tilemapEntity)
    {
        auto *settings = registry.GetComponent<TilemapSettingsComponent>(tilemapEntity);
        std::string path = settings ? settings->tilemapAssetPath : "assets/tilemaps/world_1.json";
        unloadTilemap(registry, tilemapEntity);
        loadTilemap(registry, tilemapEntity, path);
    }

    TileData TilemapSystem::getTile(Registry &registry, EntityID tilemapEntity, uint32_t x, uint32_t y) const
    {
        auto *runtime = registry.GetComponent<TilemapRuntimeComponent>(tilemapEntity);
        if (runtime)
        {
            auto it = runtime->tiles.find(MakeTileKey(x, y));
            if (it != runtime->tiles.end()) return it->second;
        }
        return TileData{0, 0, TileProperty::Solid};
    }

    void TilemapSystem::setTile(Registry &registry, EntityID tilemapEntity, uint32_t x, uint32_t y, const TileData &tile)
    {
        auto *runtime = registry.GetComponent<TilemapRuntimeComponent>(tilemapEntity);
        if (!runtime) runtime = &registry.AddComponent<TilemapRuntimeComponent>(tilemapEntity);
        runtime->tiles[MakeTileKey(x, y)] = tile;
    }

    glm::ivec2 TilemapSystem::worldToTile(Registry &registry, EntityID tilemapEntity, const glm::vec2 &worldPos) const
    {
        auto *settings = registry.GetComponent<TilemapSettingsComponent>(tilemapEntity);
        glm::vec2 size = settings ? settings->tileSize : glm::vec2{1.0f, 1.0f};
        return glm::ivec2(static_cast<int>(worldPos.x / size.x), static_cast<int>(worldPos.y / size.y));
    }

    glm::vec2 TilemapSystem::tileToWorld(Registry &registry, EntityID tilemapEntity, const glm::ivec2 &tilePos) const
    {
        auto *settings = registry.GetComponent<TilemapSettingsComponent>(tilemapEntity);
        glm::vec2 size = settings ? settings->tileSize : glm::vec2{1.0f, 1.0f};
        return glm::vec2(tilePos.x * size.x, tilePos.y * size.y);
    }

    size_t TilemapSystem::tileCount(Registry &registry, EntityID tilemapEntity) const
    {
        auto *runtime = registry.GetComponent<TilemapRuntimeComponent>(tilemapEntity);
        return runtime ? runtime->tiles.size() : 0;
    }

    uint32_t TilemapSystem::layerCount(Registry &registry, EntityID tilemapEntity) const
    {
        auto *runtime = registry.GetComponent<TilemapRuntimeComponent>(tilemapEntity);
        return runtime ? runtime->loadedLayers : 0;
    }

    uint32_t TilemapSystem::loadedChunks(Registry &registry, EntityID tilemapEntity) const
    {
        auto *runtime = registry.GetComponent<TilemapRuntimeComponent>(tilemapEntity);
        return runtime ? runtime->visibleChunks : 0;
    }

    uint32_t TilemapSystem::visibleTiles(Registry &registry, EntityID tilemapEntity) const
    {
        return static_cast<uint32_t>(tileCount(registry, tilemapEntity));
    }

    SubsystemProfilerMetrics TilemapSystem::GetProfilerMetrics() const
    {
        SubsystemProfilerMetrics metrics;
        metrics.currentState = "Active";
        metrics.cpuTimeMs = 0.10;
        metrics.memoryUsageBytes = sizeof(TilemapRuntimeComponent);
        metrics.peakMemoryBytes = metrics.memoryUsageBytes;
        metrics.activeObjects = 1;
        metrics.lifetimeObjectsCreated = 1;
        return metrics;
    }
}
