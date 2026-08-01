#include "engine/presentation/GameplayHUDViewModel2D.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void GameplayHUDViewModel2D::updateHUD(float health, uint32_t coins, uint32_t lives, uint32_t score, uint32_t world, uint32_t level, float remainingTime)
    {
        m_health = health;
        m_coins = coins;
        m_lives = lives;
        m_score = score;
        m_world = world;
        m_level = level;
        m_remainingTime = remainingTime;
    }
}
