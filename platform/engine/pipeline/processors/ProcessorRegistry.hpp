#ifndef PLATFORM_ENGINE_PIPELINE_PROCESSORS_PROCESSOR_REGISTRY_HPP
#define PLATFORM_ENGINE_PIPELINE_PROCESSORS_PROCESSOR_REGISTRY_HPP

#include "engine/pipeline/processors/IResourceProcessor.hpp"
#include <unordered_map>
#include <memory>

namespace platform
{
    class ProcessorRegistry
    {
    public:
        ProcessorRegistry();

        void RegisterProcessor(AssetType type, std::unique_ptr<IResourceProcessor> processor);
        [[nodiscard]] IResourceProcessor *GetProcessor(AssetType type) const;

        [[nodiscard]] bool HasProcessor(AssetType type) const;

    private:
        std::unordered_map<AssetType, std::unique_ptr<IResourceProcessor>> m_processors;
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_PROCESSORS_PROCESSOR_REGISTRY_HPP
