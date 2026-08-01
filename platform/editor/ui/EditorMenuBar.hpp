#ifndef PLATFORM_EDITOR_UI_EDITOR_MENU_BAR_HPP
#define PLATFORM_EDITOR_UI_EDITOR_MENU_BAR_HPP

#include "editor/app/EditorContext.hpp"
#include "editor/workspace/EditorWorkspace.hpp"

namespace platform
{
    /// Actions the toolbar can raise. The editor shell performs them so command
    /// handling lives in one place and can also be reached from keyboard shortcuts.
    enum class EditorAction
    {
        None = 0,
        NewEntity,
        DuplicateEntity,
        DeleteEntity,
        Undo,
        Redo,
        SaveScene,
        LoadScene,
        FrameSelection,
        ToggleGrid,
        ToggleFullscreen,
        GizmoTranslate,
        GizmoRotate,
        GizmoScale,
    };

    class EditorMenuBar
    {
    public:
        EditorMenuBar() = default;

        /// Draws the toolbar strip and returns the action the user triggered.
        EditorAction Render(EditorContext &context, EditorWorkspace &workspace);

        [[nodiscard]] static constexpr float Height() { return 40.0f; }
    };
}

#endif // PLATFORM_EDITOR_UI_EDITOR_MENU_BAR_HPP
