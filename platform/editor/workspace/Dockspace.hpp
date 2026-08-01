#ifndef PLATFORM_EDITOR_WORKSPACE_DOCKSPACE_HPP
#define PLATFORM_EDITOR_WORKSPACE_DOCKSPACE_HPP

#include "editor/panels/EditorPanel.hpp"
#include <vector>
#include <memory>

namespace platform
{
    enum class DockSlot
    {
        Center,
        Left,
        Right,
        Bottom,
        Floating
    };

    struct DockedPanelEntry
    {
        std::shared_ptr<EditorPanel> PanelPtr;
        DockSlot Slot{DockSlot::Center};
    };

    class Dockspace
    {
    public:
        Dockspace() = default;

        void AddPanel(std::shared_ptr<EditorPanel> panel, DockSlot slot = DockSlot::Center);
        void RemovePanel(const std::string &name);

        void RenderAll(EditorContext &context);

        [[nodiscard]] const std::vector<DockedPanelEntry> &GetPanels() const { return m_panels; }

    private:
        std::vector<DockedPanelEntry> m_panels;
    };
}

#endif // PLATFORM_EDITOR_WORKSPACE_DOCKSPACE_HPP
