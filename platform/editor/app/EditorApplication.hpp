#ifndef PLATFORM_EDITOR_APP_EDITOR_APPLICATION_HPP
#define PLATFORM_EDITOR_APP_EDITOR_APPLICATION_HPP

#include "engine/app/Application.hpp"
#include "engine/graphics/Camera2D.hpp"
#include "editor/app/EditorContext.hpp"
#include "editor/workspace/EditorWorkspace.hpp"
#include "editor/ui/EditorMenuBar.hpp"
#include "editor/ui/EditorUI.hpp"

namespace platform
{
    class EditorApplication : public Application
    {
    public:
        explicit EditorApplication(const WindowConfig &config);
        ~EditorApplication() = default;

        bool Initialize(const WindowConfig &config);
        void Shutdown();
        void UpdateEditor(double dt);
        void RenderEditor();

        /// Runs a toolbar/shortcut action. Public so shortcuts and the toolbar share it.
        void PerformAction(EditorAction action);

        [[nodiscard]] EditorContext &GetContext() { return m_context; }
        [[nodiscard]] EditorWorkspace &GetWorkspace() { return m_workspace; }

    private:
        void OnUpdate(double dt) override { UpdateEditor(dt); }
        void OnRender() override { RenderEditor(); }

        void HandleShortcuts();
        void DrawStatusBar();
        void SeedStarterScene();

        EditorContext m_context;
        EditorWorkspace m_workspace;
        EditorMenuBar m_menuBar;
        EditorUI m_ui;
        Camera2D m_camera{1600.0f, 900.0f};
        std::unique_ptr<Scene> m_editorScene;
        std::string m_statusMessage{"Ready."};
        double m_statusTimer{0.0};
    };
}

#endif // PLATFORM_EDITOR_APP_EDITOR_APPLICATION_HPP
