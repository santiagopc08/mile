#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct TerrainSettingsComponent
    {
        uint64_t seed{1337};
        float sampleDistance{2.0f};
        float amplitude{40.0f};
        float frequency{0.02f};
        float segmentLength{200.0f};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_SETTINGS_COMPONENT_HPP
