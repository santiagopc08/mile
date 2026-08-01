#include "engine/assets/importers/ConfigImporter.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool ConfigImporter::Import(const std::string &sourcePath, const std::string &outputPath, AssetMetadata &outMetadata)
    {
        outMetadata.Name = sourcePath;
        outMetadata.Type = AssetType::Config;
        outMetadata.SourcePath = sourcePath;
        outMetadata.ImportedPath = outputPath;
        outMetadata.UUID = "uuid-config-" + sourcePath;
        outMetadata.ID = HashAssetUUID(outMetadata.UUID);
        outMetadata.Hash = "config-sha256-hash";

        LOG_INFO("[ConfigImporter] Imported config file '{}' -> '{}'.", sourcePath, outputPath);
        return true;
    }
}
