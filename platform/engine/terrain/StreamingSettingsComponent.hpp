#ifndef PLATFORM_ENGINE_TERRAIN_STREAMING_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_TERRAIN_STREAMING_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct StreamingSettingsComponent
    {
        float loadRadius{600.0f};   // Distance to load chunks
        float unloadRadius{1000.0f}; // Distance to unload chunks
        uint32_t preloadChunks{2};
        bool asynchronous{false};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_STREAMING_SETTINGS_COMPONENT_HPP
