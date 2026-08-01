#ifndef PLATFORM_ENGINE_ASSETS_ASSET_ID_HPP
#define PLATFORM_ENGINE_ASSETS_ASSET_ID_HPP

#include <cstdint>
#include <string>

namespace platform
{
    using AssetID = uint64_t;
    constexpr AssetID kInvalidAssetID = 0;

    inline AssetID HashAssetUUID(const std::string &uuid)
    {
        uint64_t hash = 14695981039346656037ULL; // FNV-1a 64-bit
        for (char c : uuid)
        {
            hash ^= static_cast<uint64_t>(c);
            hash *= 1099511628211ULL;
        }
        return hash == kInvalidAssetID ? 1 : hash;
    }
}

#endif // PLATFORM_ENGINE_ASSETS_ASSET_ID_HPP
