#include "engine/pipeline/processors/ProcessorRegistry.hpp"
#include "engine/pipeline/processors/TextureProcessor.hpp"
#include "engine/pipeline/processors/AudioProcessor.hpp"
#include "engine/pipeline/processors/FontProcessor.hpp"
#include "engine/pipeline/processors/JsonProcessor.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    ProcessorRegistry::ProcessorRegistry()
    {
        RegisterProcessor(AssetType::Texture, std::make_unique<TextureProcessor>());
        RegisterProcessor(AssetType::Audio, std::make_unique<AudioProcessor>());
        RegisterProcessor(AssetType::Font, std::make_unique<FontProcessor>());
        RegisterProcessor(AssetType::Config, std::make_unique<JsonProcessor>());
    }

    void ProcessorRegistry::RegisterProcessor(AssetType type, std::unique_ptr<IResourceProcessor> processor)
    {
        m_processors[type] = std::move(processor);
        LOG_INFO("[ProcessorRegistry] Registered resource processor for AssetType {}.", static_cast<int>(type));
    }

    IResourceProcessor *ProcessorRegistry::GetProcessor(AssetType type) const
    {
        auto it = m_processors.find(type);
        if (it != m_processors.end())
        {
            return it->second.get();
        }
        return nullptr;
    }

    bool ProcessorRegistry::HasProcessor(AssetType type) const
    {
        return m_processors.find(type) != m_processors.end();
    }
}
