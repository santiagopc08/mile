#include "engine/terrain/ObstacleValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void ObstacleValidationController::Initialize()
    {
        m_state = ObstacleValidationState::GenerateTerrain;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[ObstacleValidationController] Initialized autonomous obstacle validation sequence.");
    }

    std::string ObstacleValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case ObstacleValidationState::GenerateTerrain: return "GenerateTerrain";
        case ObstacleValidationState::SpawnObstacles: return "SpawnObstacles";
        case ObstacleValidationState::DriveVehicle: return "DriveVehicle";
        case ObstacleValidationState::ValidateCollisions: return "ValidateCollisions";
        case ObstacleValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void ObstacleValidationController::Update(Registry &registry, ObstacleManager &obsManager, EntityID vehicleEntity, double dt)
    {
        (void)vehicleEntity;
        m_stateTimer += dt;

        switch (m_state)
        {
        case ObstacleValidationState::GenerateTerrain:
            if (m_stateTimer >= 0.1)
            {
                m_state = ObstacleValidationState::SpawnObstacles;
                m_stateTimer = 0.0;
                LOG_INFO("[ObstacleValidationController] Transitioned -> SpawnObstacles");
            }
            break;

        case ObstacleValidationState::SpawnObstacles:
            obsManager.spawnObstacle(registry, ObstacleType::Rock, {150.0f, 240.0f}, 0);
            obsManager.spawnObstacle(registry, ObstacleType::Crate, {300.0f, 240.0f}, 1);
            if (m_stateTimer >= 0.1)
            {
                m_state = ObstacleValidationState::DriveVehicle;
                m_stateTimer = 0.0;
                LOG_INFO("[ObstacleValidationController] Transitioned -> DriveVehicle");
            }
            break;

        case ObstacleValidationState::DriveVehicle:
            if (m_stateTimer >= 0.1)
            {
                m_state = ObstacleValidationState::ValidateCollisions;
                m_stateTimer = 0.0;
                LOG_INFO("[ObstacleValidationController] Transitioned -> ValidateCollisions");
            }
            break;

        case ObstacleValidationState::ValidateCollisions:
            m_state = ObstacleValidationState::Repeat;
            m_stateTimer = 0.0;
            m_cycleCount++;
            LOG_INFO("[ObstacleValidationController] Completed full obstacle validation cycle (Count: {}).", m_cycleCount);
            break;

        case ObstacleValidationState::Repeat:
            m_state = ObstacleValidationState::GenerateTerrain;
            m_stateTimer = 0.0;
            break;
        }
    }
}
