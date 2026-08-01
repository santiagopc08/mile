#ifndef PLATFORM_ENGINE_PIPELINE_CONTENT_CACHE_HPP
#define PLATFORM_ENGINE_PIPELINE_CONTENT_CACHE_HPP

#include "engine/assets/AssetID.hpp"
#include <unordered_map>
#include <vector>
#include <cstdint>

namespace platform
{
    enum class ContentCacheTier
    {
        SourceCache,
        CompiledCache,
        RuntimeCache
    };

    struct ContentCacheStats
    {
        uint64_t Hits{0};
        uint64_t Misses{0};
        uint64_t TotalBytesCached{0};

        [[nodiscard]] float GetHitRate() const
        {
            uint64_t total = Hits + Misses;
            if (total == 0) return 1.0f;
            return static_cast<float>(Hits) / static_cast<float>(total);
        }
    };

    class ContentCache
    {
    public:
        ContentCache() = default;

        void Store(AssetID id, ContentCacheTier tier, const std::vector<uint8_t> &data);
        bool Get(AssetID id, ContentCacheTier tier, std::vector<uint8_t> &outData);

        void Invalidate(AssetID id);
        void Clear();

        [[nodiscard]] const ContentCacheStats &GetStats() const { return m_stats; }

    private:
        std::unordered_map<AssetID, std::vector<uint8_t>> m_compiledCache;
        ContentCacheStats m_stats;
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_CONTENT_CACHE_HPP
