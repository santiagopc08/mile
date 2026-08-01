#include "editor/gizmos/GizmoSystem.hpp"
#include "engine/graphics/Camera2D.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/core/Logger.hpp"

#include <cmath>

namespace platform
{
    void GizmoSystem::RenderGizmos(EditorContext &context)
    {
        if (m_mode == GizmoMode::None) return;

        const auto &selection = context.Selection.GetSelection();
        if (selection.Type != SelectionType::Entity || selection.Entity == kNullEntity || !context.ActiveScene)
        {
            return;
        }

        auto *transform = context.ActiveScene->GetRegistry().GetComponent<TransformComponent>(selection.Entity);
        if (!transform)
        {
            return;
        }

        if (!context.UI || !context.Camera)
        {
            // Headless mode still reports what would be drawn.
            switch (m_mode)
            {
            case GizmoMode::Translate:
                LOG_INFO("[GizmoSystem] Rendered Translate Gizmo at ({:.2f}, {:.2f}).", transform->Position.x, transform->Position.y);
                break;
            case GizmoMode::Rotate:
                LOG_INFO("[GizmoSystem] Rendered Rotate Gizmo at {:.2f} deg.", transform->Rotation);
                break;
            case GizmoMode::Scale:
                LOG_INFO("[GizmoSystem] Rendered Scale Gizmo ({:.2f}, {:.2f}).", transform->Scale.x, transform->Scale.y);
                break;
            case GizmoMode::Bounds:
                LOG_INFO("[GizmoSystem] Rendered Bounding Box Gizmo.");
                break;
            case GizmoMode::Pivot:
                LOG_INFO("[GizmoSystem] Rendered Pivot Point Gizmo.");
                break;
            default:
                break;
            }
            return;
        }

        auto &ui = *context.UI;
        const float zoom = context.Camera->GetZoom();
        const glm::vec2 center = m_viewport.Center();
        const glm::vec2 screen = (transform->Position - context.Camera->GetPosition()) * zoom + center;

        // Selection bounds.
        glm::vec2 size{60.0f, 60.0f};
        if (const auto *shape = context.ActiveScene->GetRegistry().GetComponent<ShapeComponent>(selection.Entity))
        {
            size = glm::abs(shape->Size * transform->Scale);
        }
        const glm::vec2 screenSize = size * zoom;
        const UIRect bounds{
            screen.x - screenSize.x * 0.5f - 3.0f,
            screen.y - screenSize.y * 0.5f - 3.0f,
            screenSize.x + 6.0f,
            screenSize.y + 6.0f,
        };
        ui.RectOutline(bounds, EditorTheme::Accent, 2.0f);

        // Corner ticks make the selection readable even on tiny shapes.
        constexpr float tick = 7.0f;
        ui.Rect({bounds.X - 2.0f, bounds.Y - 2.0f, tick, 3.0f}, EditorTheme::Accent);
        ui.Rect({bounds.X - 2.0f, bounds.Y - 2.0f, 3.0f, tick}, EditorTheme::Accent);
        ui.Rect({bounds.Right() - tick + 2.0f, bounds.Y - 2.0f, tick, 3.0f}, EditorTheme::Accent);
        ui.Rect({bounds.Right() - 1.0f, bounds.Y - 2.0f, 3.0f, tick}, EditorTheme::Accent);
        ui.Rect({bounds.X - 2.0f, bounds.Bottom() - 1.0f, tick, 3.0f}, EditorTheme::Accent);
        ui.Rect({bounds.X - 2.0f, bounds.Bottom() - tick + 2.0f, 3.0f, tick}, EditorTheme::Accent);
        ui.Rect({bounds.Right() - tick + 2.0f, bounds.Bottom() - 1.0f, tick, 3.0f}, EditorTheme::Accent);
        ui.Rect({bounds.Right() - 1.0f, bounds.Bottom() - tick + 2.0f, 3.0f, tick}, EditorTheme::Accent);

        switch (m_mode)
        {
        case GizmoMode::Translate:
        {
            constexpr float armLength = 46.0f;
            ui.Line(screen, {screen.x + armLength, screen.y}, EditorTheme::Danger);
            ui.Rect({screen.x + armLength - 5.0f, screen.y - 4.0f, 9.0f, 9.0f}, EditorTheme::Danger);
            ui.Line(screen, {screen.x, screen.y + armLength}, EditorTheme::Success);
            ui.Rect({screen.x - 4.0f, screen.y + armLength - 5.0f, 9.0f, 9.0f}, EditorTheme::Success);
            ui.Rect({screen.x - 3.0f, screen.y - 3.0f, 7.0f, 7.0f}, EditorTheme::Warning);
            break;
        }
        case GizmoMode::Rotate:
        {
            constexpr float radius = 44.0f;
            constexpr int segments = 28;
            glm::vec2 previous{screen.x + radius, screen.y};
            for (int i = 1; i <= segments; ++i)
            {
                const float angle = static_cast<float>(i) / static_cast<float>(segments) * 6.28318530718f;
                const glm::vec2 point{screen.x + std::cos(angle) * radius, screen.y + std::sin(angle) * radius};
                ui.Line(previous, point, EditorTheme::Warning);
                previous = point;
            }
            const float handleAngle = transform->Rotation * 0.01745329252f;
            ui.Line(screen, {screen.x + std::cos(handleAngle) * radius, screen.y + std::sin(handleAngle) * radius},
                    EditorTheme::Accent);
            break;
        }
        case GizmoMode::Scale:
        {
            constexpr float armLength = 42.0f;
            ui.Line(screen, {screen.x + armLength, screen.y}, EditorTheme::Danger);
            ui.Rect({screen.x + armLength - 6.0f, screen.y - 6.0f, 12.0f, 12.0f}, EditorTheme::Danger);
            ui.Line(screen, {screen.x, screen.y + armLength}, EditorTheme::Success);
            ui.Rect({screen.x - 6.0f, screen.y + armLength - 6.0f, 12.0f, 12.0f}, EditorTheme::Success);
            break;
        }
        case GizmoMode::Pivot:
            ui.Rect({screen.x - 4.0f, screen.y - 4.0f, 9.0f, 9.0f}, EditorTheme::Warning);
            break;
        case GizmoMode::Bounds:
        default:
            break;
        }
    }
}
