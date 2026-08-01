#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/SceneManager.hpp"
#include "engine/audio/bus/AudioBusSystem.hpp"
#include "engine/ui/hud/HUDManager.hpp"
#include "engine/gameplay/GameplayStateMachine.hpp"

TEST_CASE("HANDBOOK-011 Scene System Atomic Lifecycle & Switching", "[Frameworks]")
{
    platform::SceneManager sceneManager;
    auto scene1 = std::make_unique<platform::Scene>("Scene1");
    auto scene2 = std::make_unique<platform::Scene>("Scene2");

    sceneManager.LoadScene(std::move(scene1));
    REQUIRE(sceneManager.GetActiveScene() != nullptr);

    sceneManager.LoadScene(std::move(scene2));
    REQUIRE(sceneManager.GetActiveScene() != nullptr);
}

TEST_CASE("HANDBOOK-013 Audio Architecture Hierarchical Bus Routing", "[Frameworks]")
{
    platform::AudioBusSystem busSystem;
    busSystem.Initialize();

    auto *master = busSystem.GetBus(platform::AudioBusType::Master);
    auto *music = busSystem.GetBus(platform::AudioBusType::Music);
    auto *sfx = busSystem.GetBus(platform::AudioBusType::SFX);

    REQUIRE(master != nullptr);
    REQUIRE(music != nullptr);
    REQUIRE(sfx != nullptr);

    REQUIRE(master->GetVolume() == 1.0f);
}

TEST_CASE("HANDBOOK-014 UI Framework HUD & Widget ViewModel", "[Frameworks]")
{
    platform::HUDViewModel viewModel;
    REQUIRE(viewModel.TotalScore == 0);
    REQUIRE(viewModel.CoinCount == 0);
    REQUIRE(viewModel.FuelPercent == 1.0f);
}

TEST_CASE("HANDBOOK-015 Gameplay Framework Match State Machine", "[Frameworks]")
{
    platform::GameplayStateMachine fsm;
    REQUIRE(fsm.GetCurrentState() == platform::MatchState::Ready);

    fsm.TransitionTo(platform::MatchState::Playing);
    REQUIRE(fsm.GetCurrentState() == platform::MatchState::Playing);

    fsm.TransitionTo(platform::MatchState::Paused);
    REQUIRE(fsm.GetCurrentState() == platform::MatchState::Paused);
}
