#include "engine/assets/importers/FontImporter.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool FontImporter::Import(const std::string &sourcePath, const std::string &outputPath, AssetMetadata &outMetadata)
    {
        outMetadata.Name = sourcePath;
        outMetadata.Type = AssetType::Font;
        outMetadata.SourcePath = sourcePath;
        outMetadata.ImportedPath = outputPath;
        outMetadata.UUID = "uuid-font-" + sourcePath;
        outMetadata.ID = HashAssetUUID(outMetadata.UUID);
        outMetadata.Hash = "font-sha256-hash";

        LOG_INFO("[FontImporter] Imported font file '{}' -> '{}'.", sourcePath, outputPath);
        return true;
    }
}
