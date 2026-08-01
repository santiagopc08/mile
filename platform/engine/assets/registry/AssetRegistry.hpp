#ifndef PLATFORM_ENGINE_ASSETS_REGISTRY_ASSET_REGISTRY_HPP
#define PLATFORM_ENGINE_ASSETS_REGISTRY_ASSET_REGISTRY_HPP

#include "engine/assets/AssetMetadata.hpp"
#include <unordered_map>
#include <vector>
#include <string>

namespace platform
{
    class AssetRegistry
    {
    public:
        AssetRegistry();

        bool RegisterAsset(AssetMetadata metadata);
        bool UnregisterAsset(AssetID id);

        [[nodiscard]] const AssetMetadata *FindByID(AssetID id) const;
        [[nodiscard]] const AssetMetadata *FindByName(const std::string &name) const;
        [[nodiscard]] std::vector<const AssetMetadata *> FindByType(AssetType type) const;

        [[nodiscard]] bool Contains(AssetID id) const;
        [[nodiscard]] size_t GetAssetCount() const { return m_metadataByID.size(); }
        [[nodiscard]] const std::unordered_map<AssetID, AssetMetadata> &GetAllMetadata() const { return m_metadataByID; }

        void Clear();

    private:
        std::unordered_map<AssetID, AssetMetadata> m_metadataByID;
        std::unordered_map<std::string, AssetID> m_idByName;
    };
}

#endif // PLATFORM_ENGINE_ASSETS_REGISTRY_ASSET_REGISTRY_HPP
