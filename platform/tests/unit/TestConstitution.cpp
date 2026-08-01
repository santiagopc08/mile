#include <catch2/catch_test_macros.hpp>
#include "engine/app/Engine.hpp"
#include "engine/scene/Scene.hpp"
#include "engine/scene/components/Components.hpp"

TEST_CASE("HANDBOOK-000 Constitution Principles & Orbit Namespace Alias", "[Constitution]")
{
    // Verify orbit namespace alias
    orbit::Engine engine;
    REQUIRE(!engine.GetWindow());
    REQUIRE(!engine.GetRenderer());
}

TEST_CASE("HANDBOOK-001 Subsystem Atomic Rollback & Lifecycle", "[Constitution]")
{
    platform::Engine engine;
    platform::WindowConfig config;
    config.Title = "Test Constitution Window";
    config.Width = 640;
    config.Height = 480;

    REQUIRE(engine.Initialize(config));
    REQUIRE(engine.GetSceneManager() != nullptr);

    // Verify Reverse Shutdown
    engine.Shutdown();
    REQUIRE(engine.GetSceneManager() == nullptr);
}
