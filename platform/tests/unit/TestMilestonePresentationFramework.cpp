#include <catch2/catch_test_macros.hpp>

#include "engine/gameplay/ui/GameplayHUDViewModel.hpp"
#include "engine/gameplay/ui/GameplayHUD.hpp"
#include "engine/gameplay/PauseFlowSystem.hpp"
#include "engine/ui/MainMenuScreen.hpp"
#include "engine/audio/GameplayAudioSystem.hpp"
#include "engine/graphics/VFXSystem.hpp"
#include "engine/graphics/camera/CameraEffectsSystem.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"

TEST_CASE("GAME-001-MS021 Gameplay HUD ViewModel", "[MS021]")
{
    platform::GameplayHUDViewModel vm;
    vm.Update(85.0f, 250.0, 10, 1200, 35.0f);

    REQUIRE(vm.fuel() == 85.0f);
    REQUIRE(vm.distance() == 250.0);
    REQUIRE(vm.coins() == 10);
    REQUIRE(vm.score() == 1200);
    REQUIRE(vm.speed() == 35.0f);

    platform::GameplayHUD hud;
    hud.Render(vm);
}

TEST_CASE("GAME-001-MS022 Pause & Game Flow Integration", "[MS022]")
{
    platform::GameplayStateMachine stateMachine;
    platform::PauseFlowSystem pauseSystem;

    stateMachine.TransitionTo(platform::MatchState::Playing);
    REQUIRE_FALSE(pauseSystem.isPaused(stateMachine));

    pauseSystem.pause(stateMachine);
    REQUIRE(pauseSystem.isPaused(stateMachine));

    pauseSystem.resume(stateMachine);
    REQUIRE_FALSE(pauseSystem.isPaused(stateMachine));
}

TEST_CASE("GAME-001-MS023 Main Menu Navigation", "[MS023]")
{
    platform::GameplayStateMachine stateMachine;
    platform::MainMenuScreen menuScreen;

    REQUIRE(menuScreen.IsActive());
    menuScreen.SelectOption(platform::MainMenuOption::Start, stateMachine);

    REQUIRE_FALSE(menuScreen.IsActive());
    REQUIRE(stateMachine.GetCurrentState() == platform::MatchState::Loading);
}

TEST_CASE("GAME-001-MS024 Gameplay Audio Events", "[MS024]")
{
    platform::GameplayAudioSystem audioSystem;

    audioSystem.PlayEvent(platform::AudioEvent::EngineIdle);
    audioSystem.PlayEvent(platform::AudioEvent::Coin);

    REQUIRE(audioSystem.GetPlayedEventsCount() == 2);
    REQUIRE(audioSystem.HasPlayed(platform::AudioEvent::EngineIdle));
    REQUIRE(audioSystem.HasPlayed(platform::AudioEvent::Coin));
    REQUIRE_FALSE(audioSystem.HasPlayed(platform::AudioEvent::Crash));
}

TEST_CASE("GAME-001-MS025 Visual Effects Framework", "[MS025]")
{
    platform::VFXSystem vfxSystem;

    vfxSystem.SpawnEffect(platform::VFXType::Dust, {0.0f, 0.0f});
    vfxSystem.SpawnEffect(platform::VFXType::CoinPickup, {100.0f, 10.0f});

    REQUIRE(vfxSystem.GetActiveParticleCount() == 2);
    REQUIRE(vfxSystem.HasEffect(platform::VFXType::Dust));
    REQUIRE(vfxSystem.HasEffect(platform::VFXType::CoinPickup));
    REQUIRE_FALSE(vfxSystem.HasEffect(platform::VFXType::Smoke));
}

TEST_CASE("GAME-001-MS026 Camera Effects & CameraView output", "[MS026]")
{
    platform::CameraEffectsSystem cameraEffects;
    platform::CameraView view{};

    cameraEffects.shake(5.0f, 0.5);
    REQUIRE(cameraEffects.IsShaking());

    cameraEffects.ApplyEffects(view, 0.016);
    REQUIRE(view.Transform.x != 0.0f);
}
