#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_SETTINGS_COMPONENT_HPP

#include <cstdint>
#include <string>
#include <glm/glm.hpp>

namespace platform
{
    using MaterialID = uint32_t;

    struct TerrainMaterialSettingsComponent
    {
        MaterialID id{0};
        std::string name{"Grass"};
        float friction{0.6f};
        float restitution{0.1f};
        std::string textureAsset{"assets://textures/grass.png"};
        glm::vec4 tint{0.2f, 0.8f, 0.2f, 1.0f};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_SETTINGS_COMPONENT_HPP
