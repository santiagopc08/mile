#ifndef PLATFORM_ENGINE_GAMEPLAY_UI_GAMEPLAY_HUD_VIEW_MODEL_HPP
#define PLATFORM_ENGINE_GAMEPLAY_UI_GAMEPLAY_HUD_VIEW_MODEL_HPP

#include <cstdint>

namespace platform
{
    class GameplayHUDViewModel
    {
    public:
        GameplayHUDViewModel() = default;

        void Update(float fuelVal, double distVal, uint32_t coinsVal, uint64_t scoreVal, float speedVal)
        {
            m_fuel = fuelVal;
            m_distance = distVal;
            m_coins = coinsVal;
            m_score = scoreVal;
            m_speed = speedVal;
        }

        [[nodiscard]] float fuel() const { return m_fuel; }
        [[nodiscard]] double distance() const { return m_distance; }
        [[nodiscard]] uint32_t coins() const { return m_coins; }
        [[nodiscard]] uint64_t score() const { return m_score; }
        [[nodiscard]] float speed() const { return m_speed; }

    private:
        float m_fuel{100.0f};
        double m_distance{0.0};
        uint32_t m_coins{0};
        uint64_t m_score{0};
        float m_speed{0.0f};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_UI_GAMEPLAY_HUD_VIEW_MODEL_HPP
