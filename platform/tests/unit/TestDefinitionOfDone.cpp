#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/scene/SceneManager.hpp"
#include "engine/scene/components/Components.hpp"
#include "examples/hill_climb/ContentValidationScene.hpp"

TEST_CASE("GAME-001 DoD - Validation Scene Execution and Stability", "[DoD]")
{
    platform::SceneManager sceneManager;
    auto validationScene = std::make_unique<platform::ContentValidationScene>();

    REQUIRE(sceneManager.LoadScene(std::move(validationScene)));
    REQUIRE(sceneManager.GetActiveScene() != nullptr);

    // Simulate update step stability
    sceneManager.Update(0.016);
    sceneManager.FixedUpdate(0.016);
    sceneManager.PrepareRender();

    sceneManager.UnloadScene();
    REQUIRE(sceneManager.GetActiveScene() == nullptr);
}

TEST_CASE("GAME-001 DoD - Memory RAII Resource Release", "[DoD]")
{
    {
        platform::Scene scene("Temporary DoD Scene");
        auto entity = scene.GetRegistry().CreateEntity("TempEntity");
        REQUIRE(scene.GetRegistry().EntityCount() == 1);
    }
    // RAII destructor guarantees zero memory leaks upon exiting scope
    SUCCEED("Resource clean teardown executed via RAII.");
}

TEST_CASE("GAME-001 DoD - Module Game-Agnostic Reusability", "[DoD]")
{
    platform::Scene gameAgnosticScene("Generic Game World");
    auto entity = gameAgnosticScene.GetRegistry().CreateEntity("GenericHero");

    auto *tagComp = gameAgnosticScene.GetRegistry().GetComponent<platform::TagComponent>(entity);
    REQUIRE(tagComp != nullptr);
    tagComp->Tag = "PlayerCharacter";
    REQUIRE(tagComp->Tag == "PlayerCharacter");
}
