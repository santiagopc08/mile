#include "engine/gameplay/VehicleRecoverySystem.hpp"
#include "engine/gameplay/GameplayEvents.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/core/Logger.hpp"
#include <cmath>

namespace platform
{
    VehicleRecoverySystem::VehicleRecoverySystem() = default;

    void VehicleRecoverySystem::requestRecovery(RecoveryRuntimeComponent &runtime)
    {
        runtime.recoveryPending = true;
    }

    void VehicleRecoverySystem::cancelRecovery(RecoveryRuntimeComponent &runtime)
    {
        runtime.recoveryPending = false;
    }

    void VehicleRecoverySystem::setRecoveryTransform(RecoveryRuntimeComponent &runtime, const glm::vec2 &position, float rotation)
    {
        runtime.spawnPosition = position;
        runtime.spawnRotation = rotation;
    }

    void VehicleRecoverySystem::recover(Registry &registry, PhysicsWorld &physicsWorld, EntityID vehicleEntity, RecoveryRuntimeComponent &runtime)
    {
        runtime.recovering = true;

        // Restore vehicle body and children transform & physics velocity
        auto *vComp = registry.GetComponent<VehicleComponent>(vehicleEntity);
        EntityID bodyEntity = (vComp && vComp->body != kNullEntity) ? vComp->body : vehicleEntity;

        auto *tComp = registry.GetComponent<TransformComponent>(bodyEntity);
        if (tComp)
        {
            tComp->Position = runtime.spawnPosition;
            tComp->Rotation = runtime.spawnRotation;
        }

        auto *rbComp = registry.GetComponent<RigidBodyComponent>(bodyEntity);
        if (rbComp)
        {
            rbComp->LinearVelocity = {0.0f, 0.0f};
            rbComp->AngularVelocity = 0.0f;
            if (rbComp->RuntimeBodyHandle)
            {
                physicsWorld.SetBodyTransform(rbComp->RuntimeBodyHandle, runtime.spawnPosition, runtime.spawnRotation);
            }
        }

        runtime.idleTimer = 0.0f;
        runtime.rollAngle = 0.0f;
        runtime.recoveryPending = false;
        runtime.recovering = false;
        runtime.recoveryCount++;

        LOG_INFO("[VehicleRecoverySystem] Recovered vehicle entity #{} to ({:.1f}, {:.1f}). Total recoveries: {}.",
                 vehicleEntity, runtime.spawnPosition.x, runtime.spawnPosition.y, runtime.recoveryCount);
    }

    void VehicleRecoverySystem::Update(
        Registry &registry,
        PhysicsWorld &physicsWorld,
        EntityID vehicleEntity,
        const glm::vec2 &latestCheckpointPos,
        GameplayStateMachine &stateMachine,
        EventQueue *eventQueue
    )
    {
        (void)eventQueue;
        auto *rComp = registry.GetComponent<RecoveryRuntimeComponent>(vehicleEntity);
        if (!rComp)
        {
            rComp = &registry.AddComponent<RecoveryRuntimeComponent>(vehicleEntity);
        }

        auto *tComp = registry.GetComponent<TransformComponent>(vehicleEntity);
        float rotation = tComp ? std::abs(tComp->Rotation) : 0.0f;

        if (rotation > 90.0f || rComp->recoveryPending)
        {
            rComp->spawnPosition = latestCheckpointPos;
            recover(registry, physicsWorld, vehicleEntity, *rComp);
            stateMachine.GetMetrics().RespawnCount++;
        }
    }

    void VehicleRecoverySystem::UpdateSystem(Registry &registry, PhysicsWorld &physicsWorld, MatchState matchState, double dt)
    {
        // Recovery permitted in Playing state; suspended in Paused; disabled in Loading/Completed
        if (matchState == MatchState::Loading || matchState == MatchState::Completed)
        {
            return;
        }
        if (matchState == MatchState::Paused)
        {
            return;
        }

        float delta = static_cast<float>(dt);
        auto view = registry.GetView<RecoverySettingsComponent, RecoveryRuntimeComponent, TransformComponent>();

        view.Each([this, &registry, &physicsWorld, delta](EntityID entity, RecoverySettingsComponent &settings, RecoveryRuntimeComponent &runtime, TransformComponent &transform) {
            if (!settings.enabled)
            {
                return;
            }

            // Calculate Roll Angle
            runtime.rollAngle = std::abs(transform.Rotation);

            // Upside Down detection (> maxRollAngle)
            bool upsideDown = runtime.rollAngle >= settings.maxRollAngle;

            // Immobilized detection
            auto *rbComp = registry.GetComponent<RigidBodyComponent>(entity);
            float speed = rbComp ? glm::length(rbComp->LinearVelocity) : 0.0f;
            if (speed < settings.minimumVelocity)
            {
                runtime.idleTimer += delta;
            }
            else
            {
                runtime.idleTimer = 0.0f;
            }

            bool immobilized = runtime.idleTimer >= settings.maxIdleTime;

            // Out of bounds detection
            bool outOfBounds = transform.Position.y > 2000.0f || transform.Position.x < -2000.0f;

            if (upsideDown || immobilized || outOfBounds || runtime.recoveryPending)
            {
                recover(registry, physicsWorld, entity, runtime);
            }
        });
    }
}
