#ifndef PLATFORM_ENGINE_PIPELINE_PACKAGE_MANIFEST_HPP
#define PLATFORM_ENGINE_PIPELINE_PACKAGE_MANIFEST_HPP

#include "engine/assets/AssetMetadata.hpp"
#include <string>
#include <vector>
#include <unordered_map>

namespace platform
{
    struct PackageManifestEntry
    {
        AssetID ID{kInvalidAssetID};
        std::string VirtualPathStr;
        std::string CompiledPathStr;
        AssetType Type{AssetType::Unknown};
        std::string Hash;
        uint64_t SizeBytes{0};
    };

    class PackageManifest
    {
    public:
        PackageManifest();

        void AddEntry(PackageManifestEntry entry);
        [[nodiscard]] const PackageManifestEntry *FindEntry(AssetID id) const;

        [[nodiscard]] size_t GetTotalEntries() const { return m_entries.size(); }
        [[nodiscard]] const std::unordered_map<AssetID, PackageManifestEntry> &GetEntries() const { return m_entries; }
        [[nodiscard]] const std::string &GetPackageID() const { return m_packageID; }

        void Clear();

    private:
        std::string m_packageID{"pkg-main-v1.0"};
        std::unordered_map<AssetID, PackageManifestEntry> m_entries;
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_PACKAGE_MANIFEST_HPP
