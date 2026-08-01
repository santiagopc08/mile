#include "engine/gameplay/SpawnSystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"

namespace platform
{
    SpawnSystem::SpawnSystem() = default;

    void SpawnSystem::RespawnVehicle(Registry &registry, PhysicsWorld &physicsWorld, EntityID vehicleEntity, const glm::vec2 &spawnPosition)
    {
        auto *vTransform = registry.GetComponent<TransformComponent>(vehicleEntity);
        auto *vBody = registry.GetComponent<RigidBodyComponent>(vehicleEntity);
        auto *vComp = registry.GetComponent<VehicleComponent>(vehicleEntity);

        if (vTransform)
        {
            vTransform->SetPosition(spawnPosition);
            vTransform->SetRotation(0.0f);
        }

        if (vBody && vBody->RuntimeBodyHandle)
        {
            physicsWorld.SetBodyTransform(vBody->RuntimeBodyHandle, spawnPosition, 0.0f);
        }

        if (vComp)
        {
            for (EntityID wEntity : vComp->WheelEntities)
            {
                auto *wTransform = registry.GetComponent<TransformComponent>(wEntity);
                auto *wBody = registry.GetComponent<RigidBodyComponent>(wEntity);

                if (wTransform)
                {
                    wTransform->SetRotation(0.0f);
                }
                if (wBody && wBody->RuntimeBodyHandle)
                {
                    physicsWorld.SetBodyTransform(wBody->RuntimeBodyHandle, spawnPosition, 0.0f);
                }
            }
        }
    }
}
