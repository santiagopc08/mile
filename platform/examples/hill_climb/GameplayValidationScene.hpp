#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_GAMEPLAY_VALIDATION_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_GAMEPLAY_VALIDATION_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/vehicle/systems/VehiclePhysicsSystem.hpp"
#include "engine/terrain/TerrainManager.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/camera/FollowCamera.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/gameplay/CheckpointSystem.hpp"
#include "engine/gameplay/VehicleRecoverySystem.hpp"
#include "engine/gameplay/GameplayDebugOverlay.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/input/Input.hpp"
#include "engine/events/EventQueue.hpp"

namespace platform
{
    class GameplayValidationScene : public Scene
    {
    public:
        GameplayValidationScene();
        ~GameplayValidationScene() override = default;

        void BindInput(Input *input) { m_input = input; }

        [[nodiscard]] GameplayStateMachine &GetStateMachine() { return m_stateMachine; }
        [[nodiscard]] EntityID GetVehicleEntity() const { return m_vehicleEntity; }
        [[nodiscard]] EventQueue *GetEventQueue() { return &m_eventQueue; }

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

        GameplayStateMachine m_stateMachine;
        CheckpointSystem m_checkpointSystem;
        VehicleRecoverySystem m_recoverySystem;
        GameplayDebugOverlay m_debugOverlay;

        ActionContext m_actionContext;
        EventQueue m_eventQueue;
        Input *m_input{nullptr};

        EntityID m_vehicleEntity{kNullEntity};
        glm::vec2 m_initialSpawnPos{0.0f, -50.0f};
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_GAMEPLAY_VALIDATION_SCENE_HPP
