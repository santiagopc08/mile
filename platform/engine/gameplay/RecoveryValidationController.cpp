#include "engine/gameplay/RecoveryValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void RecoveryValidationController::Initialize()
    {
        m_state = RecoveryValidationState::Spawn;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[RecoveryValidationController] Initialized autonomous recovery validation sequence.");
    }

    std::string RecoveryValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case RecoveryValidationState::Spawn: return "Spawn";
        case RecoveryValidationState::FlipVehicle: return "FlipVehicle";
        case RecoveryValidationState::Wait: return "Wait";
        case RecoveryValidationState::AutomaticRecovery: return "AutomaticRecovery";
        case RecoveryValidationState::DriveForward: return "DriveForward";
        case RecoveryValidationState::MoveOutsideBounds: return "MoveOutsideBounds";
        case RecoveryValidationState::AutomaticRecoveryBounds: return "AutomaticRecoveryBounds";
        case RecoveryValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void RecoveryValidationController::Update(Registry &registry, PhysicsWorld &physicsWorld, VehicleRecoverySystem &recoverySystem, EntityID vehicleEntity, double dt)
    {
        m_stateTimer += dt;
        auto *rComp = registry.GetComponent<RecoveryRuntimeComponent>(vehicleEntity);
        auto *tComp = registry.GetComponent<TransformComponent>(vehicleEntity);

        switch (m_state)
        {
        case RecoveryValidationState::Spawn:
            if (m_stateTimer >= 0.1)
            {
                m_state = RecoveryValidationState::FlipVehicle;
                m_stateTimer = 0.0;
                LOG_INFO("[RecoveryValidationController] Transitioned -> FlipVehicle");
            }
            break;

        case RecoveryValidationState::FlipVehicle:
            if (tComp) tComp->Rotation = 180.0f; // Flip upside down
            m_state = RecoveryValidationState::Wait;
            m_stateTimer = 0.0;
            LOG_INFO("[RecoveryValidationController] Transitioned -> Wait");
            break;

        case RecoveryValidationState::Wait:
            if (m_stateTimer >= 0.1)
            {
                m_state = RecoveryValidationState::AutomaticRecovery;
                m_stateTimer = 0.0;
                LOG_INFO("[RecoveryValidationController] Transitioned -> AutomaticRecovery");
            }
            break;

        case RecoveryValidationState::AutomaticRecovery:
            if (rComp) recoverySystem.recover(registry, physicsWorld, vehicleEntity, *rComp);
            m_state = RecoveryValidationState::DriveForward;
            m_stateTimer = 0.0;
            LOG_INFO("[RecoveryValidationController] Transitioned -> DriveForward");
            break;

        case RecoveryValidationState::DriveForward:
            if (m_stateTimer >= 0.2)
            {
                m_state = RecoveryValidationState::MoveOutsideBounds;
                m_stateTimer = 0.0;
                LOG_INFO("[RecoveryValidationController] Transitioned -> MoveOutsideBounds");
            }
            break;

        case RecoveryValidationState::MoveOutsideBounds:
            if (tComp) tComp->Position = {3000.0f, 3000.0f}; // Outside bounds
            m_state = RecoveryValidationState::AutomaticRecoveryBounds;
            m_stateTimer = 0.0;
            LOG_INFO("[RecoveryValidationController] Transitioned -> AutomaticRecoveryBounds");
            break;

        case RecoveryValidationState::AutomaticRecoveryBounds:
            if (rComp) recoverySystem.recover(registry, physicsWorld, vehicleEntity, *rComp);
            m_state = RecoveryValidationState::Repeat;
            m_stateTimer = 0.0;
            m_cycleCount++;
            LOG_INFO("[RecoveryValidationController] Completed full recovery validation cycle (Count: {}).", m_cycleCount);
            break;

        case RecoveryValidationState::Repeat:
            m_state = RecoveryValidationState::Spawn;
            m_stateTimer = 0.0;
            break;
        }
    }
}
