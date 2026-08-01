#include "engine/assets/registry/AssetRegistry.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AssetRegistry::AssetRegistry() = default;

    bool AssetRegistry::RegisterAsset(AssetMetadata metadata)
    {
        if (metadata.ID == kInvalidAssetID)
        {
            metadata.ID = HashAssetUUID(metadata.UUID);
        }

        m_idByName[metadata.Name] = metadata.ID;
        m_metadataByID[metadata.ID] = metadata;

        LOG_INFO("[AssetRegistry] Registered asset '{}' (ID: {}, Type: {}).",
                 metadata.Name, metadata.ID, static_cast<int>(metadata.Type));
        return true;
    }

    bool AssetRegistry::UnregisterAsset(AssetID id)
    {
        auto it = m_metadataByID.find(id);
        if (it != m_metadataByID.end())
        {
            m_idByName.erase(it->second.Name);
            m_metadataByID.erase(it);
            return true;
        }
        return false;
    }

    const AssetMetadata *AssetRegistry::FindByID(AssetID id) const
    {
        auto it = m_metadataByID.find(id);
        if (it != m_metadataByID.end())
        {
            return &it->second;
        }
        return nullptr;
    }

    const AssetMetadata *AssetRegistry::FindByName(const std::string &name) const
    {
        auto it = m_idByName.find(name);
        if (it != m_idByName.end())
        {
            return FindByID(it->second);
        }
        return nullptr;
    }

    std::vector<const AssetMetadata *> AssetRegistry::FindByType(AssetType type) const
    {
        std::vector<const AssetMetadata *> results;
        for (const auto &[id, meta] : m_metadataByID)
        {
            if (meta.Type == type)
            {
                results.push_back(&meta);
            }
        }
        return results;
    }

    bool AssetRegistry::Contains(AssetID id) const
    {
        return m_metadataByID.find(id) != m_metadataByID.end();
    }

    void AssetRegistry::Clear()
    {
        m_metadataByID.clear();
        m_idByName.clear();
    }
}
