#include "engine/graphics/RenderSystem.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include <algorithm>

namespace platform
{
    RenderSystem::RenderSystem() = default;

    void RenderSystem::RenderScene(Registry &registry, Renderer &renderer, const Camera2D &camera)
    {
        m_renderQueue.clear();
        m_renderedCount = 0;

        BuildQueue(registry);
        SortQueue();
        SubmitCommands(renderer, camera);
    }

    void RenderSystem::BuildQueue(Registry &registry)
    {
        auto view = registry.GetView<TransformComponent, ShapeComponent, ActiveComponent>();
        view.Each([this, &registry](EntityID entity, TransformComponent &transform, ShapeComponent &shape, ActiveComponent &active) {
            if (!active.Enabled || !active.Visible)
            {
                return;
            }

            // Check VisibilityComponent if present
            if (const auto *vis = registry.GetComponent<VisibilityComponent>(entity))
            {
                if (!vis->Visible)
                {
                    return;
                }
            }

            RenderItem item;
            item.Entity = entity;
            item.WorldPosition = transform.Position;
            item.Rotation = transform.Rotation;
            item.Scale = transform.Scale;
            item.Shape = shape;

            if (const auto *layerComp = registry.GetComponent<RenderLayerComponent>(entity))
            {
                item.LayerID = layerComp->LayerID;
                item.OrderInLayer = layerComp->OrderInLayer;
            }

            m_renderQueue.push_back(item);
        });

        m_renderedCount = m_renderQueue.size();
    }

    void RenderSystem::SortQueue()
    {
        // Stable sorting: Layer -> Order -> EntityID
        std::stable_sort(m_renderQueue.begin(), m_renderQueue.end(), [](const RenderItem &a, const RenderItem &b) {
            if (a.LayerID != b.LayerID)
            {
                return a.LayerID < b.LayerID;
            }
            if (a.OrderInLayer != b.OrderInLayer)
            {
                return a.OrderInLayer < b.OrderInLayer;
            }
            return a.Entity < b.Entity;
        });
    }

    void RenderSystem::SubmitCommands(Renderer &renderer, const Camera2D &camera)
    {
        glm::vec2 camPos = camera.GetPosition();
        float zoom = camera.GetZoom();
        float halfW = camera.GetViewportWidth() * 0.5f;
        float halfH = camera.GetViewportHeight() * 0.5f;

        for (const auto &item : m_renderQueue)
        {
            // Transform world position into screen coordinates
            glm::vec2 screenPos;
            screenPos.x = (item.WorldPosition.x - camPos.x) * zoom + halfW;
            screenPos.y = (item.WorldPosition.y - camPos.y) * zoom + halfH;

            glm::vec2 scaledSize = item.Shape.Size * item.Scale * zoom;

            if (item.Shape.Type == ShapeType::Circle)
            {
                renderer.SubmitCommand(std::make_unique<DrawCircleCommand>(
                    screenPos,
                    item.Shape.Radius * std::max(item.Scale.x, item.Scale.y) * zoom,
                    item.Shape.Color,
                    item.Rotation
                ));
                continue;
            }

            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                screenPos,
                scaledSize,
                item.Rotation,
                item.Shape.Color
            ));
        }
    }
}
