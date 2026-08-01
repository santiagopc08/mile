#ifndef PLATFORM_ENGINE_ASSETS_ASSET_TYPES_HPP
#define PLATFORM_ENGINE_ASSETS_ASSET_TYPES_HPP

#include <cstdint>

namespace platform
{
    enum class AssetType : uint8_t
    {
        Unknown = 0,
        Texture,
        Audio,
        Font,
        Config,
        Scene,
        Prefab,
        Material
    };

    enum class HandleState : uint8_t
    {
        Invalid = 0,
        Loading,
        Ready,
        Unloaded,
        Missing
    };

    enum class CachePolicy : uint8_t
    {
        Permanent = 0,
        Shared,
        Temporary,
        Streaming
    };
}

#endif // PLATFORM_ENGINE_ASSETS_ASSET_TYPES_HPP
