#include "engine/assets/importers/TextureImporter.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool TextureImporter::Import(const std::string &sourcePath, const std::string &outputPath, AssetMetadata &outMetadata)
    {
        outMetadata.Name = sourcePath;
        outMetadata.Type = AssetType::Texture;
        outMetadata.SourcePath = sourcePath;
        outMetadata.ImportedPath = outputPath;
        outMetadata.UUID = "uuid-tex-" + sourcePath;
        outMetadata.ID = HashAssetUUID(outMetadata.UUID);
        outMetadata.Hash = "tex-sha256-hash";

        LOG_INFO("[TextureImporter] Imported texture '{}' -> '{}'.", sourcePath, outputPath);
        return true;
    }
}
