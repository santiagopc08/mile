#ifndef PLATFORM_ENGINE_GAMEPLAY_RECOVERY_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_GAMEPLAY_RECOVERY_VALIDATION_CONTROLLER_HPP

#include "engine/gameplay/RecoverySettingsComponent.hpp"
#include "engine/gameplay/RecoveryRuntimeComponent.hpp"
#include "engine/gameplay/VehicleRecoverySystem.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/physics/PhysicsWorld.hpp"
#include <string>

namespace platform
{
    enum class RecoveryValidationState
    {
        Spawn,
        FlipVehicle,
        Wait,
        AutomaticRecovery,
        DriveForward,
        MoveOutsideBounds,
        AutomaticRecoveryBounds,
        Repeat
    };

    class RecoveryValidationController
    {
    public:
        RecoveryValidationController() = default;

        void Initialize();
        void Update(Registry &registry, PhysicsWorld &physicsWorld, VehicleRecoverySystem &recoverySystem, EntityID vehicleEntity, double dt);

        [[nodiscard]] RecoveryValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        RecoveryValidationState m_state{RecoveryValidationState::Spawn};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_RECOVERY_VALIDATION_CONTROLLER_HPP
