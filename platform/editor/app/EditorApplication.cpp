#include "editor/app/EditorApplication.hpp"
#include "editor/commands/EntityCommands.hpp"
#include "editor/io/SceneSerializer.hpp"
#include "editor/panels/ConsolePanel.hpp"
#include "editor/panels/HierarchyPanel.hpp"
#include "editor/panels/InspectorPanel.hpp"
#include "editor/panels/ScenePanel.hpp"
#include "engine/core/Logger.hpp"
#include "engine/graphics/RenderCommand.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/scene/components/Components.hpp"

#include <filesystem>

namespace platform
{
    namespace
    {
        constexpr float kStatusBarHeight = 26.0f;

        /// Scene subclass whose active camera the editor drives.
        class EditorScene final : public Scene
        {
        public:
            EditorScene(std::string_view name, Camera2D *camera)
                : Scene(name), m_camera(camera)
            {
            }

            [[nodiscard]] Camera2D *GetActiveCamera() override { return m_camera; }

        private:
            Camera2D *m_camera{nullptr};
        };

    }

    EditorApplication::EditorApplication(const WindowConfig &config)
        : Application(config)
    {
    }

    bool EditorApplication::Initialize(const WindowConfig &config)
    {
        if (!Application::Initialize(config))
        {
            return false;
        }

        // Initialize Runtime VFS & Assets
        m_context.VFS.Initialize();
        m_context.Assets.Initialize();

        // Create Active Scene
        m_editorScene = std::make_unique<EditorScene>("Editor Main Scene", &m_camera);
        m_context.ActiveScene = m_editorScene.get();
        m_context.Camera = &m_camera;

        if (auto *engine = GetEngine())
        {
            m_context.Device = engine->GetInput();
            // The editor composites the scene itself inside the viewport panel, so the
            // engine's automatic full-window pass is turned off.
            engine->SetSceneRenderingEnabled(false);
        }

        // Initialize Editor Workspace
        m_workspace.Initialize(m_context);
        m_context.Console = m_workspace.GetConsolePanel();

        m_context.ScenePath = "editor_scene.scene";
        if (std::filesystem::exists(m_context.ScenePath))
        {
            std::string error;
            if (SceneSerializer::Load(*m_editorScene, m_context.ScenePath, error))
            {
                m_context.Log("Success", "Restored scene from " + m_context.ScenePath + ".");
            }
            else
            {
                m_context.Log("Warn", error);
                SeedStarterScene();
            }
        }
        else
        {
            SeedStarterScene();
        }

        m_context.Log("Info", "Click a shape to select it.");
        m_context.Log("Info", "Drag it to move, right-drag to pan.");
        m_context.Log("Info", "Mouse wheel zooms the viewport.");

        LOG_INFO("[EditorApplication] Standalone Editor Application initialized successfully.");
        return true;
    }

    void EditorApplication::SeedStarterScene()
    {
        auto &registry = m_editorScene->GetRegistry();

        struct Starter
        {
            const char *Name;
            glm::vec2 Position;
            glm::vec2 Size;
            glm::vec4 Color;
            int Layer;
        };

        const Starter starters[] = {
            {"Ground", {0.0f, 220.0f}, {900.0f, 60.0f}, {0.20f, 0.30f, 0.24f, 1.0f}, 0},
            {"Platform Left", {-280.0f, 60.0f}, {220.0f, 30.0f}, {0.30f, 0.40f, 0.52f, 1.0f}, 1},
            {"Platform Right", {280.0f, -40.0f}, {220.0f, 30.0f}, {0.30f, 0.40f, 0.52f, 1.0f}, 1},
            {"Player", {0.0f, 120.0f}, {60.0f, 90.0f}, {0.20f, 0.72f, 0.92f, 1.0f}, 2},
            {"Pickup", {280.0f, -90.0f}, {34.0f, 34.0f}, {0.96f, 0.72f, 0.28f, 1.0f}, 2},
        };

        for (const auto &starter : starters)
        {
            const EntityID entity = registry.CreateEntity(starter.Name);
            auto &transform = registry.AddComponent<TransformComponent>(entity);
            transform.Position = starter.Position;

            auto &shape = registry.AddComponent<ShapeComponent>(entity);
            shape.Size = starter.Size;
            shape.Color = starter.Color;

            registry.AddComponent<RenderLayerComponent>(entity).LayerID = starter.Layer;
            registry.AddComponent<VisibilityComponent>(entity);
        }

        m_context.Log("Info", "Seeded a starter scene with 5 entities.");
    }

