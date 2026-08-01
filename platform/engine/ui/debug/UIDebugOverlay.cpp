#include "engine/ui/debug/UIDebugOverlay.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    UIDebugOverlay::UIDebugOverlay() = default;

    void UIDebugOverlay::RenderOverlay(const UIManager &uiManager, const ThemeManager &themeManager, const UIAnimator &animator, Renderer &renderer)
    {
        if (!m_enabled)
        {
            return;
        }

        (void)themeManager;
        (void)animator;

        // Render UI Debug overlay box at bottom-left
        size_t widgetCount = uiManager.GetTotalWidgetCount();
        size_t canvasCount = uiManager.GetCanvases().size();

        (void)widgetCount;
        (void)canvasCount;

        // Background debug box
        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2(20.0f, 580.0f),
            glm::vec2(260.0f, 120.0f),
            0.0f,
            glm::vec4(0.05f, 0.05f, 0.08f, 0.85f)
        ));

        // Green indicator line
        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            glm::vec2(20.0f, 580.0f),
            glm::vec2(4.0f, 120.0f),
            0.0f,
            glm::vec4(0.2f, 0.9f, 0.4f, 1.0f)
        ));
    }
}
