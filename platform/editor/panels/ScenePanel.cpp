#include "editor/panels/ScenePanel.hpp"

#include "engine/core/Logger.hpp"
#include "engine/graphics/Camera2D.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/input/Input.hpp"
#include "engine/scene/components/Components.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <vector>

namespace platform
{
    namespace
    {
        constexpr float kMinZoom = 0.15f;
        constexpr float kMaxZoom = 4.0f;

        struct DrawItem
        {
            EntityID Entity{kNullEntity};
            glm::vec2 Position{0.0f, 0.0f};
            glm::vec2 Size{0.0f, 0.0f};
            float Rotation{0.0f};
            glm::vec4 Color{1.0f, 1.0f, 1.0f, 1.0f};
            int Layer{0};
            bool Circle{false};
        };

        std::string Coordinate(const glm::vec2 &value)
        {
            char buffer[64];
            std::snprintf(buffer, sizeof(buffer), "%.0f, %.0f", static_cast<double>(value.x), static_cast<double>(value.y));
            return std::string(buffer);
        }

        std::string Percent(float zoom)
        {
            char buffer[32];
            std::snprintf(buffer, sizeof(buffer), "%.0f%%", static_cast<double>(zoom * 100.0f));
            return std::string(buffer);
        }

        /// Collects every drawable entity, sorted back-to-front.
        std::vector<DrawItem> CollectDrawItems(Registry &registry)
        {
            std::vector<DrawItem> items;
            for (EntityID entity : registry.GetAliveEntities())
            {
                const auto *transform = registry.GetComponent<TransformComponent>(entity);
                const auto *shape = registry.GetComponent<ShapeComponent>(entity);
                if (!transform || !shape)
                {
                    continue;
                }

                DrawItem item;
                item.Entity = entity;
                item.Position = transform->Position;
                item.Size = shape->Size * transform->Scale;
                item.Rotation = transform->Rotation;
                item.Color = shape->Color;
                item.Circle = shape->Type == ShapeType::Circle;
                if (item.Circle)
                {
                    const float diameter = shape->Radius * 2.0f;
                    item.Size = glm::vec2{diameter, diameter} * transform->Scale;
                }
                if (const auto *layer = registry.GetComponent<RenderLayerComponent>(entity))
                {
                    item.Layer = layer->LayerID;
                }

                const auto *visibility = registry.GetComponent<VisibilityComponent>(entity);
                const auto *active = registry.GetComponent<ActiveComponent>(entity);
                const bool hidden = (visibility && !visibility->Visible) || (active && (!active->Enabled || !active->Visible));
                if (hidden)
                {
                    item.Color.a *= 0.22f; // ghosted rather than gone, so it stays pickable
                }

                items.push_back(item);
            }

            std::stable_sort(items.begin(), items.end(), [](const DrawItem &a, const DrawItem &b) {
                return a.Layer != b.Layer ? a.Layer < b.Layer : a.Entity < b.Entity;
            });
            return items;
        }
    }

    ScenePanel::ScenePanel() = default;

    glm::vec2 ScenePanel::ScreenToWorld(const EditorContext &context, const glm::vec2 &screen) const
    {
        if (!context.Camera)
        {
            return screen;
        }
        const glm::vec2 center = m_bounds.Center();
        return (screen - center) / context.Camera->GetZoom() + context.Camera->GetPosition();
    }

    glm::vec2 ScenePanel::WorldToScreen(const EditorContext &context, const glm::vec2 &world) const
    {
        if (!context.Camera)
        {
            return world;
        }
        const glm::vec2 center = m_bounds.Center();
        return (world - context.Camera->GetPosition()) * context.Camera->GetZoom() + center;
    }

    EntityID ScenePanel::PickEntity(EditorContext &context, const glm::vec2 &world)
    {
        if (!context.ActiveScene)
        {
            return kNullEntity;
        }

        auto &registry = context.ActiveScene->GetRegistry();
        const auto items = CollectDrawItems(registry);

        // Front-to-back so the topmost shape wins.
        for (auto it = items.rbegin(); it != items.rend(); ++it)
        {
            const glm::vec2 half = glm::abs(it->Size) * 0.5f;
            if (std::abs(world.x - it->Position.x) <= half.x && std::abs(world.y - it->Position.y) <= half.y)
            {
                return it->Entity;
            }
        }
        return kNullEntity;
    }

