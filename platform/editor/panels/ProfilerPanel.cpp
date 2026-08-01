#include "editor/panels/ProfilerPanel.hpp"
#include "engine/core/Logger.hpp"

#include <algorithm>
#include <cstdio>

namespace platform
{
    namespace
    {
        std::string Format(const char *pattern, double value)
        {
            char buffer[64];
            std::snprintf(buffer, sizeof(buffer), pattern, value);
            return std::string(buffer);
        }
    }

    ProfilerPanel::ProfilerPanel() = default;

    void ProfilerPanel::OnRender(EditorContext &context)
    {
        if (!m_visible) return;

        if (!context.UI)
        {
            return;
        }

        auto &ui = *context.UI;
        const UIRect content = ui.Panel(m_bounds, "PROFILER");
        const UIRect body = content.Inset(8.0f);

        const double fps = context.Stats.FPS;
        const glm::vec4 fpsColor = fps >= 55.0 ? EditorTheme::Success
            : (fps >= 30.0 ? EditorTheme::Warning : EditorTheme::Danger);

        const size_t entityCount = context.ActiveScene ? context.ActiveScene->GetRegistry().EntityCount() : 0;

        float cursorY = body.Y;
        ui.TextClipped(body, body.X, cursorY, Format("%.0f FPS", fps), fpsColor, EditorTheme::TitleScale);
        cursorY += 24.0f;

        // Frame budget bar: full width means the 16.6 ms budget is exhausted.
        const float budget = static_cast<float>(std::clamp(context.Stats.FrameTimeMs / 16.6, 0.0, 1.0));
        ui.Rect({body.X, cursorY, body.Width, 6.0f}, EditorTheme::WindowBackground);
        ui.Rect({body.X, cursorY, body.Width * budget, 6.0f}, fpsColor);
        cursorY += 16.0f;

        ui.TextClipped(body, body.X, cursorY, Format("FRAME %.2f ms", context.Stats.FrameTimeMs), EditorTheme::TextMuted);
        cursorY += 18.0f;
        ui.TextClipped(body, body.X, cursorY, "ENTITIES " + std::to_string(entityCount), EditorTheme::TextMuted);
        cursorY += 18.0f;
        ui.TextClipped(body, body.X, cursorY, "DRAWN " + std::to_string(context.Stats.RenderedEntities), EditorTheme::TextMuted);
        cursorY += 18.0f;
        ui.TextClipped(body, body.X, cursorY,
                       "UNDO " + std::to_string(context.History.GetUndoCount())
                           + "  REDO " + std::to_string(context.History.GetRedoCount()),
                       EditorTheme::TextDisabled);
    }
}
