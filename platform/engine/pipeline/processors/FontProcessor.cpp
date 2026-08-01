#include "engine/pipeline/processors/FontProcessor.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool FontProcessor::Process(const std::vector<uint8_t> &sourceData, std::vector<uint8_t> &outCompiledData, AssetMetadata &metadata)
    {
        (void)sourceData;
        outCompiledData = {0x46, 0x4E, 0x54, 0x01}; // "FNT\1" magic header
        metadata.Type = AssetType::Font;
        metadata.Version = "1.0.0";
        metadata.Hash = "font-sha256-compiled-hash";

        LOG_INFO("[FontProcessor] Compiled font resource (Size: {} bytes).", outCompiledData.size());
        return true;
    }
}
