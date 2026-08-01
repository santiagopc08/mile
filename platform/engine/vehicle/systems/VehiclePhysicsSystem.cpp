#include "engine/vehicle/systems/VehiclePhysicsSystem.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/WheelComponent.hpp"
#include "engine/vehicle/components/SuspensionComponent.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/scene/components/Components.hpp"

namespace platform
{
    VehiclePhysicsSystem::VehiclePhysicsSystem() = default;

    void VehiclePhysicsSystem::Update(Registry &registry, PhysicsWorld &physicsWorld, const ActionContext &actionContext, double dt)
    {
        (void)physicsWorld;
        auto view = registry.GetView<TransformComponent, VehicleComponent, RigidBodyComponent, ActiveComponent>();

        view.Each([this, &registry, &actionContext, dt](EntityID vehicleEntity, TransformComponent &chassisTransform, VehicleComponent &vehicle, RigidBodyComponent &chassisBody, ActiveComponent &active) {
            (void)vehicleEntity;
            if (!active.Enabled)
            {
                return;
            }

            // 1. Controller Update
            m_controller.Update(vehicle, actionContext);

            // 2. Average wheel speed computation
            float totalSpeed = 0.0f;
            int count = 0;
            for (EntityID wEntity : vehicle.WheelEntities)
            {
                if (auto *wComp = registry.GetComponent<WheelComponent>(wEntity))
                {
                    totalSpeed += wComp->State.LinearVelocity;
                    count++;
                }
            }
            float avgSpeed = (count > 0) ? (totalSpeed / static_cast<float>(count)) : 0.0f;

            // 3. Powertrain Update
            m_powertrain.Update(vehicle, avgSpeed, dt);

            // 4. Update Vehicle Speed and Wheel Positions
            vehicle.State.SpeedKmh = std::abs(avgSpeed) * 3.6f;
            vehicle.State.GroundedWheelCount = count;

            // Update wheel positions relative to chassis
            for (EntityID wEntity : vehicle.WheelEntities)
            {
                if (auto *wTransform = registry.GetComponent<TransformComponent>(wEntity))
                {
                    if (auto *wComp = registry.GetComponent<WheelComponent>(wEntity))
                    {
                        glm::vec2 targetPos = chassisTransform.Position + wComp->Config.LocalOffset;
                        wTransform->SetPosition(targetPos);
                    }
                }
            }
        });
    }
}
