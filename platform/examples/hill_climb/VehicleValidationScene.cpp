#include "examples/hill_climb/VehicleValidationScene.hpp"
#include "engine/scene/prefab/PrefabLoader.hpp"
#include "engine/vehicle/components/VehicleComponent.hpp"
#include "engine/vehicle/components/WheelJointComponent.hpp"
#include "engine/vehicle/components/SuspensionComponent.hpp"
#include "engine/vehicle/components/MotorSettingsComponent.hpp"
#include "engine/vehicle/components/MotorRuntimeComponent.hpp"
#include "engine/vehicle/components/VehicleMotorComponent.hpp"
#include "engine/vehicle/components/VehicleControllerSettingsComponent.hpp"
#include "engine/vehicle/components/VehicleControllerRuntimeComponent.hpp"
#include "engine/vehicle/systems/MotorSystem.hpp"
#include "engine/vehicle/controllers/VehicleController.hpp"
#include "engine/vehicle/controllers/VehicleControllerValidationController.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"
#include "engine/graphics/camera/CameraFollowSettingsComponent.hpp"
#include "engine/graphics/camera/CameraFollowRuntimeComponent.hpp"
#include "engine/graphics/camera/CameraFollowSystem.hpp"
#include "engine/graphics/camera/CameraValidationController.hpp"
#include "engine/physics/components/RigidBodyComponent.hpp"
#include "engine/physics/components/ColliderComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    static GameplayStateMachine g_gameplayStateMachine;
    static VehicleControllerValidationController g_vehicleValController;
    static CameraValidationController g_cameraValController;

    VehicleValidationScene::VehicleValidationScene()
        : Scene("Vehicle Validation Scene")
    {
    }

    void VehicleValidationScene::OnInitialize()
    {
        // 1. Setup Camera & Camera Follow System (GAME-001-MS006)
        m_cameraManager.CreateCamera(1280.0f, 720.0f);
        EntityID camEntity = CreateEntity("MainCameraEntity");
        auto &camSettings = GetRegistry().AddComponent<CameraFollowSettingsComponent>(camEntity);
        GetRegistry().AddComponent<CameraFollowRuntimeComponent>(camEntity);

        // 2. Initialize Physics System
        PhysicsConfig pConfig;
        pConfig.Gravity = {0.0f, 9.81f};
        m_physicsSystem.Initialize(pConfig);

        // 3. Create Ground (Flat Ground)
        m_groundEntity = CreateEntity("FlatGround");
        auto &gTransform = GetRegistry().AddComponent<TransformComponent>(m_groundEntity);
        gTransform.SetPosition({0.0f, 250.0f});
        gTransform.SetScale({2000.0f, 40.0f});

        auto &gBody = GetRegistry().AddComponent<RigidBodyComponent>(m_groundEntity);
        gBody.Type = BodyType::Static;

        auto &gCollider = GetRegistry().AddComponent<ColliderComponent>(m_groundEntity);
        gCollider.Shape = ColliderShape::Rectangle;
        gCollider.Size = {2000.0f, 40.0f};

        auto &gShape = GetRegistry().AddComponent<ShapeComponent>(m_groundEntity);
        gShape.Type = ShapeType::Rectangle;
        gShape.Size = {2000.0f, 40.0f};
        gShape.Color = {0.25f, 0.65f, 0.3f, 1.0f}; // Flat Ground

        GetRegistry().AddComponent<RenderLayerComponent>(m_groundEntity);
        GetRegistry().AddComponent<VisibilityComponent>(m_groundEntity);
        m_physicsSystem.GetWorld().CreateBody(m_groundEntity, gTransform, gBody, &gCollider);

        // 4. Instantiate Vehicle Prefab via PrefabLoader (GAME-001-MS001..MS006)
        PrefabLoader loader;
        PrefabData vehiclePrefab = loader.loadPrefab("Assets/Prefabs/Vehicle.prefab");
        m_vehicleEntity = loader.instantiatePrefab(*this, vehiclePrefab, {0.0f, 0.0f});

        // Set Camera Target
        camSettings.target = m_vehicleEntity;
        camSettings.mode = CameraFollowMode::PredictiveFollow;

        // 5. Create Physics Bodies, Wheel Joints, Motor & Vehicle Controller
        auto *vComp = GetRegistry().GetComponent<VehicleComponent>(m_vehicleEntity);
        if (vComp)
        {
            // Body Physics Body
            auto *bTransform = GetRegistry().GetComponent<TransformComponent>(vComp->body);
            auto *bBody = GetRegistry().GetComponent<RigidBodyComponent>(vComp->body);
            auto *bCollider = GetRegistry().GetComponent<ColliderComponent>(vComp->body);
            void *bodyPhysicsHandle = m_physicsSystem.GetWorld().CreateBody(vComp->body, *bTransform, *bBody, bCollider);
            bBody->RuntimeBodyHandle = bodyPhysicsHandle;

            // Front Wheel Physics Body & Suspension Joint
            auto *fwTransform = GetRegistry().GetComponent<TransformComponent>(vComp->frontWheel);
            auto *fwBody = GetRegistry().GetComponent<RigidBodyComponent>(vComp->frontWheel);
            auto *fwCollider = GetRegistry().GetComponent<ColliderComponent>(vComp->frontWheel);
            auto *fwJointComp = GetRegistry().GetComponent<WheelJointComponent>(vComp->frontWheel);
            auto *fwSuspComp = GetRegistry().GetComponent<SuspensionComponent>(vComp->frontWheel);
            void *fwPhysicsHandle = m_physicsSystem.GetWorld().CreateBody(vComp->frontWheel, *fwTransform, *fwBody, fwCollider);
            fwBody->RuntimeBodyHandle = fwPhysicsHandle;

            // Rear Wheel Physics Body & Suspension Joint
            auto *rwTransform = GetRegistry().GetComponent<TransformComponent>(vComp->rearWheel);
            auto *rwBody = GetRegistry().GetComponent<RigidBodyComponent>(vComp->rearWheel);
            auto *rwCollider = GetRegistry().GetComponent<ColliderComponent>(vComp->rearWheel);
            auto *rwJointComp = GetRegistry().GetComponent<WheelJointComponent>(vComp->rearWheel);
            auto *rwSuspComp = GetRegistry().GetComponent<SuspensionComponent>(vComp->rearWheel);
            void *rwPhysicsHandle = m_physicsSystem.GetWorld().CreateBody(vComp->rearWheel, *rwTransform, *rwBody, rwCollider);
            rwBody->RuntimeBodyHandle = rwPhysicsHandle;

            // Create Wheel Joints (b2WheelJoint) with spring frequency & damping ratio
            if (fwJointComp && bodyPhysicsHandle && fwPhysicsHandle)
            {
                fwJointComp->jointHandle = m_physicsSystem.GetWorld().CreateWheelJoint(
                    bodyPhysicsHandle, fwPhysicsHandle, fwJointComp->anchor, {0.0f, 1.0f}, 5.0f, 0.7f, -0.35f, 0.35f);
                if (fwSuspComp) fwSuspComp->jointHandle = fwJointComp->jointHandle;
            }
            if (rwJointComp && bodyPhysicsHandle && rwPhysicsHandle)
            {
                rwJointComp->jointHandle = m_physicsSystem.GetWorld().CreateWheelJoint(
                    bodyPhysicsHandle, rwPhysicsHandle, rwJointComp->anchor, {0.0f, 1.0f}, 5.0f, 0.7f, -0.35f, 0.35f);
                if (rwSuspComp) rwSuspComp->jointHandle = rwJointComp->jointHandle;
            }
        }

        // Initialize Autonomous Controllers & Gameplay State
        g_gameplayStateMachine.TransitionTo(MatchState::Ready);
        g_vehicleValController.Initialize();
        g_cameraValController.Initialize();

        LOG_INFO("[VehicleScene] Initialized Vehicle Validation Scene with Camera Follow System & Gameplay State Machine.");
    }

    void VehicleValidationScene::OnUpdate(double dt)
    {
        if (m_input)
        {
            auto snapshot = m_input->CreateSnapshot();
            m_actionContext.Update(snapshot);
        }

        // 1. Update Autonomous Camera Validation Controller (GAME-001-MS006)
        auto *cRuntime = GetRegistry().GetComponent<VehicleControllerRuntimeComponent>(m_vehicleEntity);
        VehicleControllerSystem vcSystem;
        if (cRuntime)
        {
            g_cameraValController.Update(g_gameplayStateMachine, *cRuntime, vcSystem, dt);
        }

        // 2. Update Vehicle Controller System
        vcSystem.Update(GetRegistry(), dt);

        // 3. Update Vehicle Motor System
        MotorSystem motorSystem;
        motorSystem.Update(GetRegistry(), m_physicsSystem.GetWorld(), dt);

        // 4. Update Camera Follow System (GAME-001-MS006)
        CameraFollowSystem cameraFollowSystem;
        auto *activeCam = m_cameraManager.GetActiveCamera();
        if (activeCam)
        {
            cameraFollowSystem.Update(GetRegistry(), *activeCam, g_gameplayStateMachine.GetCurrentState(), dt);
        }

        // 5. Run general physics system simulation
        m_physicsSystem.Update(GetRegistry(), dt);
    }

    void VehicleValidationScene::OnShutdown()
    {
        m_physicsSystem.Shutdown();
    }
}
