#include "editor/workspace/Dockspace.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void Dockspace::AddPanel(std::shared_ptr<EditorPanel> panel, DockSlot slot)
    {
        if (!panel) return;
        m_panels.push_back({std::move(panel), slot});
    }

    void Dockspace::RemovePanel(const std::string &name)
    {
        m_panels.erase(std::remove_if(m_panels.begin(), m_panels.end(), [&](const DockedPanelEntry &entry) {
            return entry.PanelPtr && entry.PanelPtr->GetName() == name;
        }), m_panels.end());
    }

    void Dockspace::RenderAll(EditorContext &context)
    {
        for (auto &entry : m_panels)
        {
            if (entry.PanelPtr && entry.PanelPtr->IsVisible())
            {
                entry.PanelPtr->OnRender(context);
            }
        }
    }
}
