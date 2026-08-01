#ifndef PLATFORM_EDITOR_WORKSPACE_EDITOR_WORKSPACE_HPP
#define PLATFORM_EDITOR_WORKSPACE_EDITOR_WORKSPACE_HPP

#include "editor/workspace/Dockspace.hpp"
#include <memory>
#include <string>

namespace platform
{
    class ScenePanel;
    class HierarchyPanel;
    class InspectorPanel;
    class ConsolePanel;

    class EditorWorkspace
    {
    public:
        EditorWorkspace();

        void Initialize(EditorContext &context);
        void Update(EditorContext &context, double dt);
        void Render(EditorContext &context);

        /// Assigns each panel its screen rectangle for the current window size.
        /// `topInset` reserves room for the toolbar, `bottomInset` for the status bar.
        void LayoutPanels(float width, float height, float topInset, float bottomInset);

        bool SaveLayout(const std::string &layoutFilePath = "layout.json");
        bool LoadLayout(const std::string &layoutFilePath = "layout.json");

        void ToggleFullscreen();
        [[nodiscard]] bool IsFullscreen() const { return m_fullscreen; }

        [[nodiscard]] Dockspace &GetDockspace() { return m_dockspace; }

        /// Typed accessors for the panels the editor shell drives directly.
        [[nodiscard]] ScenePanel *GetScenePanel() const { return m_scenePanel.get(); }
        [[nodiscard]] HierarchyPanel *GetHierarchyPanel() const { return m_hierarchyPanel.get(); }
        [[nodiscard]] InspectorPanel *GetInspectorPanel() const { return m_inspectorPanel.get(); }
        [[nodiscard]] ConsolePanel *GetConsolePanel() const { return m_consolePanel.get(); }

        [[nodiscard]] const UIRect &GetViewportRect() const { return m_viewportRect; }

    private:
        Dockspace m_dockspace;
        std::string m_activeLayoutPath{"layout.json"};
        bool m_fullscreen{false};

        std::shared_ptr<ScenePanel> m_scenePanel;
        std::shared_ptr<HierarchyPanel> m_hierarchyPanel;
        std::shared_ptr<InspectorPanel> m_inspectorPanel;
        std::shared_ptr<ConsolePanel> m_consolePanel;

        UIRect m_viewportRect{};
    };
}

#endif // PLATFORM_EDITOR_WORKSPACE_EDITOR_WORKSPACE_HPP
