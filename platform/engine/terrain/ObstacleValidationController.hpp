#ifndef PLATFORM_ENGINE_TERRAIN_OBSTACLE_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_TERRAIN_OBSTACLE_VALIDATION_CONTROLLER_HPP

#include "engine/terrain/ObstacleManager.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class ObstacleValidationState
    {
        GenerateTerrain,
        SpawnObstacles,
        DriveVehicle,
        ValidateCollisions,
        Repeat
    };

    class ObstacleValidationController
    {
    public:
        ObstacleValidationController() = default;

        void Initialize();
        void Update(Registry &registry, ObstacleManager &obsManager, EntityID vehicleEntity, double dt);

        [[nodiscard]] ObstacleValidationState GetState() const { return m_state; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        ObstacleValidationState m_state{ObstacleValidationState::GenerateTerrain};
        double m_stateTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_TERRAIN_OBSTACLE_VALIDATION_CONTROLLER_HPP
