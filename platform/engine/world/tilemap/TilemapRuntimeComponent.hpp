#ifndef PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_RUNTIME_COMPONENT_HPP

#include <cstdint>
#include <vector>
#include <unordered_map>
#include <glm/glm.hpp>

namespace platform
{
    enum class TileProperty
    {
        Solid,
        OneWay,
        Ladder,
        Hazard,
        Water,
        Custom
    };

    struct TileData
    {
        uint32_t tileID{0};
        uint32_t tilesetID{0};
        TileProperty property{TileProperty::Solid};
    };

    struct TilemapRuntimeComponent
    {
        uint32_t loadedLayers{6}; // Background, Gameplay, Collision, Decoration, Objects, Foreground
        uint32_t visibleChunks{4};
        bool initialized{true};
        uint32_t mapWidth{100};
        uint32_t mapHeight{20};
        std::unordered_map<uint64_t, TileData> tiles;
    };
}

#endif // PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_RUNTIME_COMPONENT_HPP