    void EditorApplication::Shutdown()
    {
        m_workspace.SaveLayout("layout.json");
        m_context.Assets.Shutdown();
        m_context.VFS.Shutdown();

        // Detach live services before the engine tears them down.
        m_context.Console = nullptr;
        m_context.Device = nullptr;
        m_context.UI = nullptr;

        Application::Shutdown();
        LOG_INFO("[EditorApplication] Standalone Editor Application shutdown complete.");
    }

    void EditorApplication::PerformAction(EditorAction action)
    {
        auto *scenePanel = m_workspace.GetScenePanel();
        const auto &selection = m_context.Selection.GetSelection();
        const bool hasEntity = selection.Type == SelectionType::Entity;

        switch (action)
        {
        case EditorAction::NewEntity:
        {
            auto command = std::make_unique<CreateEntityCommand>(m_editorScene.get(), "New Entity");
            auto *raw = command.get();
            if (m_context.History.ExecuteCommand(std::move(command)))
            {
                const EntityID created = raw->GetCreatedEntity();
                auto &registry = m_editorScene->GetRegistry();
                auto &transform = registry.AddComponent<TransformComponent>(created);
                transform.Position = m_camera.GetPosition();
                auto &shape = registry.AddComponent<ShapeComponent>(created);
                shape.Size = {90.0f, 90.0f};
                shape.Color = EditorTheme::Accent;
                registry.AddComponent<RenderLayerComponent>(created).LayerID = 2;
                registry.AddComponent<VisibilityComponent>(created);

                m_context.Selection.SetEntitySelection(created, "New Entity");
                m_context.Log("Success", "Created entity #" + std::to_string(created) + ".");
                m_statusMessage = "Entity created.";
            }
            break;
        }
        case EditorAction::DuplicateEntity:
        {
            if (!hasEntity) break;
            auto command = std::make_unique<DuplicateEntityCommand>(m_editorScene.get(), selection.Entity);
            auto *raw = command.get();
            if (m_context.History.ExecuteCommand(std::move(command)))
            {
                m_context.Selection.SetEntitySelection(raw->GetCreatedEntity(), selection.Name + " Copy");
                m_context.Log("Success", "Duplicated '" + selection.Name + "'.");
                m_statusMessage = "Entity duplicated.";
            }
            break;
        }
        case EditorAction::DeleteEntity:
        {
            if (!hasEntity) break;
            const std::string name = selection.Name;
            if (m_context.History.ExecuteCommand(std::make_unique<DeleteEntityCommand>(m_editorScene.get(), selection.Entity)))
            {
                m_context.Selection.Clear();
                m_context.Log("Warn", "Deleted '" + name + "'.");
                m_statusMessage = "Entity deleted.";
            }
            break;
        }
        case EditorAction::Undo:
            if (m_context.History.Undo())
            {
                m_context.Selection.Clear();
                m_context.Log("Info", "Undo.");
                m_statusMessage = "Undo.";
            }
            break;
        case EditorAction::Redo:
            if (m_context.History.Redo())
            {
                m_context.Selection.Clear();
                m_context.Log("Info", "Redo.");
                m_statusMessage = "Redo.";
            }
            break;
        case EditorAction::SaveScene:
        {
            std::string error;
            if (SceneSerializer::Save(*m_editorScene, m_context.ScenePath, error))
            {
                m_context.Log("Success", "Saved scene to " + m_context.ScenePath + ".");
                m_statusMessage = "Scene saved.";
            }
            else
            {
                m_context.Log("Error", error);
                m_statusMessage = "Save failed.";
            }
            break;
        }
        case EditorAction::LoadScene:
        {
            std::string error;
            if (SceneSerializer::Load(*m_editorScene, m_context.ScenePath, error))
            {
                m_context.Selection.Clear();
                m_context.History.Clear();
                m_context.Log("Success", "Loaded scene from " + m_context.ScenePath + ".");
                m_statusMessage = "Scene loaded.";
            }
            else
            {
                m_context.Log("Error", error);
                m_statusMessage = "Load failed.";
            }
            break;
        }
        case EditorAction::FrameSelection:
            if (scenePanel)
            {
                scenePanel->FrameSelection(m_context);
                m_statusMessage = "Framed selection.";
            }
            break;
        case EditorAction::ToggleGrid:
            if (scenePanel)
            {
                scenePanel->SetGridVisible(!scenePanel->IsGridVisible());
                m_statusMessage = scenePanel->IsGridVisible() ? "Grid on." : "Grid off.";
            }
            break;
        case EditorAction::ToggleFullscreen:
            m_workspace.ToggleFullscreen();
            m_statusMessage = m_workspace.IsFullscreen() ? "Viewport maximized." : "Panels restored.";
            break;
        case EditorAction::GizmoTranslate:
            if (scenePanel) scenePanel->GetGizmos().SetMode(GizmoMode::Translate);
            break;
        case EditorAction::GizmoRotate:
            if (scenePanel) scenePanel->GetGizmos().SetMode(GizmoMode::Rotate);
            break;
        case EditorAction::GizmoScale:
            if (scenePanel) scenePanel->GetGizmos().SetMode(GizmoMode::Scale);
            break;
        case EditorAction::None:
        default:
            break;
        }

        if (action != EditorAction::None)
        {
            m_statusTimer = 3.0;
        }
    }

