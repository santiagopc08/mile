#ifndef PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_SETTINGS_COMPONENT_HPP

#include <glm/glm.hpp>
#include <string>

namespace platform
{
    struct TilemapSettingsComponent
    {
        glm::vec2 tileSize{1.0f, 1.0f};
        bool infinite{false};
        bool generateCollision{true};
        std::string tilemapAssetPath{"assets/tilemaps/world_1.json"};
    };
}

#endif // PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_SETTINGS_COMPONENT_HPP
