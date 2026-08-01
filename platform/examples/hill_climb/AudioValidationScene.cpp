#include "examples/hill_climb/AudioValidationScene.hpp"
#include "engine/vehicle/VehicleFactory.hpp"
#include "engine/scene/components/Components.hpp"
#include "engine/audio/events/AudioEvents.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    class AudioGameplayScreen : public Screen
    {
    public:
        AudioGameplayScreen() : Screen(ScreenType::Gameplay, "GameplayScreen") {}
    };

    class AudioPauseScreen : public Screen
    {
    public:
        AudioPauseScreen() : Screen(ScreenType::Pause, "PauseScreen") {}
    };

    AudioValidationScene::AudioValidationScene()
        : Scene("Audio Validation Scene")
    {
    }

    void AudioValidationScene::OnInitialize()
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
        fuel.CurrentFuel = 80.0f;

        // 4. Spawn Collectibles
        m_spawner.SpawnCollectiblesAlongTerrain(GetRegistry(), m_terrainManager, 100.0f, 1500.0f);

        // 5. Initialize Presentation Layer
        m_uiManager.Initialize();
        m_hudManager.Initialize(m_uiManager);
        m_notificationManager.Initialize(m_uiManager, 3);

        m_screenManager.RegisterScreen(std::make_unique<AudioGameplayScreen>());
        m_screenManager.RegisterScreen(std::make_unique<AudioPauseScreen>());
        m_screenManager.TransitionTo(ScreenType::Gameplay, TransitionType::FadeIn, 0.2, &m_eventQueue);

        // 6. Initialize Audio Engine & Subscribe EventRouter
        m_audioEngine.Initialize(AudioConfiguration{}, &m_eventQueue);
        m_audioEngine.GetMusicSystem().SetState(MusicState::Gameplay);

        // Emit initial vehicle started audio event
        m_eventQueue.Push(std::make_shared<VehicleStartedAudioEvent>(glm::vec2(0.0f, 0.0f)));

        LOG_INFO("[AudioScene] Initialized Audio Validation Scene with Music, Engine Loop, Spatial SFX & Debug Overlay.");
    }

    void AudioValidationScene::OnUpdate(double dt)
    {
        if (m_input)
        {
            auto snapshot = m_input->CreateSnapshot();
            m_actionContext.Update(snapshot);

            // ESC toggles pause screen & music crossfade
            if (m_input->IsKeyPressed(Key::Escape))
            {
                m_isPaused = !m_isPaused;
                ScreenType target = m_isPaused ? ScreenType::Pause : ScreenType::Gameplay;
                m_screenManager.TransitionTo(target, TransitionType::FadeIn, 0.2, &m_eventQueue);

                MusicState mState = m_isPaused ? MusicState::Pause : MusicState::Gameplay;
                m_audioEngine.GetMusicSystem().SetState(mState);
            }

            // F6 toggles UI debug overlay
            if (m_input->IsKeyPressed(Key::F6))
            {
                m_uiDebugOverlay.ToggleOverlay();
            }

            // F7 toggles Audio debug overlay
            if (m_input->IsKeyPressed(Key::F7))
            {
                m_audioEngine.ToggleDebugOverlay();
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

        // Sync 2D Spatial Listener position with Vehicle / Camera
        m_audioEngine.SetListenerPosition(vPos);

        if (!m_isPaused)
        {
            // Update Camera & Terrain
            if (m_followCamera)
            {
                m_followCamera->Update(vPos, vVel, dt);
            }
            m_terrainManager.UpdateStreaming(vPos, m_physicsSystem.GetWorld());

            // Process Collectibles & emit Audio Events via EventQueue
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
                        m_eventQueue.Push(std::make_shared<CoinCollectedAudioEvent>(cTransform.Position));
                    }
                    else if (collectible.Type == CollectibleType::Fuel)
                    {
                        m_fuelSystem.Refill(GetRegistry(), m_vehicleEntity, collectible.Value, &m_eventQueue);
                        m_eventQueue.Push(std::make_shared<FuelCollectedAudioEvent>(cTransform.Position));

                        Notification n;
                        n.Type = NotificationType::FuelLow;
                        n.Title = "FUEL REFILLED!";
                        n.Color = glm::vec4(0.2f, 0.85f, 0.3f, 0.95f);
                        m_notificationManager.Push(n, &m_eventQueue);
                    }
                }
            });

            // Physics & Fuel Update
            m_fuelSystem.Update(GetRegistry(), m_vehicleEntity, &m_eventQueue, dt);
            m_vehicleSystem.Update(GetRegistry(), m_physicsSystem.GetWorld(), m_actionContext, dt);
            m_physicsSystem.Update(GetRegistry(), dt);
        }

        // Update Presentation & Audio Subsystems
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
        vm.IsPaused = m_isPaused;

        m_hudManager.Update(vm, dt);
        m_screenManager.Update(dt);
        m_notificationManager.Update(dt, &m_eventQueue);
        m_uiAnimator.Update(dt);
        m_uiManager.Update(dt);

        m_audioEngine.Update(dt);
        m_eventQueue.ProcessEvents();
    }

    void AudioValidationScene::OnShutdown()
    {
        m_audioEngine.Shutdown();
        m_uiManager.Shutdown();
        m_terrainManager.Shutdown(m_physicsSystem.GetWorld());
        m_physicsSystem.Shutdown();
    }
}
