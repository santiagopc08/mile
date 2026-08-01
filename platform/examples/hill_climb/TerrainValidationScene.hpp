#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_TERRAIN_VALIDATION_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_TERRAIN_VALIDATION_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/vehicle/systems/VehiclePhysicsSystem.hpp"
#include "engine/terrain/TerrainManager.hpp"
#include "engine/terrain/TerrainRenderer.hpp"
#include "engine/terrain/TerrainDebugRenderer.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/RenderSystem.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/input/Input.hpp"

namespace platform
{
    class TerrainValidationScene : public Scene
    {
    public:
        TerrainValidationScene();
        ~TerrainValidationScene() override = default;

        void BindInput(Input *input) { m_input = input; }

        [[nodiscard]] TerrainManager &GetTerrainManager() { return m_terrainManager; }
        [[nodiscard]] EntityID GetVehicleEntity() const { return m_vehicleEntity; }

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnShutdown() override;

    private:
        PhysicsSystem m_physicsSystem;
        VehiclePhysicsSystem m_vehicleSystem;
        TerrainManager m_terrainManager;
        TerrainRenderer m_terrainRenderer;
        TerrainDebugRenderer m_terrainDebugRenderer;
        CameraManager m_cameraManager;
        RenderSystem m_renderSystem;
        ActionContext m_actionContext;
        Input *m_input{nullptr};

        EntityID m_vehicleEntity{kNullEntity};
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_TERRAIN_VALIDATION_SCENE_HPP
