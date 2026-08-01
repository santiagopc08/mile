#ifndef PLATFORM_ENGINE_APP_ENGINE_HPP
#define PLATFORM_ENGINE_APP_ENGINE_HPP

#include "engine/platform/IWindow.hpp"
#include "engine/platform/Platform.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/graphics/RenderSystem.hpp"
#include "engine/input/Input.hpp"
#include "engine/events/EventQueue.hpp"
#include "engine/scene/SceneManager.hpp"
#include "engine/core/time/FrameTimer.hpp"
#include "engine/core/time/FixedStepTimer.hpp"
#include "engine/core/time/Stopwatch.hpp"
#include "engine/app/LoopStatistics.hpp"

#include <memory>
#include <functional>
#include <string_view>

namespace platform
{
    class Engine
    {
    public:
        Engine();
        explicit Engine(const WindowConfig &config);
        ~Engine();

        bool Initialize(const WindowConfig &config = WindowConfig{});
        void Shutdown();
        void Run();
        void Stop();

        void SetApplicationCallbacks(std::function<void(double)> updateCallback, std::function<void()> renderCallback)
        {
            m_applicationUpdateCallback = std::move(updateCallback);
            m_applicationRenderCallback = std::move(renderCallback);
        }

        /// Stop the loop automatically after N rendered frames (0 = run until closed).
        /// Lets headless smoke tests drive a fixed number of frames and exit.
        void SetExitAfterFrames(uint64_t frames) { m_exitAfterFrames = frames; }

        /// Capture a fully drawn frame to a BMP file, once frame `atFrame` is reached.
        void RequestScreenshot(std::string filePath, uint64_t atFrame = 0)
        {
            m_screenshotPath = std::move(filePath);
            m_screenshotFrame = atFrame;
        }

        /// Tools such as the editor composite the scene themselves so they can layer a
        /// grid underneath and clip to a viewport panel; they turn the automatic pass off.
        void SetSceneRenderingEnabled(bool enabled) { m_sceneRenderingEnabled = enabled; }
        [[nodiscard]] bool IsSceneRenderingEnabled() const { return m_sceneRenderingEnabled; }

        // HANDBOOK-006 Pause state controls
        void Pause() { m_paused = true; }
        void Resume() { m_paused = false; }
        [[nodiscard]] bool IsPaused() const { return m_paused; }

        [[nodiscard]] IWindow *GetWindow() const { return m_window.get(); }
        [[nodiscard]] Renderer *GetRenderer() const { return m_renderer.get(); }
        [[nodiscard]] Input *GetInput() const { return m_input.get(); }
        [[nodiscard]] EventQueue *GetEventQueue() const { return m_eventQueue.get(); }
        [[nodiscard]] SceneManager *GetSceneManager() const { return m_sceneManager.get(); }
        [[nodiscard]] const FrameTimer &GetFrameTimer() const { return m_frameTimer; }
        [[nodiscard]] const FixedStepTimer &GetFixedStepTimer() const { return m_fixedTimer; }
        [[nodiscard]] const LoopStatistics &GetStatistics() const { return m_stats; }

    private:
        // Main Loop Stage Contracts (HANDBOOK-001 & HANDBOOK-006)
        void PollPlatform();
        void ProcessEvents();
        void UpdateTime();
        void UpdateInput();
        void FixedUpdate(double fixedDt);
        void VariableUpdate(double dt);
        void LateUpdate(double dt);
        void PrepareRender();
        void Render();
        void Present();
        void CollectDiagnostics();

        void HandleEvents(const Event &event);

        std::unique_ptr<IWindow> m_window;
        std::unique_ptr<Renderer> m_renderer;
        std::unique_ptr<Input> m_input;
        std::unique_ptr<EventQueue> m_eventQueue;
        std::unique_ptr<SceneManager> m_sceneManager;
        RenderSystem m_renderSystem;

        std::function<void(double)> m_applicationUpdateCallback;
        std::function<void()> m_applicationRenderCallback;

        FrameTimer m_frameTimer;
        FixedStepTimer m_fixedTimer;
        Stopwatch m_stageStopwatch;
        LoopStatistics m_stats{};

        uint64_t m_frameCounter{0};
        uint64_t m_exitAfterFrames{0};
        std::string m_screenshotPath;
        uint64_t m_screenshotFrame{0};
        bool m_running{false};
        bool m_initialized{false};
        bool m_paused{false};
        bool m_sceneRenderingEnabled{true};
    };
}

namespace orbit
{
    using Engine = platform::Engine;
    using WindowConfig = platform::WindowConfig;
    using IWindow = platform::IWindow;
    using Renderer = platform::Renderer;
    using Input = platform::Input;
    using EventQueue = platform::EventQueue;
    using SceneManager = platform::SceneManager;
}

#endif // PLATFORM_ENGINE_APP_ENGINE_HPP
