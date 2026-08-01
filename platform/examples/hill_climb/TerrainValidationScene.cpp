#include "examples/hill_climb/TerrainValidationScene.hpp"
#include "engine/vehicle/VehicleFactory.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    TerrainValidationScene::TerrainValidationScene()
        : Scene("Terrain Validation Scene")
    {
    }

    void TerrainValidationScene::OnInitialize()
    {
        // 1. Setup Camera
        m_cameraManager.CreateCamera(1280.0f, 720.0f);

        // 2. Initialize Physics System
        PhysicsConfig pConfig;
        pConfig.Gravity = {0.0f, 9.81f};
        m_physicsSystem.Initialize(pConfig);

        // 3. Initialize Procedural Terrain Manager
        TerrainConfig tConfig;
        tConfig.GenerationSeed = 48192;
        tConfig.ChunkWidth = 500.0f;
        tConfig.StreamingDistance = 1500.0f;
        m_terrainManager.Initialize(tConfig);

        // Initial terrain streaming around origin
        m_terrainManager.UpdateStreaming({0.0f, 0.0f}, m_physicsSystem.GetWorld());

        // 4. Instantiate HillClimb Buggy Vehicle
        VehicleConfig vConfig;
        vConfig.Name = "HillClimb Buggy";
        vConfig.Mass = 1000.0f;
        m_vehicleEntity = VehicleFactory::CreateVehicle(GetRegistry(), vConfig);

        LOG_INFO("[TerrainScene] Initialized Terrain Validation Scene with Seed {}, Vehicle & Camera.", tConfig.GenerationSeed);
    }

    void TerrainValidationScene::OnUpdate(double dt)
    {
        if (m_input)
        {
            auto snapshot = m_input->CreateSnapshot();
            m_actionContext.Update(snapshot);
        }

        // Camera tracks Vehicle position
        glm::vec2 camPos(0.0f, 0.0f);
        if (auto *transform = GetRegistry().GetComponent<TransformComponent>(m_vehicleEntity))
        {
            camPos = transform->Position;
            if (auto *cam = m_cameraManager.GetActiveCamera())
            {
                cam->SetPosition(camPos);
            }
        }

        // Update terrain streaming around active camera position
        m_terrainManager.UpdateStreaming(camPos, m_physicsSystem.GetWorld());

        // Update Vehicle & Physics
        m_vehicleSystem.Update(GetRegistry(), m_physicsSystem.GetWorld(), m_actionContext, dt);
        m_physicsSystem.Update(GetRegistry(), dt);
    }

    void TerrainValidationScene::OnShutdown()
    {
        m_terrainManager.Shutdown(m_physicsSystem.GetWorld());
        m_physicsSystem.Shutdown();
    }
}
