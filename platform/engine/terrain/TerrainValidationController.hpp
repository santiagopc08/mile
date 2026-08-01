#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_VALIDATION_CONTROLLER_HPP

#include "engine/terrain/TerrainSettingsComponent.hpp"
#include "engine/terrain/TerrainRuntimeComponent.hpp"
#include "engine/terrain/TerrainSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class TerrainValidationState
    {
        GenerateTerrain,
        SpawnVehicle,
        DriveAcrossTerrain,
        ValidateHeights,
        RegenerateSameSeed,
        CompareResults,
        Repeat
    };

    class TerrainValidationController
    {
    public:
        TerrainValidationController() = default;

        void Initialize();
        void Update(Registry &registry, TerrainSystem &terrainSystem, EntityID terrainEntity, double dt);

        [[nodiscard]] TerrainValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        TerrainValidationState m_state{TerrainValidationState::GenerateTerrain};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
        float m_sampleHeightA{0.0f};
        float m_sampleHeightB{0.0f};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_VALIDATION_CONTROLLER_HPP
