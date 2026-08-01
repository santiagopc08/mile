#include "editor/panels/ProjectPanel.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    ProjectPanel::ProjectPanel() = default;

    void ProjectPanel::OnRender(EditorContext &context)
    {
        if (!m_visible) return;

        const auto &mounts = context.VFS.GetMountPoints();

        if (!context.UI)
        {
            LOG_INFO("[ProjectPanel] Rendered VFS Project Tree (Mounts: {}).", mounts.size());
            return;
        }

        auto &ui = *context.UI;
        const UIRect content = ui.Panel(m_bounds, "PROJECT  (" + std::to_string(mounts.size()) + " MOUNTS)");
        const UIRect body = content.Inset(6.0f);

        if (mounts.empty())
        {
            ui.TextClipped(body, body.X + 2.0f, body.Y + 6.0f, "No mount points.", EditorTheme::TextDisabled);
            return;
        }

        float cursorY = body.Y + 4.0f;
        for (const auto &mount : mounts)
        {
            if (cursorY + 16.0f > body.Bottom())
            {
                break;
            }
            ui.TextClipped(body, body.X + 4.0f, cursorY, mount.Scheme + "://", EditorTheme::Accent);
            cursorY += 16.0f;
            ui.TextClipped(body, body.X + 14.0f, cursorY, mount.PhysicalRoot, EditorTheme::TextDisabled);
            cursorY += 20.0f;
        }
    }
}
