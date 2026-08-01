#ifndef PLATFORM_ENGINE_ASSETS_IMPORTERS_FONT_IMPORTER_HPP
#define PLATFORM_ENGINE_ASSETS_IMPORTERS_FONT_IMPORTER_HPP

#include "engine/assets/importers/IAssetImporter.hpp"

namespace platform
{
    class FontImporter : public IAssetImporter
    {
    public:
        bool Import(const std::string &sourcePath, const std::string &outputPath, AssetMetadata &outMetadata) override;
        [[nodiscard]] AssetType GetSupportedAssetType() const override { return AssetType::Font; }
    };
}

#endif // PLATFORM_ENGINE_ASSETS_IMPORTERS_FONT_IMPORTER_HPP
