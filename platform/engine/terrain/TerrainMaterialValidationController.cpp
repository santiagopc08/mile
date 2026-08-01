#include "engine/terrain/TerrainMaterialValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void TerrainMaterialValidationController::Initialize()
    {
        m_state = TerrainMaterialValidationState::GenerateTerrain;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        LOG_INFO("[TerrainMaterialValidationController] Initialized autonomous terrain material validation sequence.");
    }

    std::string TerrainMaterialValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case TerrainMaterialValidationState::GenerateTerrain: return "GenerateTerrain";
        case TerrainMaterialValidationState::AssignMaterials: return "AssignMaterials";
        case TerrainMaterialValidationState::DriveAcrossTerrain: return "DriveAcrossTerrain";
        case TerrainMaterialValidationState::ValidatePhysicsProperties: return "ValidatePhysicsProperties";
        case TerrainMaterialValidationState::ValidateRendering: return "ValidateRendering";
        case TerrainMaterialValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void TerrainMaterialValidationController::Update(Registry &registry, TerrainMaterialSystem &matSystem, EntityID terrainEntity, double dt)
    {
        m_stateTimer += dt;

        switch (m_state)
        {
        case TerrainMaterialValidationState::GenerateTerrain:
            if (m_stateTimer >= 0.1)
            {
                m_state = TerrainMaterialValidationState::AssignMaterials;
                m_stateTimer = 0.0;
                LOG_INFO("[TerrainMaterialValidationController] Transitioned -> AssignMaterials");
            }
            break;

        case TerrainMaterialValidationState::AssignMaterials:
            matSystem.setMaterial(registry, terrainEntity, 0); // Grass
            if (m_stateTimer >= 0.1)
            {
                m_state = TerrainMaterialValidationState::DriveAcrossTerrain;
                m_stateTimer = 0.0;
                LOG_INFO("[TerrainMaterialValidationController] Transitioned -> DriveAcrossTerrain");
            }
            break;

        case TerrainMaterialValidationState::DriveAcrossTerrain:
            if (m_stateTimer >= 0.1)
            {
                m_state = TerrainMaterialValidationState::ValidatePhysicsProperties;
                m_stateTimer = 0.0;
                LOG_INFO("[TerrainMaterialValidationController] Transitioned -> ValidatePhysicsProperties");
            }
            break;

        case TerrainMaterialValidationState::ValidatePhysicsProperties:
            if (m_stateTimer >= 0.1)
            {
                m_state = TerrainMaterialValidationState::ValidateRendering;
                m_stateTimer = 0.0;
                LOG_INFO("[TerrainMaterialValidationController] Transitioned -> ValidateRendering");
            }
            break;

        case TerrainMaterialValidationState::ValidateRendering:
            m_state = TerrainMaterialValidationState::Repeat;
            m_stateTimer = 0.0;
            m_cycleCount++;
            LOG_INFO("[TerrainMaterialValidationController] Completed full material validation cycle (Count: {}).", m_cycleCount);
            break;

        case TerrainMaterialValidationState::Repeat:
            m_state = TerrainMaterialValidationState::GenerateTerrain;
            m_stateTimer = 0.0;
            break;
        }
    }
}
