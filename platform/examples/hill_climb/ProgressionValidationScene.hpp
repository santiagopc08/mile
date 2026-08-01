#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_PROGRESSION_VALIDATION_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_PROGRESSION_VALIDATION_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/vehicle/systems/VehiclePhysicsSystem.hpp"
#include "engine/terrain/TerrainManager.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/camera/FollowCamera.hpp"
#include "engine/gameplay/fuel/FuelSystem.hpp"
#include "engine/gameplay/fuel/FuelComponent.hpp"
#include "engine/gameplay/score/ScoreSystem.hpp"
#include "engine/gameplay/collectibles/CollectibleSpawner.hpp"
#include "engine/gameplay/collectibles/CollectibleComponent.hpp"
#include "engine/gameplay/ui/ProgressionDebugOverlay.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/input/Input.hpp"
#include "engine/events/EventQueue.hpp"

namespace platform
{
    class ProgressionValidationScene : public Scene
    {
    public:
        ProgressionValidationScene();
        ~ProgressionValidationScene() override = default;

        void BindInput(Input *input) { m_input = input; }

        [[nodiscard]] ScoreSystem &GetScoreSystem() { return m_scoreSystem; }
        [[nodiscard]] FuelSystem &GetFuelSystem() { return m_fuelSystem; }
        [[nodiscard]] EntityID GetVehicleEntity() const { return m_vehicleEntity; }

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnShutdown() override;

    private:
        PhysicsSystem m_physicsSystem;
        VehiclePhysicsSystem m_vehicleSystem;
        TerrainManager m_terrainManager;
        CameraManager m_cameraManager;
        std::unique_ptr<FollowCamera> m_followCamera;

        FuelSystem m_fuelSystem;
        ScoreSystem m_scoreSystem;
        CollectibleSpawner m_spawner;
        ProgressionDebugOverlay m_overlay;

        ActionContext m_actionContext;
        EventQueue m_eventQueue;
        Input *m_input{nullptr};

        EntityID m_vehicleEntity{kNullEntity};
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_PROGRESSION_VALIDATION_SCENE_HPP
