#ifndef PLATFORM_ENGINE_GAMEPLAY_ACHIEVEMENTS_ACHIEVEMENT_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_ACHIEVEMENTS_ACHIEVEMENT_SYSTEM_HPP

#include <string>
#include <unordered_map>
#include <vector>

namespace platform
{
    class AchievementSystem
    {
    public:
        AchievementSystem();

        void unlock(const std::string &id);
        [[nodiscard]] bool isUnlocked(const std::string &id) const;
        void resetAchievements();

        [[nodiscard]] size_t GetUnlockedCount() const;

    private:
        std::unordered_map<std::string, bool> m_achievements;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_ACHIEVEMENTS_ACHIEVEMENT_SYSTEM_HPP
