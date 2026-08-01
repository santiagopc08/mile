#ifndef PLATFORM_EDITOR_GIZMOS_GIZMO_SYSTEM_HPP
#define PLATFORM_EDITOR_GIZMOS_GIZMO_SYSTEM_HPP

#include "editor/gizmos/GizmoTypes.hpp"
#include "editor/app/EditorContext.hpp"
#include "editor/ui/EditorUI.hpp"
#include <glm/glm.hpp>

namespace platform
{
    class GizmoSystem
    {
    public:
        GizmoSystem() = default;

        void RenderGizmos(EditorContext &context);

        void SetMode(GizmoMode mode) { m_mode = mode; }
        [[nodiscard]] GizmoMode GetMode() const { return m_mode; }

        void SetActiveAxis(GizmoAxis axis) { m_activeAxis = axis; }
        [[nodiscard]] GizmoAxis GetActiveAxis() const { return m_activeAxis; }

        /// Viewport the gizmo draws into; the scene panel refreshes this each frame.
        void SetViewportRect(const UIRect &rect) { m_viewport = rect; }
        [[nodiscard]] const UIRect &GetViewportRect() const { return m_viewport; }

    private:
        GizmoMode m_mode{GizmoMode::Translate};
        GizmoAxis m_activeAxis{GizmoAxis::None};
        UIRect m_viewport{};
    };
}

#endif // PLATFORM_EDITOR_GIZMOS_GIZMO_SYSTEM_HPP
