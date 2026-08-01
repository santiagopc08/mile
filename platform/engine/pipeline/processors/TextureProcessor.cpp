#include "engine/pipeline/processors/TextureProcessor.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool TextureProcessor::Process(const std::vector<uint8_t> &sourceData, std::vector<uint8_t> &outCompiledData, AssetMetadata &metadata)
    {
        (void)sourceData;
        outCompiledData = {0x54, 0x45, 0x58, 0x01}; // "TEX\1" magic header
        metadata.Type = AssetType::Texture;
        metadata.Version = "1.0.0";
        metadata.Hash = "tex-sha256-compiled-hash";

        LOG_INFO("[TextureProcessor] Compiled texture resource (Size: {} bytes).", outCompiledData.size());
        return true;
    }
}
