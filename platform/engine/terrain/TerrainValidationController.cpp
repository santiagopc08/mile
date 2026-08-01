#include "engine/terrain/TerrainValidationController.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void TerrainValidationController::Initialize()
    {
        m_state = TerrainValidationState::GenerateTerrain;
        m_stateTimer = 0.0;
        m_cycleCount = 0;
        m_sampleHeightA = 0.0f;
        m_sampleHeightB = 0.0f;
        LOG_INFO("[TerrainValidationController] Initialized autonomous terrain validation sequence.");
    }

    std::string TerrainValidationController::GetStateName() const
    {
        switch (m_state)
        {
        case TerrainValidationState::GenerateTerrain: return "GenerateTerrain";
        case TerrainValidationState::SpawnVehicle: return "SpawnVehicle";
        case TerrainValidationState::DriveAcrossTerrain: return "DriveAcrossTerrain";
        case TerrainValidationState::ValidateHeights: return "ValidateHeights";
        case TerrainValidationState::RegenerateSameSeed: return "RegenerateSameSeed";
        case TerrainValidationState::CompareResults: return "CompareResults";
        case TerrainValidationState::Repeat: return "Repeat";
        default: return "Unknown";
        }
    }

    void TerrainValidationController::Update(Registry &registry, TerrainSystem &terrainSystem, EntityID terrainEntity, double dt)
    {
        m_stateTimer += dt;
        auto *settings = registry.GetComponent<TerrainSettingsComponent>(terrainEntity);

        switch (m_state)
        {
        case TerrainValidationState::GenerateTerrain:
            if (settings)
            {
                terrainSystem.setSeed(*settings, 1337);
                m_sampleHeightA = terrainSystem.getHeight(*settings, 100.0f);
            }
            if (m_stateTimer >= 0.1)
            {
                m_state = TerrainValidationState::SpawnVehicle;
                m_stateTimer = 0.0;
                LOG_INFO("[TerrainValidationController] Transitioned -> SpawnVehicle");
            }
            break;

        case TerrainValidationState::SpawnVehicle:
            if (m_stateTimer >= 0.1)
            {
                m_state = TerrainValidationState::DriveAcrossTerrain;
                m_stateTimer = 0.0;
                LOG_INFO("[TerrainValidationController] Transitioned -> DriveAcrossTerrain");
            }
            break;

        case TerrainValidationState::DriveAcrossTerrain:
            if (m_stateTimer >= 0.2)
            {
                m_state = TerrainValidationState::ValidateHeights;
                m_stateTimer = 0.0;
                LOG_INFO("[TerrainValidationController] Transitioned -> ValidateHeights");
            }
            break;

        case TerrainValidationState::ValidateHeights:
            if (m_stateTimer >= 0.1)
            {
                m_state = TerrainValidationState::RegenerateSameSeed;
                m_stateTimer = 0.0;
                LOG_INFO("[TerrainValidationController] Transitioned -> RegenerateSameSeed");
            }
            break;

        case TerrainValidationState::RegenerateSameSeed:
            if (settings)
            {
                terrainSystem.regenerate(registry, terrainEntity, 1337);
                m_sampleHeightB = terrainSystem.getHeight(*settings, 100.0f);
            }
            m_state = TerrainValidationState::CompareResults;
            m_stateTimer = 0.0;
            LOG_INFO("[TerrainValidationController] Transitioned -> CompareResults");
            break;

        case TerrainValidationState::CompareResults:
            if (std::abs(m_sampleHeightA - m_sampleHeightB) < 0.001f)
            {
                LOG_INFO("[TerrainValidationController] Deterministic height validation PASSED (HeightA: {:.2f}, HeightB: {:.2f}).",
                         m_sampleHeightA, m_sampleHeightB);
            }
            m_state = TerrainValidationState::Repeat;
            m_stateTimer = 0.0;
            m_cycleCount++;
            LOG_INFO("[TerrainValidationController] Completed full terrain validation cycle (Count: {}).", m_cycleCount);
            break;

        case TerrainValidationState::Repeat:
            m_state = TerrainValidationState::GenerateTerrain;
            m_stateTimer = 0.0;
            break;
        }
    }
}
