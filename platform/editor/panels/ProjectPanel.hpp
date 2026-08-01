#ifndef PLATFORM_EDITOR_PANELS_PROJECT_PANEL_HPP
#define PLATFORM_EDITOR_PANELS_PROJECT_PANEL_HPP

#include "editor/panels/EditorPanel.hpp"

namespace platform
{
    class ProjectPanel : public EditorPanel
    {
    public:
        ProjectPanel();

        void OnRender(EditorContext &context) override;
        [[nodiscard]] const std::string &GetName() const override { return m_name; }

    private:
        std::string m_name{"Project VFS"};
    };
}

#endif // PLATFORM_EDITOR_PANELS_PROJECT_PANEL_HPP
