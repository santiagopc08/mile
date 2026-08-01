#include "engine/physics/PhysicsDebugRenderer.hpp"
#include "engine/physics/components/ColliderComponent.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/vehicle/components/WheelJointComponent.hpp"
#include "engine/vehicle/components/SuspensionComponent.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    PhysicsDebugRenderer::PhysicsDebugRenderer() = default;

    void PhysicsDebugRenderer::RenderDebug(Registry &registry, Renderer &renderer, const Camera2D &camera, const PhysicsWorld &physicsWorld)
    {
        (void)physicsWorld;
        if (!m_enabled)
        {
            return;
        }

        glm::vec2 camPos = camera.GetPosition();
        float zoom = camera.GetZoom();
        float halfW = camera.GetViewportWidth() * 0.5f;
        float halfH = camera.GetViewportHeight() * 0.5f;

        // 1. Render Colliders
        auto view = registry.GetView<TransformComponent, ColliderComponent, ActiveComponent>();
        view.Each([&renderer, camPos, zoom, halfW, halfH](EntityID entity, TransformComponent &transform, ColliderComponent &collider, ActiveComponent &active) {
            (void)entity;
            if (!active.Enabled || !active.Visible)
            {
                return;
            }

            glm::vec2 worldPos = transform.Position + collider.Offset;
            glm::vec2 screenPos;
            screenPos.x = (worldPos.x - camPos.x) * zoom + halfW;
            screenPos.y = (worldPos.y - camPos.y) * zoom + halfH;

            glm::vec2 scaledSize = collider.Size * transform.Scale * zoom;

            // Debug green/yellow wireframe/overlay color
            glm::vec4 debugColor = collider.IsSensor
                ? glm::vec4(0.9f, 0.9f, 0.2f, 0.6f) // Sensor Yellow
                : glm::vec4(0.2f, 0.9f, 0.2f, 0.6f); // Body Green

            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                screenPos,
                scaledSize,
                transform.Rotation,
                debugColor
            ));
        });

        // 2. Render Physics Joint Anchors & Connections
        auto jointView = registry.GetView<TransformComponent, WheelJointComponent>();
        jointView.Each([&renderer, camPos, zoom, halfW, halfH](EntityID entity, TransformComponent &transform, WheelJointComponent &joint) {
            (void)entity;
            if (!joint.enabled)
            {
                return;
            }

            glm::vec2 worldPos = transform.Position;
            glm::vec2 screenPos;
            screenPos.x = (worldPos.x - camPos.x) * zoom + halfW;
            screenPos.y = (worldPos.y - camPos.y) * zoom + halfH;

            // Joint anchor marker (Magenta circle/crosshair)
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                screenPos,
                glm::vec2(10.0f, 10.0f),
                0.0f,
                glm::vec4(1.0f, 0.2f, 0.8f, 0.9f)
            ));
        });

        // 3. Render Suspension Axis & Spring Lines (GAME-001-MS003)
        auto suspView = registry.GetView<TransformComponent, SuspensionComponent>();
        suspView.Each([&renderer, camPos, zoom, halfW, halfH](EntityID entity, TransformComponent &transform, SuspensionComponent &susp) {
            (void)entity;
            if (!susp.enabled)
            {
                return;
            }

            glm::vec2 startPos = transform.Position;
            glm::vec2 endPos = startPos + susp.axis * (susp.restLength - susp.State.Compression);

            glm::vec2 screenStart;
            screenStart.x = (startPos.x - camPos.x) * zoom + halfW;
            screenStart.y = (startPos.y - camPos.y) * zoom + halfH;

            glm::vec2 screenEnd;
            screenEnd.x = (endPos.x - camPos.x) * zoom + halfW;
            screenEnd.y = (endPos.y - camPos.y) * zoom + halfH;

            // Spring line overlay (Cyan spring line)
            glm::vec2 center = (screenStart + screenEnd) * 0.5f;
            glm::vec2 length = glm::vec2(4.0f, glm::distance(screenStart, screenEnd));

            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                center,
                length,
                0.0f,
                glm::vec4(0.2f, 0.8f, 1.0f, 0.8f) // Suspension Cyan
            ));
        });
    }
}
