#ifndef PLATFORM_ENGINE_ASSETS_HANDLES_ASSET_REFERENCE_HPP
#define PLATFORM_ENGINE_ASSETS_HANDLES_ASSET_REFERENCE_HPP

#include "engine/assets/AssetID.hpp"
#include <string>

namespace platform
{
    template <typename T>
    struct AssetReference
    {
        AssetID ID{kInvalidAssetID};
        std::string Name;

        [[nodiscard]] bool IsValid() const { return ID != kInvalidAssetID; }
    };
}

#endif // PLATFORM_ENGINE_ASSETS_HANDLES_ASSET_REFERENCE_HPP
