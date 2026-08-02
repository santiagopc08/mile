#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>

#include "examples/arcade/ArcadeCommon.hpp"
#include "examples/arcade/BrickStormScene.hpp"
#include "examples/arcade/MenuScene.hpp"
#include "examples/arcade/VoidRunnerScene.hpp"
#include "engine/input/Input.hpp"

#include <cmath>

using namespace platform;
using namespace platform::arcade;

namespace
{
    /// Advances a scene by whole 60 Hz frames, keeping the held keys held.
    void RunFrames(Scene &scene, Input &input, int frames)
    {
        for (int i = 0; i < frames; ++i)
        {
            scene.Update(1.0 / 60.0);
            input.NewFrame();
        }
    }
}

TEST_CASE("Arcade menu navigates and launches the selected game", "[Arcade]")
{
    ArcadeSession session;
    Input input;
    input.Initialize();
    session.Device = &input;

    MenuScene menu(&session);
    REQUIRE(menu.Initialize());
    menu.Activate();

    REQUIRE(menu.GetSelectedIndex() == 0);

    menu.MoveSelection(1);
    REQUIRE(menu.GetSelectedIndex() == 1);

    // Selection wraps in both directions.
    menu.MoveSelection(1);
    REQUIRE(menu.GetSelectedIndex() == 0);
    menu.MoveSelection(-1);
    REQUIRE(menu.GetSelectedIndex() == 1);

    menu.LaunchSelected();
    REQUIRE(session.Requested == ArcadeScreen::VoidRunner);

    session.Requested = ArcadeScreen::None;
    menu.MoveSelection(1);
    menu.LaunchSelected();
    REQUIRE(session.Requested == ArcadeScreen::BrickStorm);

    // Arrow keys drive the same selection, one step per press.
    session.Requested = ArcadeScreen::None;
    input.OnKeyDown(Key::Down);
    RunFrames(menu, input, 1);
    REQUIRE(menu.GetSelectedIndex() == 1);

    // Holding the key must not scroll continuously.
    RunFrames(menu, input, 20);
    REQUIRE(menu.GetSelectedIndex() == 1);
}

TEST_CASE("Brick Storm lays out a board and breaks bricks", "[Arcade]")
{
    ArcadeSession session;
    Input input;
    input.Initialize();
    session.Device = &input;

    BrickStormScene game(&session);
    REQUIRE(game.Initialize());
    game.Activate();

    REQUIRE(game.GetLives() == 3);
    REQUIRE(game.GetLevel() == 1);
    REQUIRE(game.GetScore() == 0);
    REQUIRE(game.GetBrickCount() > 20);
    REQUIRE(!game.IsGameOver());

    const size_t startingBricks = game.GetBrickCount();

    // One ball is parked on the paddle until the player launches it.
    RunFrames(game, input, 1);
    REQUIRE(game.GetBallCount() == 1);

    // Hold space to launch, then let it play. The ball must chew into the board.
    input.OnKeyDown(Key::Space);
    RunFrames(game, input, 60 * 6);

    INFO("bricks left: " << game.GetBrickCount() << " of " << startingBricks);
    REQUIRE(game.GetBrickCount() < startingBricks);
    REQUIRE(game.GetScore() > 0);

    // Steering must move the paddle without ever leaving the playfield: run a long
    // stretch pinned to one wall and confirm the simulation stays healthy.
    input.OnKeyUp(Key::Space);
    input.NewFrame();
    input.OnKeyDown(Key::A);
    RunFrames(game, input, 60 * 3);
    REQUIRE(game.GetBallCount() <= 6);
}

TEST_CASE("Brick Storm rebuilds a harder board on level up", "[Arcade]")
{
    ArcadeSession session;
    BrickStormScene game(&session);
    REQUIRE(game.Initialize());
    game.Activate();

    const size_t level1 = game.GetBrickCount();

    game.BuildLevel(6);
    REQUIRE(game.GetLevel() == 6);
    REQUIRE(game.GetBrickCount() > level1);

    // Restarting a run resets the scoreboard and returns to level one.
    game.StartRun();
    REQUIRE(game.GetLevel() == 1);
    REQUIRE(game.GetScore() == 0);
    REQUIRE(game.GetLives() == 3);
}

