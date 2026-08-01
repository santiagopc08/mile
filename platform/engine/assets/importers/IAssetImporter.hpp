#ifndef PLATFORM_ENGINE_ASSETS_IMPORTERS_I_ASSET_IMPORTER_HPP
#define PLATFORM_ENGINE_ASSETS_IMPORTERS_I_ASSET_IMPORTER_HPP

#include "engine/assets/AssetMetadata.hpp"
#include <string>

namespace platform
{
    class IAssetImporter
    {
    public:
        virtual ~IAssetImporter() = default;

        virtual bool Import(const std::string &sourcePath, const std::string &outputPath, AssetMetadata &outMetadata) = 0;
        [[nodiscard]] virtual AssetType GetSupportedAssetType() const = 0;
    };
}

#endif // PLATFORM_ENGINE_ASSETS_IMPORTERS_I_ASSET_IMPORTER_HPP
