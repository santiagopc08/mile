#include "examples/hill_climb/GameplayValidationScene.hpp"
#include "engine/vehicle/VehicleFactory.hpp"
#include "engine/gameplay/CheckpointComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    GameplayValidationScene::GameplayValidationScene()
        : Scene("Gameplay Validation Scene")
    {
    }

    void GameplayValidationScene::OnInitialize()
    {
        // 1. Setup Camera & Follow Camera
        auto *cam = m_cameraManager.CreateCamera(1280.0f, 720.0f);
        if (cam)
        {
            m_followCamera = std::make_unique<FollowCamera>(*cam);
        }

        // 2. Initialize Physics & Terrain
        PhysicsConfig pConfig;
        pConfig.Gravity = {0.0f, 9.81f};
        m_physicsSystem.Initialize(pConfig);

        TerrainConfig tConfig;
        tConfig.GenerationSeed = 48192;
        m_terrainManager.Initialize(tConfig);
        m_terrainManager.UpdateStreaming({0.0f, 0.0f}, m_physicsSystem.GetWorld());

        // 3. Create Buggy Vehicle
        VehicleConfig vConfig;
        vConfig.Name = "HillClimb Buggy";
        m_vehicleEntity = VehicleFactory::CreateVehicle(GetRegistry(), vConfig);

        // 4. Create 3 Checkpoints at x=400, x=800, x=1200
        float cpPositions[3] = {400.0f, 800.0f, 1200.0f};
        for (int i = 0; i < 3; ++i)
        {
            EntityID cpEntity = CreateEntity("CP_" + std::to_string(i + 1));

            if (auto *transform = GetRegistry().GetComponent<TransformComponent>(cpEntity))
            {
                transform->SetPosition({cpPositions[i], 150.0f});
                transform->SetScale({30.0f, 100.0f});
            }

            auto &cpComp = GetRegistry().AddComponent<CheckpointComponent>(cpEntity);
            cpComp.Sequence = i + 1;
            cpComp.Position = {cpPositions[i], 150.0f};
            cpComp.Radius = 60.0f;

            auto &shape = GetRegistry().AddComponent<ShapeComponent>(cpEntity);
            shape.Type = ShapeType::Rectangle;
            shape.Size = {30.0f, 100.0f};
            shape.Color = {0.9f, 0.8f, 0.2f, 1.0f}; // Yellow Checkpoints

            GetRegistry().AddComponent<RenderLayerComponent>(cpEntity);
            GetRegistry().AddComponent<VisibilityComponent>(cpEntity);
        }

        m_stateMachine.TransitionTo(MatchState::Playing, GetEventQueue());
        LOG_INFO("[GameplayScene] Initialized Gameplay Scene with Vehicle, Follow Camera and 3 Checkpoints.");
    }

    void GameplayValidationScene::OnUpdate(double dt)
    {
        if (m_input)
        {
            auto snapshot = m_input->CreateSnapshot();
            m_actionContext.Update(snapshot);
        }

        // Get vehicle position & velocity for camera follow & state tracking
        glm::vec2 vPos(0.0f, 0.0f);
        glm::vec2 vVel(0.0f, 0.0f);

        if (auto *transform = GetRegistry().GetComponent<TransformComponent>(m_vehicleEntity))
        {
            vPos = transform->Position;
            m_stateMachine.GetMetrics().DistanceTravelled = std::max(m_stateMachine.GetMetrics().DistanceTravelled, vPos.x);
        }

        if (auto *body = GetRegistry().GetComponent<RigidBodyComponent>(m_vehicleEntity))
        {
            vVel = body->LinearVelocity;
        }

        // Update camera follow smoothing
        if (m_followCamera)
        {
            m_followCamera->Update(vPos, vVel, dt);
        }

        // Update terrain streaming
        m_terrainManager.UpdateStreaming(vPos, m_physicsSystem.GetWorld());

        // Update Checkpoints & Recovery
        m_checkpointSystem.Update(GetRegistry(), m_vehicleEntity, GetEventQueue());

        glm::vec2 respawnPos = (m_checkpointSystem.GetLastActivatedSequence() > 0)
            ? m_checkpointSystem.GetLatestCheckpointPosition()
            : m_initialSpawnPos;

        m_recoverySystem.Update(GetRegistry(), m_physicsSystem.GetWorld(), m_vehicleEntity, respawnPos, m_stateMachine, GetEventQueue());

        // Update Vehicle Physics & World
        m_vehicleSystem.Update(GetRegistry(), m_physicsSystem.GetWorld(), m_actionContext, dt);
        m_physicsSystem.Update(GetRegistry(), dt);

        m_stateMachine.GetMetrics().ActivatedCheckpoints = m_checkpointSystem.GetLastActivatedSequence();
        m_stateMachine.GetMetrics().FrameTimeMs = dt * 1000.0;
    }

    void GameplayValidationScene::OnShutdown()
    {
        m_terrainManager.Shutdown(m_physicsSystem.GetWorld());
        m_physicsSystem.Shutdown();
    }
}
