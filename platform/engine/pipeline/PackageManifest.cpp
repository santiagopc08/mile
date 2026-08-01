#include "engine/pipeline/PackageManifest.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    PackageManifest::PackageManifest() = default;

    void PackageManifest::AddEntry(PackageManifestEntry entry)
    {
        LOG_INFO("[PackageManifest] Added entry '{}' (ID: {}) to package manifest.", entry.VirtualPathStr, entry.ID);
        m_entries[entry.ID] = std::move(entry);
    }

    const PackageManifestEntry *PackageManifest::FindEntry(AssetID id) const
    {
        auto it = m_entries.find(id);
        if (it != m_entries.end())
        {
            return &it->second;
        }
        return nullptr;
    }

    void PackageManifest::Clear()
    {
        m_entries.clear();
    }
}
