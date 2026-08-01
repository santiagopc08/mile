#ifndef PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_VALIDATION_CONTROLLER_HPP

#include "engine/terrain/TerrainMaterialSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class TerrainMaterialValidationState
    {
        GenerateTerrain,
        AssignMaterials,
        DriveAcrossTerrain,
        ValidatePhysicsProperties,
        ValidateRendering,
        Repeat
    };

    class TerrainMaterialValidationController
    {
    public:
        TerrainMaterialValidationController() = default;

        void Initialize();
        void Update(Registry &registry, TerrainMaterialSystem &matSystem, EntityID terrainEntity, double dt);

        [[nodiscard]] TerrainMaterialValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        TerrainMaterialValidationState m_state{TerrainMaterialValidationState::GenerateTerrain};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_TERRAIN_MATERIAL_VALIDATION_CONTROLLER_HPP
