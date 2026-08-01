#include "examples/hill_climb/AssetValidationScene.hpp"
#include "engine/vehicle/VehicleFactory.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/gameplay/fuel/FuelComponent.hpp"
#include "engine/gameplay/collectibles/CollectibleComponent.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AssetValidationScene::AssetValidationScene()
        : Scene("Asset Validation Scene")
    {
    }

    void AssetValidationScene::OnInitialize()
    {
        // 1. Setup Camera & Viewport
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

        // 3. Create Vehicle & Fuel Component
        VehicleConfig vConfig;
        vConfig.Name = "HillClimb Buggy";
        m_vehicleEntity = VehicleFactory::CreateVehicle(GetRegistry(), vConfig);

        auto &fuel = GetRegistry().AddComponent<FuelComponent>(m_vehicleEntity);
        fuel.MaximumFuel = 100.0f;
        fuel.CurrentFuel = 85.0f;

        // 4. Spawn Collectibles
        m_spawner.SpawnCollectiblesAlongTerrain(GetRegistry(), m_terrainManager, 100.0f, 1500.0f);

        // 5. Initialize UI & Audio Subsystems
        m_uiManager.Initialize();
        m_hudManager.Initialize(m_uiManager);
        m_audioEngine.Initialize(AudioConfiguration{}, &m_eventQueue);

        // 6. Initialize Asset Framework
        m_assetManager.Initialize(&m_eventQueue);

        // Register & Load Sample Assets
        m_assetManager.ImportAsset("textures/chassis.png", "cache/chassis.tex");
        m_assetManager.ImportAsset("textures/wheel.png", "cache/wheel.tex");
        m_assetManager.ImportAsset("audio/engine.wav", "cache/engine.snd");
        m_assetManager.ImportAsset("fonts/inter.ttf", "cache/inter.fnt");
        m_assetManager.ImportAsset("config/vehicle.json", "cache/vehicle.cfg");

        // Build Dependency Graph relationships
        AssetID vehicleID = HashAssetUUID("uuid-config/vehicle.json");
        AssetID chassisID = HashAssetUUID("uuid-textures/chassis.png");
        AssetID wheelID = HashAssetUUID("uuid-textures/wheel.png");
        AssetID engineID = HashAssetUUID("uuid-audio/engine.wav");

        m_assetManager.GetDependencyGraph().AddDependency(vehicleID, chassisID);
        m_assetManager.GetDependencyGraph().AddDependency(vehicleID, wheelID);
        m_assetManager.GetDependencyGraph().AddDependency(vehicleID, engineID);

        LOG_INFO("[AssetScene] Initialized Asset Validation Scene with AssetRegistry, DependencyGraph & HotReload.");
    }

    void AssetValidationScene::OnUpdate(double dt)
    {
        if (m_input)
        {
            auto snapshot = m_input->CreateSnapshot();
            m_actionContext.Update(snapshot);

            // F8 triggers simulated hot reload of vehicle config
            if (m_input->IsKeyPressed(Key::F8))
            {
                m_assetManager.GetHotReloadManager().SimulateFileModification("config/vehicle.json");
            }
        }

        // Get vehicle pos & vel
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

        // Update Camera & Terrain
        if (m_followCamera)
        {
            m_followCamera->Update(vPos, vVel, dt);
        }
        m_terrainManager.UpdateStreaming(vPos, m_physicsSystem.GetWorld());

        // Process Collectibles
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

        // Physics & Subsystem Updates
        m_fuelSystem.Update(GetRegistry(), m_vehicleEntity, &m_eventQueue, dt);
        m_vehicleSystem.Update(GetRegistry(), m_physicsSystem.GetWorld(), m_actionContext, dt);
        m_physicsSystem.Update(GetRegistry(), dt);

        HUDViewModel vm;
        if (auto *fuelComp = GetRegistry().GetComponent<FuelComponent>(m_vehicleEntity))
        {
            vm.FuelPercent = fuelComp->CurrentFuel / fuelComp->MaximumFuel;
            vm.IsFuelLow = fuelComp->CurrentFuel <= fuelComp->CriticalThreshold;
        }
        vm.SpeedKmh = glm::length(vVel) * 3.6f;
        vm.DistanceMeters = std::max(0.0f, vPos.x);
        vm.CoinCount = m_scoreSystem.GetMetrics().CoinsCollected;
        vm.TotalScore = m_scoreSystem.GetScore();

        m_hudManager.Update(vm, dt);
        m_uiManager.Update(dt);
        m_audioEngine.Update(dt);
        m_assetManager.Update(dt);
        m_eventQueue.ProcessEvents();
    }

    void AssetValidationScene::OnShutdown()
    {
        m_assetManager.Shutdown();
        m_audioEngine.Shutdown();
        m_uiManager.Shutdown();
        m_terrainManager.Shutdown(m_physicsSystem.GetWorld());
        m_physicsSystem.Shutdown();
    }
}
