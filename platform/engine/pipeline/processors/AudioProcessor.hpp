#ifndef PLATFORM_ENGINE_PIPELINE_PROCESSORS_AUDIO_PROCESSOR_HPP
#define PLATFORM_ENGINE_PIPELINE_PROCESSORS_AUDIO_PROCESSOR_HPP

#include "engine/pipeline/processors/IResourceProcessor.hpp"

namespace platform
{
    class AudioProcessor : public IResourceProcessor
    {
    public:
        bool Process(const std::vector<uint8_t> &sourceData, std::vector<uint8_t> &outCompiledData, AssetMetadata &metadata) override;
        [[nodiscard]] AssetType GetSupportedAssetType() const override { return AssetType::Audio; }
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_PROCESSORS_AUDIO_PROCESSOR_HPP
