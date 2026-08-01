#include "editor/panels/AssetBrowserPanel.hpp"
#include "engine/core/Logger.hpp"

#include <vector>

namespace platform
{
    AssetBrowserPanel::AssetBrowserPanel() = default;

    void AssetBrowserPanel::OnRender(EditorContext &context)
    {
        if (!m_visible) return;

        const auto &registry = context.Assets.GetRegistry();
        const size_t total = registry.GetAssetCount();

        if (!context.UI)
        {
            LOG_INFO("[AssetBrowserPanel] Rendered Asset Browser Grid (Assets: {}).", total);
            return;
        }

        auto &ui = *context.UI;
        const UIRect content = ui.Panel(m_bounds, "ASSETS  (" + std::to_string(total) + ")");
        const UIRect body = content.Inset(6.0f);

        if (total == 0)
        {
            ui.TextClipped(body, body.X + 2.0f, body.Y + 6.0f, "No assets imported yet.", EditorTheme::TextDisabled);
            return;
        }

        const auto &selection = context.Selection.GetSelection();

        float cursorY = body.Y + 2.0f;
        for (const auto &[id, metadata] : registry.GetAllMetadata())
        {
            if (cursorY + EditorTheme::RowHeight > body.Bottom())
            {
                break;
            }

            const UIRect row{body.X, cursorY, body.Width, EditorTheme::RowHeight - 2.0f};
            const bool selected = selection.Type == SelectionType::Asset && selection.Asset == id;
            if (ui.Row(row, metadata.Name, selected))
            {
                context.Selection.SetAssetSelection(id, metadata.Name);
            }
            cursorY += EditorTheme::RowHeight;
        }
    }
}
