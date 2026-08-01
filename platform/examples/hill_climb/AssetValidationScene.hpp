#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_ASSET_VALIDATION_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_AUDIO_VALIDATION_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/vehicle/systems/VehiclePhysicsSystem.hpp"
#include "engine/terrain/TerrainManager.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/camera/FollowCamera.hpp"
#include "engine/gameplay/fuel/FuelSystem.hpp"
#include "engine/gameplay/score/ScoreSystem.hpp"
#include "engine/gameplay/collectibles/CollectibleSpawner.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/input/Input.hpp"
#include "engine/input/KeyCodes.hpp"
#include "engine/events/EventQueue.hpp"

// Subsystems
#include "engine/ui/UIManager.hpp"
#include "engine/ui/hud/HUDManager.hpp"
#include "engine/audio/AudioEngine.hpp"
#include "engine/assets/AssetManager.hpp"

namespace platform
{
    class AssetValidationScene : public Scene
    {
    public:
        AssetValidationScene();
        ~AssetValidationScene() override = default;

        void BindInput(Input *input) { m_input = input; }

        [[nodiscard]] AssetManager &GetAssetManager() { return m_assetManager; }
        [[nodiscard]] AudioEngine &GetAudioEngine() { return m_audioEngine; }

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

        UIManager m_uiManager;
        HUDManager m_hudManager;
        AudioEngine m_audioEngine;

        // Asset Framework Subsystem
        AssetManager m_assetManager;

        ActionContext m_actionContext;
        EventQueue m_eventQueue;
        Input *m_input{nullptr};

        EntityID m_vehicleEntity{kNullEntity};
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_ASSET_VALIDATION_SCENE_HPP
