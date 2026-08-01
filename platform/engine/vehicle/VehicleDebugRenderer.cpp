#include "engine/vehicle/VehicleDebugRenderer.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/WheelComponent.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/graphics/RenderCommand.hpp"

namespace platform
{
    VehicleDebugRenderer::VehicleDebugRenderer() = default;

    void VehicleDebugRenderer::RenderDebug(Registry &registry, Renderer &renderer, const Camera2D &camera)
    {
        if (!m_enabled)
        {
            return;
        }

        glm::vec2 camPos = camera.GetPosition();
        float zoom = camera.GetZoom();
        float halfW = camera.GetViewportWidth() * 0.5f;
        float halfH = camera.GetViewportHeight() * 0.5f;

        auto view = registry.GetView<TransformComponent, VehicleComponent, ActiveComponent>();
        view.Each([&renderer, &registry, camPos, zoom, halfW, halfH](EntityID entity, TransformComponent &chassisTransform, VehicleComponent &vehicle, ActiveComponent &active) {
            (void)entity;
            if (!active.Enabled || !active.Visible)
            {
                return;
            }

            // Chassis Center of Mass indicator (Yellow marker)
            glm::vec2 chassisScreenPos;
            chassisScreenPos.x = (chassisTransform.Position.x - camPos.x) * zoom + halfW;
            chassisScreenPos.y = (chassisTransform.Position.y - camPos.y) * zoom + halfH;

            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                chassisScreenPos,
                glm::vec2(8.0f, 8.0f) * zoom,
                0.0f,
                glm::vec4(1.0f, 0.9f, 0.1f, 1.0f)
            ));

            // Wheel Centers & Travel visualization (Cyan markers)
            for (EntityID wEntity : vehicle.WheelEntities)
            {
                if (auto *wTransform = registry.GetComponent<TransformComponent>(wEntity))
                {
                    glm::vec2 wScreenPos;
                    wScreenPos.x = (wTransform->Position.x - camPos.x) * zoom + halfW;
                    wScreenPos.y = (wTransform->Position.y - camPos.y) * zoom + halfH;

                    renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                        wScreenPos,
                        glm::vec2(6.0f, 6.0f) * zoom,
                        0.0f,
                        glm::vec4(0.2f, 0.9f, 0.9f, 1.0f)
                    ));
                }
            }
        });
    }
}
