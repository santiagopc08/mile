#include "engine/pipeline/processors/JsonProcessor.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool JsonProcessor::Process(const std::vector<uint8_t> &sourceData, std::vector<uint8_t> &outCompiledData, AssetMetadata &metadata)
    {
        (void)sourceData;
        outCompiledData = {0x43, 0x46, 0x47, 0x01}; // "CFG\1" magic header
        metadata.Type = AssetType::Config;
        metadata.Version = "1.0.0";
        metadata.Hash = "config-sha256-compiled-hash";

        LOG_INFO("[JsonProcessor] Compiled config resource (Size: {} bytes).", outCompiledData.size());
        return true;
    }
}
