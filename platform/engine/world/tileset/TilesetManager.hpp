#ifndef PLATFORM_ENGINE_WORLD_TILESET_TILESET_MANAGER_HPP
#define PLATFORM_ENGINE_WORLD_TILESET_TILESET_MANAGER_HPP

#include <string>
#include <unordered_map>
#include <glm/glm.hpp>
#include <cstdint>

namespace platform
{
    struct TileDefinition
    {
        uint32_t tileID{0};
        glm::vec4 uvBounds{0.0f, 0.0f, 1.0f, 1.0f};
        bool hasCollision{true};
        std::string property{"Solid"};
    };

    class TilesetManager
    {
    public:
        TilesetManager() = default;

        bool loadTileset(uint32_t tilesetID, const std::string &textureAtlasPath);
        bool reloadTileset(uint32_t tilesetID);

        [[nodiscard]] TileDefinition getTileDefinition(uint32_t tilesetID, uint32_t tileID) const;
        [[nodiscard]] bool findTile(uint32_t tilesetID, uint32_t tileID) const;

    private:
        std::unordered_map<uint32_t, std::unordered_map<uint32_t, TileDefinition>> m_tilesets;
    };
}

#endif // PLATFORM_ENGINE_WORLD_TILESET_TILESET_MANAGER_HPP
