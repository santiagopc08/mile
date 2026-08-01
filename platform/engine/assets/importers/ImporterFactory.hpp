#ifndef PLATFORM_ENGINE_ASSETS_IMPORTERS_IMPORTER_FACTORY_HPP
#define PLATFORM_ENGINE_ASSETS_IMPORTERS_IMPORTER_FACTORY_HPP

#include "engine/assets/importers/IAssetImporter.hpp"
#include <unordered_map>
#include <memory>
#include <string>

namespace platform
{
    class ImporterFactory
    {
    public:
        ImporterFactory();

        void RegisterImporter(const std::string &extension, std::unique_ptr<IAssetImporter> importer);
        [[nodiscard]] IAssetImporter *GetImporterForExtension(const std::string &extension) const;

        [[nodiscard]] bool HasImporter(const std::string &extension) const;

    private:
        std::unordered_map<std::string, std::unique_ptr<IAssetImporter>> m_importers;
    };
}

#endif // PLATFORM_ENGINE_ASSETS_IMPORTERS_IMPORTER_FACTORY_HPP
