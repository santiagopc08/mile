#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_RUNTIME_COMPONENT_HPP

#include "engine/terrain/TerrainMaterialSettingsComponent.hpp"

namespace platform
{
    struct TerrainMaterialRuntimeComponent
    {
        MaterialID activeMaterial{0};
        uint32_t sampleCount{0};
        bool dirty{false};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_RUNTIME_COMPONENT_HPP
