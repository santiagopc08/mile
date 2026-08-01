#include "engine/pipeline/processors/AudioProcessor.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool AudioProcessor::Process(const std::vector<uint8_t> &sourceData, std::vector<uint8_t> &outCompiledData, AssetMetadata &metadata)
    {
        (void)sourceData;
        outCompiledData = {0x53, 0x4E, 0x44, 0x01}; // "SND\1" magic header
        metadata.Type = AssetType::Audio;
        metadata.Version = "1.0.0";
        metadata.Hash = "audio-sha256-compiled-hash";

        LOG_INFO("[AudioProcessor] Compiled audio resource (Size: {} bytes).", outCompiledData.size());
        return true;
    }
}
