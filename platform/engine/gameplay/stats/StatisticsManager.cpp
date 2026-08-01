#include "engine/gameplay/stats/StatisticsManager.hpp"
#include "engine/core/Logger.hpp"
#include <format>

namespace platform
{
    void StatisticsManager::resetStatistics()
    {
        m_stats = GameStatisticsData{};
        LOG_INFO("[StatisticsManager] Reset all gameplay statistics.");
    }

    std::string StatisticsManager::exportStatistics() const
    {
        return std::format(
            "{{\n"
            "  \"distanceMeters\": {:.1f},\n"
            "  \"coinsCollected\": {},\n"
            "  \"fuelCollected\": {:.1f},\n"
            "  \"playTimeSeconds\": {:.1f},\n"
            "  \"highestScore\": {},\n"
            "  \"averageSpeed\": {:.2f},\n"
            "  \"maximumSpeed\": {:.2f},\n"
            "  \"recoveries\": {}\n"
            "}}",
            m_stats.distanceMeters,
            m_stats.coinsCollected,
            m_stats.fuelCollected,
            m_stats.playTimeSeconds,
            m_stats.highestScore,
            m_stats.averageSpeed,
            m_stats.maximumSpeed,
            m_stats.recoveries
        );
    }
}
