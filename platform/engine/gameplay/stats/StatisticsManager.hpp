#ifndef PLATFORM_ENGINE_GAMEPLAY_STATS_STATISTICS_MANAGER_HPP
#define PLATFORM_ENGINE_GAMEPLAY_STATS_STATISTICS_MANAGER_HPP

#include <cstdint>
#include <string>

namespace platform
{
    struct GameStatisticsData
    {
        double distanceMeters{0.0};
        uint32_t coinsCollected{0};
        float fuelCollected{0.0f};
        double playTimeSeconds{0.0};
        uint64_t highestScore{0};
        float averageSpeed{0.0f};
        float maximumSpeed{0.0f};
        uint32_t recoveries{0};
    };

    class StatisticsManager
    {
    public:
        StatisticsManager() = default;

        void resetStatistics();
        [[nodiscard]] const GameStatisticsData &statistics() const { return m_stats; }
        [[nodiscard]] std::string exportStatistics() const;

        void RecordDistance(double dist) { m_stats.distanceMeters += dist; }
        void RecordCoin() { m_stats.coinsCollected++; }
        void RecordScore(uint64_t score) { if (score > m_stats.highestScore) m_stats.highestScore = score; }
        void RecordRecovery() { m_stats.recoveries++; }

    private:
        GameStatisticsData m_stats{};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_STATS_STATISTICS_MANAGER_HPP
