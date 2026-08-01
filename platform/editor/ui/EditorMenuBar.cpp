#include "editor/ui/EditorMenuBar.hpp"
#include "editor/panels/ScenePanel.hpp"
#include "editor/ui/EditorUI.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    EditorAction EditorMenuBar::Render(EditorContext &context, EditorWorkspace &workspace)
    {
        if (!context.UI)
        {
            LOG_INFO("[EditorMenuBar] Rendered Top Menu Bar (File | Edit | View | Panels | Help).");
            return EditorAction::None;
        }

        auto &ui = *context.UI;
        const UIRect bar{0.0f, 0.0f, ui.ViewportWidth(), Height()};

        ui.Rect(bar, EditorTheme::PanelHeader);
        ui.Rect({0.0f, Height() - 2.0f, ui.ViewportWidth(), 2.0f}, EditorTheme::Accent);

        EditorAction action = EditorAction::None;

        float cursorX = 10.0f;
        constexpr float buttonY = 8.0f;
        constexpr float buttonHeight = 24.0f;
        constexpr float spacing = 4.0f;

        const auto addButton = [&](const std::string &label, EditorAction result, bool enabled = true, bool active = false) {
            const float width = EditorUI::TextWidth(label) + 20.0f;
            if (ui.Button({cursorX, buttonY, width, buttonHeight}, label, enabled, active))
            {
                action = result;
            }
            cursorX += width + spacing;
        };

        const auto addSeparator = [&]() {
            cursorX += 4.0f;
            ui.Rect({cursorX, buttonY + 2.0f, 1.0f, buttonHeight - 4.0f}, EditorTheme::PanelBorder);
            cursorX += 9.0f;
        };

        const bool hasEntitySelection = context.Selection.GetSelection().Type == SelectionType::Entity;

        addButton("NEW ENTITY", EditorAction::NewEntity);
        addButton("DUPLICATE", EditorAction::DuplicateEntity, hasEntitySelection);
        addButton("DELETE", EditorAction::DeleteEntity, hasEntitySelection);
        addSeparator();

        addButton("UNDO", EditorAction::Undo, context.History.CanUndo());
        addButton("REDO", EditorAction::Redo, context.History.CanRedo());
        addSeparator();

        addButton("SAVE", EditorAction::SaveScene);
        addButton("LOAD", EditorAction::LoadScene);
        addSeparator();

        auto *scenePanel = workspace.GetScenePanel();
        const GizmoMode mode = scenePanel ? scenePanel->GetGizmos().GetMode() : GizmoMode::None;
        addButton("MOVE", EditorAction::GizmoTranslate, true, mode == GizmoMode::Translate);
        addButton("ROTATE", EditorAction::GizmoRotate, true, mode == GizmoMode::Rotate);
        addButton("SCALE", EditorAction::GizmoScale, true, mode == GizmoMode::Scale);
        addSeparator();

        addButton("GRID", EditorAction::ToggleGrid, true, scenePanel && scenePanel->IsGridVisible());
        addButton("FOCUS", EditorAction::FrameSelection);
        addButton("FULLSCREEN", EditorAction::ToggleFullscreen, true, workspace.IsFullscreen());

        // Title on the right-hand side of the bar.
        const std::string title = "ORBIT AUTHORING PLATFORM";
        const float titleX = ui.ViewportWidth() - EditorUI::TextWidth(title, EditorTheme::TextScale) - 14.0f;
        if (titleX > cursorX + 20.0f)
        {
            ui.Text(titleX, buttonY + 6.0f, title, EditorTheme::TextDisabled);
        }

        return action;
    }
}
