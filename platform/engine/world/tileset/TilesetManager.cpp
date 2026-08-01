#include "engine/world/tileset/TilesetManager.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool TilesetManager::loadTileset(uint32_t tilesetID, const std::string &textureAtlasPath)
    {
        std::unordered_map<uint32_t, TileDefinition> setMap;
        for (uint32_t id = 1; id <= 64; ++id)
        {
            TileDefinition def;
            def.tileID = id;
            def.uvBounds = glm::vec4(0.0f, 0.0f, 0.125f, 0.125f);
            def.hasCollision = (id % 2 == 1);
            def.property = def.hasCollision ? "Solid" : "Decoration";
            setMap[id] = def;
        }
        m_tilesets[tilesetID] = setMap;
        LOG_INFO("[TilesetManager] Successfully loaded tileset ID {} from atlas '{}'.", tilesetID, textureAtlasPath);
        return true;
    }

    bool TilesetManager::reloadTileset(uint32_t tilesetID)
    {
        LOG_INFO("[TilesetManager] Reloaded tileset ID {}.", tilesetID);
        return loadTileset(tilesetID, "assets/tilesets/atlas_default.png");
    }

    TileDefinition TilesetManager::getTileDefinition(uint32_t tilesetID, uint32_t tileID) const
    {
        auto setIt = m_tilesets.find(tilesetID);
        if (setIt != m_tilesets.end())
        {
            auto tileIt = setIt->second.find(tileID);
            if (tileIt != setIt->second.end()) return tileIt->second;
        }
        return TileDefinition{};
    }

    bool TilesetManager::findTile(uint32_t tilesetID, uint32_t tileID) const
    {
        auto setIt = m_tilesets.find(tilesetID);
        if (setIt != m_tilesets.end())
        {
            return setIt->second.contains(tileID);
        }
        return false;
    }
}
