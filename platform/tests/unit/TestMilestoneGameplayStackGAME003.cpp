#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/gameplay/modifiers/ModifierSettingsComponent.hpp"
#include "engine/gameplay/modifiers/ModifierRuntimeComponent.hpp"
#include "engine/gameplay/modifiers/ModifierSystem.hpp"
#include "engine/trigger/TriggerVolumeSystem.hpp"
#include "engine/world/MovingPlatformSystem.hpp"
#include "engine/gameplay/hazards/HazardSystem.hpp"
#include "engine/gameplay/checkpoints/CheckpointTimelineSystem.hpp"

TEST_CASE("GAME-003-MS007 Gameplay Modifier Framework Stacking & Application", "[MS007]")
{
    platform::Scene scene("Test Modifier Scene");
    auto &registry = scene.GetRegistry();

    platform::ModifierSystem modifierSystem;
    platform::EntityID player = registry.CreateEntity("Player");

    float baseJump = 10.0f;
    modifierSystem.applyModifier(registry, player, 1, platform::ModifierType::JumpHeight, 1.5f, platform::ModifierOperation::Multiply, 0.0f);

    REQUIRE(modifierSystem.hasModifier(registry, player, 1));
    REQUIRE(modifierSystem.calculateModifiedValue(registry, player, platform::ModifierType::JumpHeight, baseJump) == 15.0f);

    modifierSystem.removeModifier(registry, player, 1);
    REQUIRE_FALSE(modifierSystem.hasModifier(registry, player, 1));

    // Profiler metrics check (POLICY-006)
    auto metrics = modifierSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-003-MS008 Trigger Volume Framework Occupancy & Events", "[MS008]")
{
    platform::Scene scene("Test Volume Scene");
    auto &registry = scene.GetRegistry();

    platform::TriggerVolumeSystem volumeSystem;
    platform::EntityID volume = volumeSystem.createVolume(registry, 101, platform::VolumeShape::Rectangle, platform::VolumeZoneType::BuffZone);
    platform::EntityID player = registry.CreateEntity("Player");

    REQUIRE_FALSE(volumeSystem.isOccupied(registry, volume));

    volumeSystem.onEnter(registry, volume, player);
    REQUIRE(volumeSystem.isOccupied(registry, volume));

    volumeSystem.onExit(registry, volume, player);
    REQUIRE_FALSE(volumeSystem.isOccupied(registry, volume));
}

TEST_CASE("GAME-003-MS009 Moving Platform Framework Motion", "[MS009]")
{
    platform::Scene scene("Test Platform Scene");
    auto &registry = scene.GetRegistry();

    platform::MovingPlatformSystem platformSystem;
    platform::EntityID platform = registry.CreateEntity("MovingPlatform");

    auto &settings = registry.AddComponent<platform::PlatformSettingsComponent>(platform);
    registry.AddComponent<platform::PlatformRuntimeComponent>(platform);

    settings.waypoints = {{0.0f, 0.0f}, {10.0f, 0.0f}};
    settings.speed = 5.0f;

    platformSystem.Update(registry, 1.0);
    glm::vec2 pos = platformSystem.position(registry, platform);
    REQUIRE(pos.x > 0.0f);
}

TEST_CASE("GAME-003-MS010 Hazard Framework Activation & Damage", "[MS010]")
{
    platform::Scene scene("Test Hazard Scene");
    auto &registry = scene.GetRegistry();

    platform::HazardSystem hazardSystem;
    platform::EntityID hazard = registry.CreateEntity("Lava");
    platform::EntityID victim = registry.CreateEntity("Player");

    registry.AddComponent<platform::HazardSettingsComponent>(hazard);
    hazardSystem.activate(registry, hazard);
    REQUIRE(hazardSystem.isActive(registry, hazard));

    hazardSystem.damage(registry, hazard, victim);
    hazardSystem.kill(registry, hazard, victim);

    hazardSystem.deactivate(registry, hazard);
    REQUIRE_FALSE(hazardSystem.isActive(registry, hazard));
}

TEST_CASE("GAME-003-MS011 Checkpoint Timeline Framework State Preservation", "[MS011]")
{
    platform::Scene scene("Test Checkpoint Scene");
    auto &registry = scene.GetRegistry();

    platform::CheckpointTimelineSystem cpSystem;
    platform::EntityID cp = registry.CreateEntity("Checkpoint_1");

    cpSystem.activateCheckpoint(registry, cp, 120, 2.5, {15.0f, 0.0f});
    REQUIRE(cpSystem.isActive(registry, cp));

    uint64_t tickOut = 0;
    double timeOut = 0.0;
    glm::vec2 posOut{0.0f, 0.0f};

    REQUIRE(cpSystem.restoreCheckpoint(registry, cp, tickOut, timeOut, posOut));
    REQUIRE(tickOut == 120);
    REQUIRE(timeOut == 2.5);
    REQUIRE(posOut.x == 15.0f);
}
