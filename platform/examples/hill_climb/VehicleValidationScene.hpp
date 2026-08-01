#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_VEHICLE_VALIDATION_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_VEHICLE_VALIDATION_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/physics/PhysicsDebugRenderer.hpp"
#include "engine/vehicle/systems/VehiclePhysicsSystem.hpp"
#include "engine/vehicle/VehicleDebugRenderer.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/RenderSystem.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/input/Input.hpp"

namespace platform
{
    class VehicleValidationScene : public Scene
    {
    public:
        VehicleValidationScene();
        ~VehicleValidationScene() override = default;

        void BindInput(Input *input) { m_input = input; }

        [[nodiscard]] EntityID GetVehicleEntity() const { return m_vehicleEntity; }
        [[nodiscard]] EntityID GetGroundEntity() const { return m_groundEntity; }

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnShutdown() override;

    private:
        PhysicsSystem m_physicsSystem;
        VehiclePhysicsSystem m_vehicleSystem;
        PhysicsDebugRenderer m_physicsDebugRenderer;
        VehicleDebugRenderer m_vehicleDebugRenderer;
        CameraManager m_cameraManager;
        RenderSystem m_renderSystem;
        ActionContext m_actionContext;
        Input *m_input{nullptr};

        EntityID m_groundEntity{kNullEntity};
        EntityID m_vehicleEntity{kNullEntity};
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_VEHICLE_VALIDATION_SCENE_HPP
