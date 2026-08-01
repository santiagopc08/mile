#ifndef PLATFORM_ENGINE_ASSETS_ASSET_METADATA_HPP
#define PLATFORM_ENGINE_ASSETS_ASSET_METADATA_HPP

#include "engine/assets/AssetID.hpp"
#include "engine/assets/AssetTypes.hpp"
#include <string>
#include <vector>

namespace platform
{
    struct AssetMetadata
    {
        AssetID ID{kInvalidAssetID};
        std::string UUID{"00000000-0000-0000-0000-000000000000"};
        std::string Name{"Asset"};
        AssetType Type{AssetType::Unknown};
        std::string SourcePath;
        std::string ImportedPath;
        std::string Version{"1.0.0"};
        std::string Hash;
        uint64_t ImportTimestamp{0};
        std::vector<AssetID> Dependencies;
    };
}

#endif // PLATFORM_ENGINE_ASSETS_ASSET_METADATA_HPP
