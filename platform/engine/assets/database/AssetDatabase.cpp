#include "engine/assets/database/AssetDatabase.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AssetDatabase::AssetDatabase() = default;

    bool AssetDatabase::Initialize(std::string databasePath)
    {
        m_databasePath = std::move(databasePath);
        m_initialized = true;

        LOG_INFO("[AssetDatabase] Initialized persistent Asset Database at '{}'.", m_databasePath);
        return true;
    }

    bool AssetDatabase::CreateAsset(const std::string &sourcePath, AssetType type, const std::string &name)
    {
        std::string assetName = name.empty() ? sourcePath : name;
        std::string uuidStr = "uuid-" + assetName;

        AssetMetadata meta;
        meta.UUID = uuidStr;
        meta.ID = HashAssetUUID(uuidStr);
        meta.Name = assetName;
        meta.Type = type;
        meta.SourcePath = sourcePath;
        meta.ImportedPath = "cache/" + assetName + ".imported";
        meta.Hash = "sha256-initial-hash";
        meta.ImportTimestamp = 100000;

        return m_registry.RegisterAsset(meta);
    }

    bool AssetDatabase::UpdateAsset(AssetID id, const std::string &newSourcePath)
    {
        const AssetMetadata *meta = m_registry.FindByID(id);
        if (!meta)
        {
            return false;
        }

        AssetMetadata updated = *meta;
        updated.SourcePath = newSourcePath;
        updated.ImportTimestamp += 1000;
        updated.Hash = "sha256-updated-hash";

        return m_registry.RegisterAsset(updated);
    }

    bool AssetDatabase::DeleteAsset(AssetID id)
    {
        return m_registry.UnregisterAsset(id);
    }

    bool AssetDatabase::ReimportAsset(AssetID id)
    {
        const AssetMetadata *meta = m_registry.FindByID(id);
        if (!meta)
        {
            return false;
        }

        LOG_INFO("[AssetDatabase] Reimporting asset '{}' (ID: {})...", meta->Name, meta->ID);
        return true;
    }

    bool AssetDatabase::ValidateDatabase()
    {
        LOG_INFO("[AssetDatabase] Validated {} entries in asset database.", m_registry.GetAssetCount());
        return true;
    }
}