    void ScenePanel::FrameSelection(EditorContext &context)
    {
        if (!context.Camera || !context.ActiveScene)
        {
            return;
        }

        const auto &selection = context.Selection.GetSelection();
        if (selection.Type == SelectionType::Entity)
        {
            if (auto *transform = context.ActiveScene->GetRegistry().GetComponent<TransformComponent>(selection.Entity))
            {
                context.Camera->SetPosition(transform->Position);
                context.Camera->SetZoom(1.0f);
                return;
            }
        }

        context.Camera->SetPosition({0.0f, 0.0f});
        context.Camera->SetZoom(1.0f);
    }

    void ScenePanel::OnUpdate(EditorContext &context, double dt)
    {
        (void)dt;
        (void)context;
    }

    void ScenePanel::DrawGrid(EditorContext &context, const UIRect &content) const
    {
        if (!m_showGrid || !context.UI || !context.Camera)
        {
            return;
        }

        auto &ui = *context.UI;
        const float zoom = context.Camera->GetZoom();

        // Grid spacing adapts to zoom so lines never collapse into a solid block.
        float spacing = 100.0f;
        while (spacing * zoom < 40.0f) spacing *= 2.0f;
        while (spacing * zoom > 220.0f) spacing *= 0.5f;

        const glm::vec2 topLeftWorld = ScreenToWorld(context, {content.X, content.Y});
        const glm::vec2 bottomRightWorld = ScreenToWorld(context, {content.Right(), content.Bottom()});

        for (float x = std::floor(topLeftWorld.x / spacing) * spacing; x <= bottomRightWorld.x; x += spacing)
        {
            const float screenX = WorldToScreen(context, {x, 0.0f}).x;
            const bool axis = std::abs(x) < 0.001f;
            ui.Line({screenX, content.Y}, {screenX, content.Bottom()}, axis ? EditorTheme::GridAxis : EditorTheme::Grid);
        }

        for (float y = std::floor(topLeftWorld.y / spacing) * spacing; y <= bottomRightWorld.y; y += spacing)
        {
            const float screenY = WorldToScreen(context, {0.0f, y}).y;
            const bool axis = std::abs(y) < 0.001f;
            ui.Line({content.X, screenY}, {content.Right(), screenY}, axis ? EditorTheme::GridAxis : EditorTheme::Grid);
        }
    }

    void ScenePanel::HandleInteraction(EditorContext &context, const UIRect &content)
    {
        auto &ui = *context.UI;
        const glm::vec2 mouse = ui.MousePosition();
        const bool hovered = content.Contains(mouse);
        m_hoverWorld = ScreenToWorld(context, mouse);

        if (!context.Camera)
        {
            return;
        }

        // Zoom around the cursor so the point under the mouse stays put.
        if (hovered && ui.ScrollDelta() != 0.0f)
        {
            const glm::vec2 anchorWorld = m_hoverWorld;
            const float zoom = std::clamp(context.Camera->GetZoom() * (1.0f + ui.ScrollDelta() * 0.12f), kMinZoom, kMaxZoom);
            context.Camera->SetZoom(zoom);
            const glm::vec2 afterWorld = ScreenToWorld(context, mouse);
            context.Camera->SetPosition(context.Camera->GetPosition() + (anchorWorld - afterWorld));
        }

        // Middle mouse (or right mouse) pans the viewport.
        const bool panButtonDown = context.Device
            && (context.Device->IsMouseButtonHeld(MouseButton::Middle) || context.Device->IsMouseButtonPressed(MouseButton::Middle)
                || context.Device->IsMouseButtonHeld(MouseButton::Right) || context.Device->IsMouseButtonPressed(MouseButton::Right));

        if (panButtonDown && (hovered || m_panning))
        {
            if (m_panning)
            {
                const glm::vec2 delta = (mouse - m_lastMouse) / context.Camera->GetZoom();
                context.Camera->SetPosition(context.Camera->GetPosition() - delta);
            }
            m_panning = true;
        }
        else
        {
            m_panning = false;
        }
        m_lastMouse = mouse;

        auto &registry = context.ActiveScene->GetRegistry();
        const auto &selection = context.Selection.GetSelection();

        // Left click: pick, then drag the picked entity.
        if (hovered && ui.ClickAvailable())
        {
            ui.ConsumeClick();
            const EntityID picked = PickEntity(context, m_hoverWorld);
            if (picked != kNullEntity)
            {
                std::string name = "Entity #" + std::to_string(picked);
                if (auto *nameComp = registry.GetComponent<NameComponent>(picked))
                {
                    name = nameComp->Name;
                }
                context.Selection.SetEntitySelection(picked, name);

                if (auto *transform = registry.GetComponent<TransformComponent>(picked))
                {
                    m_dragging = true;
                    m_dragOffset = transform->Position - m_hoverWorld;
                }
            }
            else
            {
                context.Selection.Clear();
                m_dragging = false;
            }
        }

        if (m_dragging)
        {
            if (!ui.MouseHeld() || selection.Type != SelectionType::Entity)
            {
                m_dragging = false;
            }
            else if (auto *transform = registry.GetComponent<TransformComponent>(selection.Entity))
            {
                transform->SetPosition(m_hoverWorld + m_dragOffset);
            }
        }
    }