    void EditorApplication::HandleShortcuts()
    {
        auto *input = m_context.Device;
        if (!input)
        {
            return;
        }

        const bool ctrl = input->IsKeyHeld(Key::LeftCtrl) || input->IsKeyPressed(Key::LeftCtrl)
            || input->IsKeyHeld(Key::RightCtrl) || input->IsKeyPressed(Key::RightCtrl);
        const bool shift = input->IsKeyHeld(Key::LeftShift) || input->IsKeyPressed(Key::LeftShift)
            || input->IsKeyHeld(Key::RightShift) || input->IsKeyPressed(Key::RightShift);

        if (ctrl && input->IsKeyPressed(Key::Z))
        {
            PerformAction(shift ? EditorAction::Redo : EditorAction::Undo);
            return;
        }
        if (ctrl && input->IsKeyPressed(Key::Y))
        {
            PerformAction(EditorAction::Redo);
            return;
        }
        if (ctrl && input->IsKeyPressed(Key::S))
        {
            PerformAction(EditorAction::SaveScene);
            return;
        }
        if (ctrl && input->IsKeyPressed(Key::O))
        {
            PerformAction(EditorAction::LoadScene);
            return;
        }
        if (ctrl && input->IsKeyPressed(Key::D))
        {
            PerformAction(EditorAction::DuplicateEntity);
            return;
        }
        if (ctrl && input->IsKeyPressed(Key::N))
        {
            PerformAction(EditorAction::NewEntity);
            return;
        }

        if (input->IsKeyPressed(Key::Delete) || input->IsKeyPressed(Key::Backspace))
        {
            PerformAction(EditorAction::DeleteEntity);
        }
        else if (input->IsKeyPressed(Key::W))
        {
            PerformAction(EditorAction::GizmoTranslate);
        }
        else if (input->IsKeyPressed(Key::E))
        {
            PerformAction(EditorAction::GizmoRotate);
        }
        else if (input->IsKeyPressed(Key::R))
        {
            PerformAction(EditorAction::GizmoScale);
        }
        else if (input->IsKeyPressed(Key::F))
        {
            PerformAction(EditorAction::FrameSelection);
        }
        else if (input->IsKeyPressed(Key::G))
        {
            PerformAction(EditorAction::ToggleGrid);
        }
        else if (input->IsKeyPressed(Key::Tab))
        {
            PerformAction(EditorAction::ToggleFullscreen);
        }
        else if (input->IsKeyPressed(Key::Escape))
        {
            m_context.Selection.Clear();
        }
    }

