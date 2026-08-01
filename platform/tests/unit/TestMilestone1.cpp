#include <catch2/catch_test_macros.hpp>
#include <catch2/catch_approx.hpp>
#include "engine/core/time/Clock.hpp"
#include "engine/core/time/FrameTimer.hpp"
#include "engine/core/time/FixedStepTimer.hpp"
#include "engine/core/time/Stopwatch.hpp"
#include "engine/input/Input.hpp"
#include "engine/input/KeyCodes.hpp"
#include "engine/input/InputSnapshot.hpp"
#include "engine/graphics/Camera2D.hpp"
#include "engine/graphics/RenderContext.hpp"
#include "engine/graphics/RenderCommandQueue.hpp"
#include "engine/app/Engine.hpp"
#include "engine/platform/Platform.hpp"
#include <thread>
#include <chrono>

TEST_CASE("Clock Precision and Conversions", "[Time]")
{
    auto t1 = platform::Clock::Now();
    std::this_thread::sleep_for(std::chrono::milliseconds(5));
    auto t2 = platform::Clock::Now();

    uint64_t ns = platform::Clock::NanosecondsBetween(t1, t2);
    uint64_t ms = platform::Clock::MillisecondsBetween(t1, t2);
    double sec = platform::Clock::SecondsBetween(t1, t2);

    REQUIRE(ns > 0);
    REQUIRE(ms >= 4);
    REQUIRE(sec > 0.003);
}

TEST_CASE("FrameTimer Metrics and Smoothing", "[Time]")
{
    platform::FrameTimer timer;
    timer.Reset();

    std::this_thread::sleep_for(std::chrono::milliseconds(16));
    timer.Tick();

    REQUIRE(timer.FrameNumber() == 1);
    REQUIRE(timer.DeltaTime() > 0.01);
    REQUIRE(timer.FPS() > 0.0);
    REQUIRE(timer.FrameTimeMs() >= 10.0);
}

TEST_CASE("FixedStepTimer Accumulator and Alpha", "[Time]")
{
    platform::FixedStepTimer timer(60.0); // 16.66ms per step
    timer.Reset();

    uint32_t stepCount = 0;
    // Accumulate 33.33ms (should execute 2 steps at 60Hz)
    uint64_t deltaNs = 33'333'333ULL;
    uint32_t executed = timer.Accumulate(deltaNs, [&](double fixedDt) {
        REQUIRE(fixedDt == Catch::Approx(1.0 / 60.0));
        stepCount++;
    });

    REQUIRE(executed == 2);
    REQUIRE(stepCount == 2);
    REQUIRE(timer.Alpha() >= 0.0);
    REQUIRE(timer.Alpha() <= 1.0);
}

TEST_CASE("Stopwatch Sub-Microsecond Precision", "[Time]")
{
    platform::Stopwatch sw;
    sw.Start();
    std::this_thread::sleep_for(std::chrono::microseconds(100));
    sw.Stop();

    REQUIRE(sw.ElapsedNanoseconds() > 0);
    REQUIRE(sw.ElapsedMicroseconds() >= 80);
    REQUIRE(sw.ElapsedMilliseconds() >= 0.08);

    sw.Restart();
    REQUIRE(sw.IsRunning());
    sw.Stop();
    REQUIRE_FALSE(sw.IsRunning());
}

TEST_CASE("Input State Transitions and Immutable Snapshot", "[Input]")
{
    platform::Input input;
    input.Initialize();

    input.OnKeyDown(platform::Key::W);
    REQUIRE(input.IsKeyPressed(platform::Key::W));

    auto snapshot = input.CreateSnapshot();
    REQUIRE(snapshot->IsKeyPressed(platform::Key::W));

    // Next frame transition: Pressed -> Held
    input.NewFrame();
    REQUIRE(input.IsKeyHeld(platform::Key::W));
    REQUIRE_FALSE(input.IsKeyPressed(platform::Key::W));

    input.OnKeyUp(platform::Key::W);
    REQUIRE(input.IsKeyReleased(platform::Key::W));

    input.Shutdown();
}

TEST_CASE("Camera2D Orthographic Projection Matrix", "[Graphics]")
{
    platform::Camera2D camera(1280.0f, 720.0f);
    camera.SetPosition({100.0f, 50.0f});
    camera.SetZoom(2.0f);

    REQUIRE(camera.GetPosition().x == 100.0f);
    REQUIRE(camera.GetPosition().y == 50.0f);
    REQUIRE(camera.GetZoom() == 2.0f);

    const auto &vp = camera.GetViewProjectionMatrix();
    REQUIRE(vp != glm::mat4(1.0f));
}

TEST_CASE("RenderContext Default Clear Color", "[Graphics]")
{
    platform::RenderContext context;
    // Default clear color: RGB(25, 25, 25) -> ~0.098f
    REQUIRE(context.ClearColor.r == Catch::Approx(0.098039f));
    REQUIRE(context.ClearColor.g == Catch::Approx(0.098039f));
    REQUIRE(context.ClearColor.b == Catch::Approx(0.098039f));
    REQUIRE(context.ClearColor.a == 1.0f);
}

TEST_CASE("Engine Main Loop Lifecycle and Statistics", "[Engine]")
{
    platform::WindowConfig config;
    config.Title = "Runtime Loop Unit Test";
    config.Width = 640;
    config.Height = 480;

    platform::Engine engine;
    REQUIRE(engine.Initialize(config));

    REQUIRE(engine.GetWindow() != nullptr);
    REQUIRE(engine.GetRenderer() != nullptr);
    REQUIRE(engine.GetInput() != nullptr);
    REQUIRE(engine.GetEventQueue() != nullptr);

    engine.Stop();
}
