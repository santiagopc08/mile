#ifndef PLATFORM_ENGINE_PRESENTATION_GAMEPLAY_HUD_VIEW_MODEL_2D_HPP
#define PLATFORM_ENGINE_PRESENTATION_GAMEPLAY_HUD_VIEW_MODEL_2D_HPP

#include <cstdint>
#include <string>

namespace platform
{
    class GameplayHUDViewModel2D
    {
    public:
        GameplayHUDViewModel2D() = default;

        void updateHUD(float health, uint32_t coins, uint32_t lives, uint32_t score, uint32_t world, uint32_t level, float remainingTime);

        [[nodiscard]] float health() const { return m_health; }
        [[nodiscard]] uint32_t coins() const { return m_coins; }
        [[nodiscard]] uint32_t lives() const { return m_lives; }
        [[nodiscard]] uint32_t score() const { return m_score; }
        [[nodiscard]] uint32_t world() const { return m_world; }
        [[nodiscard]] uint32_t level() const { return m_level; }
        [[nodiscard]] float remainingTime() const { return m_remainingTime; }
        [[nodiscard]] bool isDebugOverlayVisible() const { return m_debugOverlayVisible; }

        void setDebugOverlayVisible(bool visible) { m_debugOverlayVisible = visible; }

    private:
        float m_health{100.0f};
        uint32_t m_coins{0};
        uint32_t m_lives{3};
        uint32_t m_score{0};
        uint32_t m_world{1};
        uint32_t m_level{1};
        float m_remainingTime{300.0f};
        bool m_debugOverlayVisible{false};
    };
}

#endif // PLATFORM_ENGINE_PRESENTATION_GAMEPLAY_HUD_VIEW_MODEL_2D_HPP
