#ifndef PLATFORM_ENGINE_GAMEPLAY_UI_PROGRESSION_DEBUG_OVERLAY_HPP
#define PLATFORM_ENGINE_GAMEPLAY_UI_PROGRESSION_DEBUG_OVERLAY_HPP

#include "engine/gameplay/fuel/FuelComponent.hpp"
#include "engine/gameplay/score/ScoreSystem.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/graphics/Camera2D.hpp"

namespace platform
{
    class ProgressionDebugOverlay
    {
    public:
        ProgressionDebugOverlay();

        void RenderOverlay(const FuelComponent &fuel, const ScoreSystem &scoreSystem, Renderer &renderer, const Camera2D &camera);
        void ToggleOverlay() { m_enabled = !m_enabled; }
        void SetEnabled(bool enabled) { m_enabled = enabled; }

        [[nodiscard]] bool IsEnabled() const { return m_enabled; }

    private:
        bool m_enabled{true};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_UI_PROGRESSION_DEBUG_OVERLAY_HPP
