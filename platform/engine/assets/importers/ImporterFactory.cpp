#include "engine/assets/importers/ImporterFactory.hpp"
#include "engine/assets/importers/TextureImporter.hpp"
#include "engine/assets/importers/AudioImporter.hpp"
#include "engine/assets/importers/FontImporter.hpp"
#include "engine/assets/importers/ConfigImporter.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    ImporterFactory::ImporterFactory()
    {
        RegisterImporter(".png", std::make_unique<TextureImporter>());
        RegisterImporter(".jpg", std::make_unique<TextureImporter>());
        RegisterImporter(".wav", std::make_unique<AudioImporter>());
        RegisterImporter(".ogg", std::make_unique<AudioImporter>());
        RegisterImporter(".ttf", std::make_unique<FontImporter>());
        RegisterImporter(".json", std::make_unique<ConfigImporter>());
    }

    void ImporterFactory::RegisterImporter(const std::string &extension, std::unique_ptr<IAssetImporter> importer)
    {
        m_importers[extension] = std::move(importer);
        LOG_INFO("[ImporterFactory] Registered importer for extension '{}'.", extension);
    }

    IAssetImporter *ImporterFactory::GetImporterForExtension(const std::string &extension) const
    {
        auto it = m_importers.find(extension);
        if (it != m_importers.end())
        {
            return it->second.get();
        }
        return nullptr;
    }

    bool ImporterFactory::HasImporter(const std::string &extension) const
    {
        return m_importers.find(extension) != m_importers.end();
    }
}
