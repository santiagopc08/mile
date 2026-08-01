#ifndef PLATFORM_EXAMPLES_HILL_CLIMB_AUDIO_VALIDATION_SCENE_HPP
#define PLATFORM_EXAMPLES_HILL_CLIMB_AUDIO_VALIDATION_SCENE_HPP

#include "engine/scene/Scene.hpp"
#include "engine/physics/systems/PhysicsSystem.hpp"
#include "engine/vehicle/systems/VehiclePhysicsSystem.hpp"
#include "engine/terrain/TerrainManager.hpp"
#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/graphics/camera/FollowCamera.hpp"
#include "engine/gameplay/fuel/FuelSystem.hpp"
#include "engine/gameplay/fuel/FuelComponent.hpp"
#include "engine/gameplay/score/ScoreSystem.hpp"
#include "engine/gameplay/collectibles/CollectibleSpawner.hpp"
#include "engine/gameplay/collectibles/CollectibleComponent.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/input/Input.hpp"
#include "engine/input/KeyCodes.hpp"
#include "engine/events/EventQueue.hpp"

// Presentation & Audio Modules
#include "engine/ui/UIManager.hpp"
#include "engine/ui/hud/HUDManager.hpp"
#include "engine/ui/screens/ScreenManager.hpp"
#include "engine/ui/notifications/NotificationManager.hpp"
#include "engine/ui/theme/ThemeManager.hpp"
#include "engine/ui/animation/UIAnimator.hpp"
#include "engine/ui/debug/UIDebugOverlay.hpp"

#include "engine/audio/AudioEngine.hpp"

namespace platform
{
    class AudioValidationScene : public Scene
    {
    public:
        AudioValidationScene();
        ~AudioValidationScene() override = default;

        void BindInput(Input *input) { m_input = input; }

        [[nodiscard]] AudioEngine &GetAudioEngine() { return m_audioEngine; }
        [[nodiscard]] UIManager &GetUIManager() { return m_uiManager; }
        [[nodiscard]] HUDManager &GetHUDManager() { return m_hudManager; }

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

        // Presentation & Audio Framework
        UIManager m_uiManager;
        HUDManager m_hudManager;
        ScreenManager m_screenManager;
        NotificationManager m_notificationManager;
        ThemeManager m_themeManager;
        UIAnimator m_uiAnimator;
        UIDebugOverlay m_uiDebugOverlay;

        AudioEngine m_audioEngine;

        ActionContext m_actionContext;
        EventQueue m_eventQueue;
        Input *m_input{nullptr};

        EntityID m_vehicleEntity{kNullEntity};
        bool m_isPaused{false};
    };
}

#endif // PLATFORM_EXAMPLES_HILL_CLIMB_AUDIO_VALIDATION_SCENE_HPP
