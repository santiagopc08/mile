#include "engine/assets/importers/AudioImporter.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool AudioImporter::Import(const std::string &sourcePath, const std::string &outputPath, AssetMetadata &outMetadata)
    {
        outMetadata.Name = sourcePath;
        outMetadata.Type = AssetType::Audio;
        outMetadata.SourcePath = sourcePath;
        outMetadata.ImportedPath = outputPath;
        outMetadata.UUID = "uuid-audio-" + sourcePath;
        outMetadata.ID = HashAssetUUID(outMetadata.UUID);
        outMetadata.Hash = "audio-sha256-hash";

        LOG_INFO("[AudioImporter] Imported audio file '{}' -> '{}'.", sourcePath, outputPath);
        return true;
    }
}