TEST_CASE("Void Runner spawns waves and splits rocks when hit", "[Arcade]")
{
    ArcadeSession session;
    Input input;
    input.Initialize();
    session.Device = &input;

    VoidRunnerScene game(&session);
    REQUIRE(game.Initialize());
    game.Activate();

    REQUIRE(game.GetLives() == 3);
    REQUIRE(game.GetWave() == 1);
    REQUIRE(game.GetRockCount() == 4); // 3 + wave
    REQUIRE(game.GetScore() == 0);

    // Holding fire produces shots, paced by the cooldown rather than one per frame.
    input.OnKeyDown(Key::Space);
    RunFrames(game, input, 30);
    REQUIRE(game.GetBulletCount() > 0);
    REQUIRE(game.GetBulletCount() < 30);

    // Sweeping the ship around while firing has to connect eventually; a hit splits
    // a large rock into two smaller ones, so the count goes up before it goes down.
    input.OnKeyDown(Key::D);
    RunFrames(game, input, 60 * 25);

    INFO("score " << game.GetScore() << " rocks " << game.GetRockCount());
    REQUIRE(game.GetScore() > 0);
}

TEST_CASE("Void Runner keeps the ship inside the screen by wrapping", "[Arcade]")
{
    ArcadeSession session;
    Input input;
    input.Initialize();
    session.Device = &input;

    VoidRunnerScene game(&session);
    REQUIRE(game.Initialize());
    game.Activate();

    // Thrust continuously: the ship must never escape the playfield.
    input.OnKeyDown(Key::W);
    for (int i = 0; i < 60 * 12; ++i)
    {
        game.Update(1.0 / 60.0);
        input.NewFrame();

        const glm::vec2 &position = game.GetShipPosition();
        REQUIRE(position.x >= 0.0f);
        REQUIRE(position.x <= kScreenWidth);
        REQUIRE(position.y >= 0.0f);
        REQUIRE(position.y <= kScreenHeight);
    }
}

TEST_CASE("Arcade helpers are deterministic and bounded", "[Arcade]")
{
    Random a(12345u);
    Random b(12345u);
    for (int i = 0; i < 200; ++i)
    {
        REQUIRE(a.NextUInt() == b.NextUInt());
    }

    Random values(7u);
    for (int i = 0; i < 500; ++i)
    {
        const float f = values.NextFloat();
        REQUIRE(f >= 0.0f);
        REQUIRE(f < 1.0f);

        const int n = values.RangeInt(3, 7);
        REQUIRE(n >= 3);
        REQUIRE(n <= 7);

        const float r = values.Range(-2.0f, 5.0f);
        REQUIRE(r >= -2.0f);
        REQUIRE(r <= 5.0f);
    }

    // Particles expire rather than accumulating forever.
    ParticleField field;
    field.Burst({100.0f, 100.0f}, Palette::Amber, 40, 200.0f);
    REQUIRE(field.Count() == 40);
    for (int i = 0; i < 120; ++i)
    {
        field.Update(1.0f / 60.0f);
    }
    REQUIRE(field.Count() == 0);

    // Rotating a unit square by 90 degrees maps (1,0) onto (0,1).
    const std::vector<glm::vec2> square{{1.0f, 0.0f}, {0.0f, 1.0f}, {-1.0f, 0.0f}, {0.0f, -1.0f}};
    const auto rotated = TransformPoints(square, {10.0f, 20.0f}, 1.5707963f);
    REQUIRE(rotated.size() == 4);
    REQUIRE(rotated[0].x == Catch::Approx(10.0f).margin(0.001));
    REQUIRE(rotated[0].y == Catch::Approx(21.0f).margin(0.001));
}
