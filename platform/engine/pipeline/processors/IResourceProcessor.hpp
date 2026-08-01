#ifndef PLATFORM_ENGINE_PIPELINE_PROCESSORS_I_RESOURCE_PROCESSOR_HPP
#define PLATFORM_ENGINE_PIPELINE_PROCESSORS_I_RESOURCE_PROCESSOR_HPP

#include "engine/assets/AssetMetadata.hpp"
#include <vector>
#include <cstdint>

namespace platform
{
    class IResourceProcessor
    {
    public:
        virtual ~IResourceProcessor() = default;

        virtual bool Process(const std::vector<uint8_t> &sourceData, std::vector<uint8_t> &outCompiledData, AssetMetadata &metadata) = 0;
        [[nodiscard]] virtual AssetType GetSupportedAssetType() const = 0;
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_PROCESSORS_I_RESOURCE_PROCESSOR_HPP
