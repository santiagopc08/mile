#ifndef PLATFORM_EDITOR_PANELS_SCENE_PANEL_HPP
#define PLATFORM_EDITOR_PANELS_SCENE_PANEL_HPP

#include "editor/panels/EditorPanel.hpp"
#include "editor/gizmos/GizmoSystem.hpp"

namespace platform
{
    class ScenePanel : public EditorPanel
    {
    public:
        ScenePanel();

        void OnUpdate(EditorContext &context, double dt) override;
        void OnRender(EditorContext &context) override;
        [[nodiscard]] const std::string &GetName() const override { return m_name; }

        [[nodiscard]] GizmoSystem &GetGizmos() { return m_gizmos; }

        /// Convert between the viewport's screen space and scene world space.
        [[nodiscard]] glm::vec2 ScreenToWorld(const EditorContext &context, const glm::vec2 &screen) const;
        [[nodiscard]] glm::vec2 WorldToScreen(const EditorContext &context, const glm::vec2 &world) const;

        /// Topmost entity whose shape contains the world point, or kNullEntity.
        [[nodiscard]] static EntityID PickEntity(EditorContext &context, const glm::vec2 &world);

        void SetGridVisible(bool visible) { m_showGrid = visible; }
        [[nodiscard]] bool IsGridVisible() const { return m_showGrid; }
        void FrameSelection(EditorContext &context);

    private:
        void DrawGrid(EditorContext &context, const UIRect &content) const;
        void HandleInteraction(EditorContext &context, const UIRect &content);

        std::string m_name{"Scene Viewport"};
        GizmoSystem m_gizmos;
        bool m_showGrid{true};
        bool m_dragging{false};
        bool m_panning{false};
        glm::vec2 m_dragOffset{0.0f, 0.0f};
        glm::vec2 m_lastMouse{0.0f, 0.0f};
        glm::vec2 m_hoverWorld{0.0f, 0.0f};
    };
}

#endif // PLATFORM_EDITOR_PANELS_SCENE_PANEL_HPP
