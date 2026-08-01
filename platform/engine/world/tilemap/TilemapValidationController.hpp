#ifndef PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_VALIDATION_CONTROLLER_HPP
#define PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_VALIDATION_CONTROLLER_HPP

#include "engine/world/tilemap/TilemapSystem.hpp"
#include "engine/scene/Registry.hpp"
#include <string>

namespace platform
{
    enum class TilemapValidationStep
    {
        LoadMap,
        TraverseMap,
        ValidateCollision,
        ReloadMap,
        Repeat
    };

    class TilemapValidationController
    {
    public:
        TilemapValidationController() = default;

        void Initialize();
        void Update(Registry &registry, TilemapSystem &tilemapSystem, double dt);

        [[nodiscard]] TilemapValidationStep GetState() const { return m_step; }
        [[nodiscard]] std::string GetStateName() const;
        [[nodiscard]] bool IsCompleted() const { return m_cycleCount > 0; }
        [[nodiscard]] int GetCycleCount() const { return m_cycleCount; }

    private:
        TilemapValidationStep m_step{TilemapValidationStep::LoadMap};
        EntityID m_tilemap{kNullEntity};
        double m_stepTimer{0.0};
        int m_cycleCount{0};
    };
}

#endif // PLATFORM_ENGINE_WORLD_TILEMAP_TILEMAP_VALIDATION_CONTROLLER_HPP
