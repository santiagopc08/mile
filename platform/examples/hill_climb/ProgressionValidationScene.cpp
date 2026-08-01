#include "examples/hill_climb/ProgressionValidationScene.hpp"
#include "engine/vehicle/VehicleFactory.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    ProgressionValidationScene::ProgressionValidationScene()
        : Scene("Progression Validation Scene")
    {
    }

    void ProgressionValidationScene::OnInitialize()
    {
        // 1. Setup Camera
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

        // 3. Create Vehicle & Attach FuelComponent
        VehicleConfig vConfig;
        vConfig.Name = "HillClimb Buggy";
        m_vehicleEntity = VehicleFactory::CreateVehicle(GetRegistry(), vConfig);

        auto &fuel = GetRegistry().AddComponent<FuelComponent>(m_vehicleEntity);
        fuel.MaximumFuel = 100.0f;
        fuel.CurrentFuel = 82.0f; // Initial 82%

        // 4. Procedurally Spawn Coins and Fuel Canisters along terrain
        m_spawner.SpawnCollectiblesAlongTerrain(GetRegistry(), m_terrainManager, 100.0f, 1500.0f);

        LOG_INFO("[ProgressionScene] Initialized Progression Validation Scene with Coins, Fuel Canisters & Score Tracker.");
    }

    void ProgressionValidationScene::OnUpdate(double dt)
    {
        if (m_input)
        {
            auto snapshot = m_input->CreateSnapshot();
            m_actionContext.Update(snapshot);
        }

        // Get vehicle transform for camera & distance tracking
        glm::vec2 vPos(0.0f, 0.0f);
        glm::vec2 vVel(0.0f, 0.0f);

        if (auto *transform = GetRegistry().GetComponent<TransformComponent>(m_vehicleEntity))
        {
            vPos = transform->Position;
            m_scoreSystem.UpdateDistance(std::max(0.0f, vPos.x));
        }

        if (auto *body = GetRegistry().GetComponent<RigidBodyComponent>(m_vehicleEntity))
        {
            vVel = body->LinearVelocity;
        }

        // Update Camera & Terrain Streaming
        if (m_followCamera)
        {
            m_followCamera->Update(vPos, vVel, dt);
        }
        m_terrainManager.UpdateStreaming(vPos, m_physicsSystem.GetWorld());

        // Process Collectible Pickups
        auto view = GetRegistry().GetView<TransformComponent, CollectibleComponent, ActiveComponent>();
        view.Each([this, vPos](EntityID entity, TransformComponent &cTransform, CollectibleComponent &collectible, ActiveComponent &active) {
            (void)entity;
            if (!active.Enabled || collectible.State == CollectibleState::Collected)
            {
                return;
            }

            float dist = glm::distance(vPos, cTransform.Position);
            if (dist <= collectible.Radius)
            {
                collectible.State = CollectibleState::Collected;
                active.Enabled = false;

                if (collectible.Type == CollectibleType::Coin)
                {
                    m_scoreSystem.AddCoins(static_cast<uint32_t>(collectible.Value));
                }
                else if (collectible.Type == CollectibleType::Fuel)
                {
                    m_fuelSystem.Refill(GetRegistry(), m_vehicleEntity, collectible.Value, &m_eventQueue);
                }
            }
        });

        // Update Fuel Depletion, Vehicle Physics & World
        m_fuelSystem.Update(GetRegistry(), m_vehicleEntity, &m_eventQueue, dt);
        m_vehicleSystem.Update(GetRegistry(), m_physicsSystem.GetWorld(), m_actionContext, dt);
        m_physicsSystem.Update(GetRegistry(), dt);
    }

    void ProgressionValidationScene::OnShutdown()
    {
        m_terrainManager.Shutdown(m_physicsSystem.GetWorld());
        m_physicsSystem.Shutdown();
    }
}
