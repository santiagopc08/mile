#ifndef PLATFORM_ENGINE_GAMEPLAY_VEHICLE_RECOVERY_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_VEHICLE_RECOVERY_SYSTEM_HPP

#include "engine/gameplay/RecoverySettingsComponent.hpp"
#include "engine/gameplay/RecoveryRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/physics/PhysicsWorld.hpp"
#include "engine/gameplay/SpawnSystem.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/events/EventQueue.hpp"

namespace platform
{
    class VehicleRecoverySystem
    {
    public:
        VehicleRecoverySystem();

        void requestRecovery(RecoveryRuntimeComponent &runtime);
        void cancelRecovery(RecoveryRuntimeComponent &runtime);
        void recover(Registry &registry, PhysicsWorld &physicsWorld, EntityID vehicleEntity, RecoveryRuntimeComponent &runtime);
        void setRecoveryTransform(RecoveryRuntimeComponent &runtime, const glm::vec2 &position, float rotation = 0.0f);

        [[nodiscard]] float idleTime(const RecoveryRuntimeComponent &runtime) const { return runtime.idleTimer; }
        [[nodiscard]] float currentRoll(const RecoveryRuntimeComponent &runtime) const { return runtime.rollAngle; }
        [[nodiscard]] bool recoveryPending(const RecoveryRuntimeComponent &runtime) const { return runtime.recoveryPending; }
        [[nodiscard]] bool isRecovering(const RecoveryRuntimeComponent &runtime) const { return runtime.recovering; }
        [[nodiscard]] int recoveryCount(const RecoveryRuntimeComponent &runtime) const { return runtime.recoveryCount; }

        void Update(
            Registry &registry,
            PhysicsWorld &physicsWorld,
            EntityID vehicleEntity,
            const glm::vec2 &latestCheckpointPos,
            GameplayStateMachine &stateMachine,
            EventQueue *eventQueue
        );

        void UpdateSystem(Registry &registry, PhysicsWorld &physicsWorld, MatchState matchState, double dt);

    private:
        SpawnSystem m_spawnSystem;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_VEHICLE_RECOVERY_SYSTEM_HPP
