#include <catch2/catch_test_macros.hpp>

#include "engine/save/SaveManager.hpp"
#include "engine/gameplay/stats/StatisticsManager.hpp"
#include "engine/settings/UserSettings.hpp"
#include "engine/gameplay/achievements/AchievementSystem.hpp"
#include "engine/diagnostics/GameProfiler.hpp"

TEST_CASE("GAME-001-MS028 Save & Load System", "[MS028]")
{
    platform::SaveManager saveManager;
    platform::SaveSlotData data{};
    data.distanceMeters = 1500.0;
    data.score = 3500;
    data.coinsCollected = 25;

    REQUIRE(saveManager.save("Slot 1", data));
    REQUIRE(saveManager.validateSave("Slot 1"));

    platform::SaveSlotData loadedData{};
    REQUIRE(saveManager.load("Slot 1", loadedData));
    REQUIRE(loadedData.distanceMeters == 1500.0);
    REQUIRE(loadedData.score == 3500);

    auto list = saveManager.listSaves();
    REQUIRE(list.size() == 1);
    REQUIRE(list[0] == "Slot 1");

    saveManager.deleteSave("Slot 1");
    REQUIRE_FALSE(saveManager.validateSave("Slot 1"));
}

TEST_CASE("GAME-001-MS029 Statistics Framework Validation", "[MS029]")
{
    platform::StatisticsManager statsManager;
    statsManager.RecordDistance(2000.0);
    statsManager.RecordCoin();
    statsManager.RecordScore(5000);
    statsManager.RecordRecovery();

    const auto &stats = statsManager.statistics();
    REQUIRE(stats.distanceMeters == 2000.0);
    REQUIRE(stats.coinsCollected == 1);
    REQUIRE(stats.highestScore == 5000);
    REQUIRE(stats.recoveries == 1);

    std::string json = statsManager.exportStatistics();
    REQUIRE_FALSE(json.empty());
    REQUIRE(json.find("\"highestScore\": 5000") != std::string::npos);

    statsManager.resetStatistics();
    REQUIRE(statsManager.statistics().distanceMeters == 0.0);
}

TEST_CASE("GAME-001-MS030 User Settings", "[MS030]")
{
    platform::UserSettings userSettings;
    REQUIRE(userSettings.loadSettings());
    userSettings.applySettings();

    auto &settings = userSettings.GetSettingsMutable();
    settings.masterVolume = 0.5f;
    settings.vsync = false;
    REQUIRE(userSettings.saveSettings());

    userSettings.resetDefaults();
    REQUIRE(userSettings.GetSettings().masterVolume == 1.0f);
    REQUIRE(userSettings.GetSettings().vsync);
}

TEST_CASE("GAME-001-MS031 Achievement Framework Validation", "[MS031]")
{
    platform::AchievementSystem achievements;

    REQUIRE_FALSE(achievements.isUnlocked("FirstCoin"));
    achievements.unlock("FirstCoin");
    REQUIRE(achievements.isUnlocked("FirstCoin"));
    REQUIRE(achievements.GetUnlockedCount() == 1);

    achievements.resetAchievements();
    REQUIRE_FALSE(achievements.isUnlocked("FirstCoin"));
    REQUIRE(achievements.GetUnlockedCount() == 0);
}

TEST_CASE("GAME-001-MS032 Game Optimization & Profiler Budgets", "[MS032]")
{
    platform::GameProfiler profiler;
    REQUIRE(profiler.ValidatePerformanceBudgets());

    auto metrics = profiler.GetProfilerMetrics();
    REQUIRE(metrics.cpuTimeMs < 2.0);
    REQUIRE(metrics.currentState == "60 FPS Stable");
}
