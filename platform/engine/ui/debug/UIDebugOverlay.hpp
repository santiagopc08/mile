#ifndef PLATFORM_ENGINE_UI_DEBUG_UI_DEBUG_OVERLAY_HPP
#define PLATFORM_ENGINE_UI_DEBUG_UI_DEBUG_OVERLAY_HPP

#include "engine/ui/UIManager.hpp"
#include "engine/ui/theme/ThemeManager.hpp"
#include "engine/ui/animation/UIAnimator.hpp"
#include "engine/graphics/Renderer.hpp"

namespace platform
{
    class UIDebugOverlay
    {
    public:
        UIDebugOverlay();

        void RenderOverlay(const UIManager &uiManager, const ThemeManager &themeManager, const UIAnimator &animator, Renderer &renderer);
        void ToggleOverlay() { m_enabled = !m_enabled; }
        void SetEnabled(bool enabled) { m_enabled = enabled; }

        [[nodiscard]] bool IsEnabled() const { return m_enabled; }

    private:
        bool m_enabled{true};
    };
}

#endif // PLATFORM_ENGINE_UI_DEBUG_UI_DEBUG_OVERLAY_HPP
