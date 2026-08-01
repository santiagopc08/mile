#include "engine/pipeline/ContentCache.hpp"

namespace platform
{
    void ContentCache::Store(AssetID id, ContentCacheTier tier, const std::vector<uint8_t> &data)
    {
        (void)tier;
        m_compiledCache[id] = data;
        m_stats.TotalBytesCached += data.size();
    }

    bool ContentCache::Get(AssetID id, ContentCacheTier tier, std::vector<uint8_t> &outData)
    {
        (void)tier;
        auto it = m_compiledCache.find(id);
        if (it != m_compiledCache.end())
        {
            outData = it->second;
            m_stats.Hits++;
            return true;
        }

        m_stats.Misses++;
        return false;
    }

    void ContentCache::Invalidate(AssetID id)
    {
        auto it = m_compiledCache.find(id);
        if (it != m_compiledCache.end())
        {
            if (m_stats.TotalBytesCached >= it->second.size())
            {
                m_stats.TotalBytesCached -= it->second.size();
            }
            m_compiledCache.erase(it);
        }
    }

    void ContentCache::Clear()
    {
        m_compiledCache.clear();
        m_stats.TotalBytesCached = 0;
    }
}
