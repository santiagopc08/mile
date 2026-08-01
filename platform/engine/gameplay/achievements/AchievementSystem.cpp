#include "engine/gameplay/achievements/AchievementSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AchievementSystem::AchievementSystem()
    {
        m_achievements["FirstCoin"] = false;
        m_achievements["100Coins"] = false;
        m_achievements["1000m"] = false;
        m_achievements["5000m"] = false;
        m_achievements["FirstRecovery"] = false;
        m_achievements["NoRecoveryRun"] = false;
    }

    void AchievementSystem::unlock(const std::string &id)
    {
        auto it = m_achievements.find(id);
        if (it != m_achievements.end() && !it->second)
        {
            it->second = true;
            LOG_INFO("[AchievementSystem] Unlocked achievement '{}'!", id);
        }
    }

    bool AchievementSystem::isUnlocked(const std::string &id) const
    {
        auto it = m_achievements.find(id);
        return (it != m_achievements.end()) && it->second;
    }

    void AchievementSystem::resetAchievements()
    {
        for (auto &[id, unlocked] : m_achievements)
        {
            unlocked = false;
        }
        LOG_INFO("[AchievementSystem] Reset all achievement progress.");
    }

    size_t AchievementSystem::GetUnlockedCount() const
    {
        size_t count = 0;
        for (const auto &[id, unlocked] : m_achievements)
        {
            if (unlocked) count++;
        }
        return count;
    }
}
