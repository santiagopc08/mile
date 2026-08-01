#ifndef PLATFORM_ENGINE_PIPELINE_DEBUG_CONTENT_DEBUG_OVERLAY_HPP
#define PLATFORM_ENGINE_PIPELINE_DEBUG_CONTENT_DEBUG_OVERLAY_HPP

#include "engine/pipeline/debug/ContentDiagnostics.hpp"
#include "engine/ui/UIManager.hpp"

namespace platform
{
    class ContentDebugOverlay
    {
    public:
        ContentDebugOverlay() = default;

        void Initialize(UIManager *uiManager);
        void Update(const ContentDiagnostics &diagnostics, double dt);

        void ToggleVisibility() { m_visible = !m_visible; }
        void SetVisible(bool visible) { m_visible = visible; }
        [[nodiscard]] bool IsVisible() const { return m_visible; }

    private:
        UIManager *m_uiManager{nullptr};
        bool m_visible{true};
    };
}

#endif // PLATFORM_ENGINE_PIPELINE_DEBUG_CONTENT_DEBUG_OVERLAY_HPP