    void EditorApplication::UpdateEditor(double dt)
    {
        auto *engine = GetEngine();
        if (engine)
        {
            const auto &stats = engine->GetStatistics();
            m_context.Stats.FPS = stats.FPS;
            m_context.Stats.FrameTimeMs = stats.FrameTimeMs;
            m_context.Stats.FrameNumber = stats.FrameNumber;
            m_context.Device = engine->GetInput();
        }

        HandleShortcuts();

        if (m_statusTimer > 0.0)
        {
            m_statusTimer -= dt;
            if (m_statusTimer <= 0.0)
            {
                m_statusMessage = "Ready.";
            }
        }

        m_workspace.Update(m_context, dt);
    }

    void EditorApplication::DrawStatusBar()
    {
        const float y = m_ui.ViewportHeight() - kStatusBarHeight;
        const UIRect bar{0.0f, y, m_ui.ViewportWidth(), kStatusBarHeight};
        m_ui.Rect(bar, EditorTheme::PanelHeader);
        m_ui.Rect({0.0f, y, m_ui.ViewportWidth(), 1.0f}, EditorTheme::PanelBorder);

        const auto &selection = m_context.Selection.GetSelection();
        const std::string selectionText = selection.Type == SelectionType::Entity
            ? "SELECTED  " + selection.Name + "  (#" + std::to_string(selection.Entity) + ")"
            : "NOTHING SELECTED";

        m_ui.Text(10.0f, y + 8.0f, selectionText, EditorTheme::TextMuted);

        const float messageX = m_ui.ViewportWidth() * 0.36f;
        m_ui.Text(messageX, y + 8.0f, m_statusMessage, EditorTheme::Text);

        // The hint line is the first thing to drop when the window gets narrow.
        const std::string help = "CTRL+Z UNDO  CTRL+S SAVE  W/E/R GIZMO  F FOCUS  G GRID  TAB MAX";
        const float helpX = m_ui.ViewportWidth() - EditorUI::TextWidth(help) - 12.0f;
        if (helpX > messageX + 200.0f)
        {
            m_ui.Text(helpX, y + 8.0f, help, EditorTheme::TextDisabled);
        }
    }

    void EditorApplication::RenderEditor()
    {
        auto *engine = GetEngine();
        auto *renderer = engine ? engine->GetRenderer() : nullptr;
        if (!renderer)
        {
            return;
        }

        const auto &renderContext = renderer->GetContext();
        const auto width = static_cast<float>(renderContext.ViewportWidth);
        const auto height = static_cast<float>(renderContext.ViewportHeight);

        m_ui.BeginFrame(renderer, m_context.Device, width, height);
        m_context.UI = &m_ui;

        m_ui.Rect({0.0f, 0.0f, width, height}, EditorTheme::WindowBackground);

        m_workspace.LayoutPanels(width, height, EditorMenuBar::Height() + 4.0f, kStatusBarHeight + 4.0f);

        // The toolbar is drawn first so it wins any click that overlaps a panel.
        const EditorAction action = m_menuBar.Render(m_context, m_workspace);

        m_workspace.Render(m_context);

        m_context.Stats.RenderedEntities = m_context.ActiveScene
            ? m_context.ActiveScene->GetRegistry().EntityCount()
            : 0;

        DrawStatusBar();

        m_ui.EndFrame();
        m_context.UI = nullptr;

        if (action != EditorAction::None)
        {
            PerformAction(action);
        }
    }
}
