#ifndef PLATFORM_ENGINE_PIPELINE_PROCESSORS_JSON_PROCESSOR_HPP
#define PLATFORM_ENGINE_PIPELINE_PROCESSORS_JSON_PROCESSOR_HPP

#include "engine/pipeline/processors/IResourceProcessor.hpp"

namespace platform
{
    class JsonProcessor : public IResourceProcessor
    {
    public:
        bool Process(const std::vector<uint8_t> &sourceData, std::vector<uint8_t> &outCompiledData, AssetMetadata &metadata) override;
        [[nodiscard]] AssetType GetSupportedAssetType() const override { return AssetType::Config; }
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_PROCESSORS_JSON_PROCESSOR_HPP