    void ScenePanel::OnRender(EditorContext &context)
    {
        if (!m_visible)
        {
            return;
        }

        if (!context.UI || !context.ActiveScene)
        {
            LOG_INFO("[ScenePanel] Rendered 2D Viewport.");
            m_gizmos.RenderGizmos(context);
            return;
        }

        auto &ui = *context.UI;
        const UIRect content = m_bounds;

        // Keep the scene camera centred on the viewport rather than the whole window:
        // the render maths uses half the camera viewport as the screen origin.
        if (context.Camera)
        {
            const glm::vec2 center = content.Center();
            context.Camera->SetViewport(center.x * 2.0f, center.y * 2.0f);
        }

        HandleInteraction(context, content);

        ui.Rect(content, EditorTheme::ViewportBackground);
        ui.PushClip(content);

        DrawGrid(context, content);

        auto &registry = context.ActiveScene->GetRegistry();
        const auto items = CollectDrawItems(registry);
        const float zoom = context.Camera ? context.Camera->GetZoom() : 1.0f;

        for (const auto &item : items)
        {
            const glm::vec2 screenPos = WorldToScreen(context, item.Position);
            const glm::vec2 screenSize = item.Size * zoom;
            if (screenPos.x + screenSize.x * 0.5f < content.X || screenPos.x - screenSize.x * 0.5f > content.Right()
                || screenPos.y + screenSize.y * 0.5f < content.Y || screenPos.y - screenSize.y * 0.5f > content.Bottom())
            {
                continue; // outside the viewport
            }

            if (item.Circle)
            {
                ui.Circle(screenPos, std::max(screenSize.x, screenSize.y) * 0.5f, item.Color);
            }
            else
            {
                ui.Rect({screenPos.x - screenSize.x * 0.5f, screenPos.y - screenSize.y * 0.5f, screenSize.x, screenSize.y},
                        item.Color);
            }
        }

        m_gizmos.SetViewportRect(content);
        m_gizmos.RenderGizmos(context);
        ui.ClearClip();

        ui.RectOutline(content, EditorTheme::PanelBorder);

        // Viewport HUD.
        ui.Rect({content.X, content.Y, content.Width, 24.0f}, {0.06f, 0.08f, 0.11f, 0.85f});
        ui.TextClipped(content, content.X + 10.0f, content.Y + 7.0f,
                       "SCENE  " + context.ActiveScene->GetMetadata().Name, EditorTheme::TextMuted);
        const std::string readout = "ZOOM " + Percent(zoom) + "   " + Coordinate(m_hoverWorld);
        ui.TextClipped(content, content.Right() - EditorUI::TextWidth(readout) - 12.0f, content.Y + 7.0f,
                       readout, EditorTheme::TextDisabled);

        if (items.empty())
        {
            ui.TextClipped(content, content.X + 20.0f, content.Center().y - 8.0f,
                           "Nothing to draw yet - create an entity and give it a shape.", EditorTheme::TextDisabled);
        }
    }
}
