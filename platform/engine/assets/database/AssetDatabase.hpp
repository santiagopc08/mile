#ifndef PLATFORM_ENGINE_ASSETS_DATABASE_ASSET_DATABASE_HPP
#define PLATFORM_ENGINE_ASSETS_DATABASE_ASSET_DATABASE_HPP

#include "engine/assets/registry/AssetRegistry.hpp"
#include <string>

namespace platform
{
    class AssetDatabase
    {
    public:
        AssetDatabase();

        bool Initialize(std::string databasePath = "asset_database.manifest");

        bool CreateAsset(const std::string &sourcePath, AssetType type, const std::string &name = "");
        bool UpdateAsset(AssetID id, const std::string &newSourcePath);
        bool DeleteAsset(AssetID id);
        bool ReimportAsset(AssetID id);

        bool ValidateDatabase();

        [[nodiscard]] AssetRegistry &GetRegistry() { return m_registry; }
        [[nodiscard]] const AssetRegistry &GetRegistry() const { return m_registry; }

        [[nodiscard]] bool IsInitialized() const { return m_initialized; }
        [[nodiscard]] const std::string &GetDatabasePath() const { return m_databasePath; }

    private:
        AssetRegistry m_registry;
        std::string m_databasePath{"asset_database.manifest"};
        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_ASSETS_DATABASE_ASSET_DATABASE_HPP
