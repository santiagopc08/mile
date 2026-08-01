#include <catch2/catch_test_macros.hpp>
#include "engine/platform/Platform.hpp"
#include "engine/platform/IWindow.hpp"
#include "engine/platform/SDLWindow.hpp"
#include "engine/platform/WindowConfig.hpp"
#include "engine/platform/Timer.hpp"
#include "engine/platform/Clipboard.hpp"
#include "engine/platform/Cursor.hpp"
#include "engine/platform/Monitor.hpp"
#include "engine/events/EventQueue.hpp"
#include "engine/events/ApplicationEvents.hpp"
#include "engine/events/WindowEvents.hpp"

TEST_CASE("Platform Subsystem Initialization", "[Platform]")
{
    REQUIRE(platform::Platform::Initialize());
    REQUIRE(platform::Platform::IsInitialized());
    REQUIRE(platform::Platform::GetLastError().empty());
}

TEST_CASE("Monitor Enumeration", "[Platform]")
{
    platform::Platform::Initialize();
    auto primary = platform::Monitor::GetPrimaryMonitor();
    REQUIRE(primary.Width > 0);
    REQUIRE(primary.Height > 0);

    auto monitors = platform::Monitor::GetMonitors();
    REQUIRE_FALSE(monitors.empty());
}

TEST_CASE("Clipboard Operations", "[Platform]")
{
    platform::Platform::Initialize();
    bool setOk = platform::Clipboard::SetText("ORBIT Platform Text");
    if (setOk)
    {
        REQUIRE(platform::Clipboard::HasText());
        REQUIRE(platform::Clipboard::GetText() == "ORBIT Platform Text");
    }
    else
    {
        // On headless / CI sandbox environment without window focus
        REQUIRE(platform::Platform::IsInitialized());
    }
}

TEST_CASE("Cursor Controls", "[Platform]")
{
    platform::Platform::Initialize();
    platform::Cursor::Hide();
    REQUIRE_FALSE(platform::Cursor::IsVisible());

    platform::Cursor::Show();
    REQUIRE(platform::Cursor::IsVisible());

    platform::Cursor::SetSystemCursor(platform::SystemCursor::Hand);
}

TEST_CASE("Timer Resolution and Metrics", "[Platform]")
{
    platform::Timer timer;
    REQUIRE(timer.GetTicksMilliseconds() > 0);
    REQUIRE(timer.GetTicksNanoseconds() > 0);

    timer.Tick();
    REQUIRE(timer.GetElapsedTimeSeconds() >= 0.0);
}

TEST_CASE("EventQueue Double Buffering and Dispatch", "[Events]")
{
    platform::EventQueue queue;
    bool immediateFired = false;
    bool deferredFired = false;

    queue.Subscribe([&](const platform::Event &event) {
        if (event.GetEventType() == platform::EventType::ApplicationStarted)
        {
            immediateFired = true;
        }
        else if (event.GetEventType() == platform::EventType::WindowResized)
        {
            deferredFired = true;
        }
    });

    // Immediate dispatch test
    queue.DispatchImmediate(platform::ApplicationStartedEvent());
    REQUIRE(immediateFired);

    // Deferred queue test
    queue.Push(std::make_shared<platform::WindowResizedEvent>(1920, 1080));
    REQUIRE(queue.GetDiagnostics().QueueDepth == 1);
    REQUIRE_FALSE(deferredFired);

    queue.ProcessEvents();
    REQUIRE(deferredFired);
    REQUIRE(queue.GetDiagnostics().TotalProcessed >= 1);
    REQUIRE(queue.GetDiagnostics().QueueDepth == 0);
}

TEST_CASE("SDLWindow Abstraction and WindowConfig", "[Window]")
{
    platform::Platform::Initialize();

    platform::WindowConfig config;
    config.Title = "Test Window Title";
    config.Width = 800;
    config.Height = 600;
    config.Resizable = true;

    platform::SDLWindow window(config);
    REQUIRE(window.IsOpen());

    int width = 0, height = 0;
    window.GetSize(width, height);
    REQUIRE(width == 800);
    REQUIRE(height == 600);

    window.Resize(1024, 768);
    window.GetSize(width, height);
    REQUIRE(width == 1024);
    REQUIRE(height == 768);

    window.Close();
    REQUIRE_FALSE(window.IsOpen());
}
