#include <catch2/catch_test_macros.hpp>

#include "engine/scene/Scene.hpp"
#include "engine/level/LevelSettingsComponent.hpp"
#include "engine/level/LevelRuntimeComponent.hpp"
#include "engine/level/LevelSystem.hpp"
#include "engine/level/npc/NPCSystem.hpp"
#include "engine/level/dialogue/DialogueSystem.hpp"
#include "engine/level/boss/BossSystem.hpp"
#include "engine/level/portal/PortalSystem.hpp"
#include "engine/level/progression/ProgressionSystem.hpp"

TEST_CASE("GAME-002-MS020 Level Framework Lifecycle & State", "[MS020]")
{
    platform::Scene scene("Test Level Scene");
    auto &registry = scene.GetRegistry();

    platform::LevelSystem levelSystem;
    platform::EntityID level = registry.CreateEntity("Level_1");

    REQUIRE(levelSystem.loadLevel(registry, level, 1, "Level 1-1"));
    REQUIRE(levelSystem.levelState(registry, level) == platform::LevelState::Playing);

    levelSystem.Update(registry, 0.5);
    REQUIRE(levelSystem.playTime(registry, level) >= 0.5f);

    levelSystem.completeLevel(registry, level);
    REQUIRE(levelSystem.isCompleted(registry, level));

    // Profiler metrics check (POLICY-006)
    auto metrics = levelSystem.GetProfilerMetrics();
    REQUIRE(metrics.currentState == "Active");
}

TEST_CASE("GAME-002-MS021 NPC Framework Conversations", "[MS021]")
{
    platform::Scene scene("Test NPC Scene");
    auto &registry = scene.GetRegistry();

    platform::NPCSystem npcSystem;
    platform::EntityID npc = registry.CreateEntity("QuestNPC");
    platform::EntityID player = registry.CreateEntity("Player");

    REQUIRE(npcSystem.state(registry, npc) == platform::NPCState::Idle);
    REQUIRE(npcSystem.interact(registry, npc, player));
    REQUIRE(npcSystem.state(registry, npc) == platform::NPCState::Talking);

    npcSystem.endConversation(registry, npc);
    REQUIRE(npcSystem.state(registry, npc) == platform::NPCState::Idle);
}

TEST_CASE("GAME-002-MS022 Dialogue Framework Tree Traversal", "[MS022]")
{
    platform::Scene scene("Test Dialogue Scene");
    auto &registry = scene.GetRegistry();

    platform::DialogueSystem dialogueSystem;
    platform::EntityID entity = registry.CreateEntity("DialogueEntity");

    dialogueSystem.startDialogue(registry, entity, 101);
    REQUIRE(dialogueSystem.dialogueState(registry, entity) == platform::DialogueState::Active);

    REQUIRE(dialogueSystem.advance(registry, entity));
    REQUIRE(dialogueSystem.advance(registry, entity));
    REQUIRE_FALSE(dialogueSystem.advance(registry, entity)); // Reached totalNodes (3)
    REQUIRE(dialogueSystem.dialogueState(registry, entity) == platform::DialogueState::Finished);
}

TEST_CASE("GAME-002-MS023 Boss Framework Encounter Phases & Enrage", "[MS023]")
{
    platform::Scene scene("Test Boss Scene");
    auto &registry = scene.GetRegistry();

    platform::BossSystem bossSystem;
    platform::EntityID boss = registry.CreateEntity("Boss");

    bossSystem.startBoss(registry, boss);
    REQUIRE(bossSystem.currentPhase(registry, boss) == 1);

    bossSystem.changePhase(registry, boss, 2);
    REQUIRE(bossSystem.currentPhase(registry, boss) == 2);

    bossSystem.enrage(registry, boss);
    REQUIRE(bossSystem.isEnraged(registry, boss));

    bossSystem.finishBoss(registry, boss);
    REQUIRE(bossSystem.isDefeated(registry, boss));
}

TEST_CASE("GAME-002-MS024 Portal Framework Transitions", "[MS024]")
{
    platform::Scene scene("Test Portal Scene");
    auto &registry = scene.GetRegistry();

    platform::PortalSystem portalSystem;
    platform::EntityID portal = registry.CreateEntity("Portal");
    platform::EntityID traveler = registry.CreateEntity("Player");

    REQUIRE(portalSystem.isActive(registry, portal));
    REQUIRE(portalSystem.travel(registry, portal, traveler));
    REQUIRE(portalSystem.isOccupied(registry, portal));

    portalSystem.cancelTravel(registry, portal);
    REQUIRE_FALSE(portalSystem.isOccupied(registry, portal));
}

TEST_CASE("GAME-002-MS025 Progression Framework Persistence & Unlocks", "[MS025]")
{
    platform::Scene scene("Test Progression Scene");
    auto &registry = scene.GetRegistry();

    platform::ProgressionSystem progressionSystem;
    platform::EntityID player = registry.CreateEntity("Player");

    REQUIRE(progressionSystem.isUnlocked(registry, player, 1));
    REQUIRE_FALSE(progressionSystem.isUnlocked(registry, player, 2));

    progressionSystem.complete(registry, player, 1);
    REQUIRE(progressionSystem.isUnlocked(registry, player, 2));
    REQUIRE(progressionSystem.completionPercentage(registry, player) == 100.0f);
}
