#include "engine/app/Engine.hpp"
#include "engine/core/Logger.hpp"
#include "engine/platform/SDLWindow.hpp"
#include "engine/platform/EventPump.hpp"
#include "engine/events/ApplicationEvents.hpp"
#include "engine/events/WindowEvents.hpp"

namespace platform
{
    Engine::Engine() = default;

    Engine::Engine(const WindowConfig &config)
    {
        Initialize(config);
    }

    Engine::~Engine()
    {
        Shutdown();
    }

    bool Engine::Initialize(const WindowConfig &config)
    {
        if (m_initialized)
        {
            LOG_WARN("[Engine] Engine already initialized.");
            return true;
        }

        Logger::Initialize();
        LOG_INFO("[Engine] Initializing Engine platform layer...");

        if (!Platform::Initialize())
        {
            LOG_ERROR("[Engine] Failed to initialize Platform layer.");
            return false;
        }

        // Module Initialization Order (HANDBOOK-001)
        m_eventQueue = std::make_unique<EventQueue>();
        m_eventQueue->Subscribe([this](const Event &event) {
            HandleEvents(event);
        });

        m_input = std::make_unique<Input>();
        m_input->SetEventQueue(m_eventQueue.get());
        m_input->Initialize();

        m_window = std::make_unique<SDLWindow>();
        if (!m_window->Create(config))
        {
            LOG_ERROR("[Engine] Failed to create Window.");
            Shutdown(); // Atomic Rollback on failure
            return false;
        }

        m_renderer = std::make_unique<Renderer>();
        if (!m_renderer->Initialize(m_window.get()))
        {
            LOG_ERROR("[Engine] Failed to initialize Renderer.");
            Shutdown(); // Atomic Rollback on failure
            return false;
        }

        m_sceneManager = std::make_unique<SceneManager>();
        auto defaultScene = std::make_unique<Scene>("Default Scene");
        m_sceneManager->LoadScene(std::move(defaultScene));

        m_frameTimer.Reset();
        m_fixedTimer.Reset();

        // Dispatch initial runtime events
        m_eventQueue->DispatchImmediate(ApplicationStartedEvent());
        m_eventQueue->DispatchImmediate(WindowCreatedEvent(config.Width, config.Height));

        m_initialized = true;
        m_running = true;
        m_paused = false;
        LOG_INFO("[Engine] Engine initialized successfully.");
        return true;
    }

    void Engine::Shutdown()
    {
        if (!m_initialized)
        {
            return;
        }

        Stop();
        LOG_INFO("[Engine] Shutting down Engine modules in reverse order (HANDBOOK-001)...");

        if (m_eventQueue)
        {
            m_eventQueue->DispatchImmediate(ApplicationClosingEvent());
        }

        // 1. Scene Manager
        if (m_sceneManager)
        {
            m_sceneManager->UnloadScene();
            m_sceneManager.reset();
        }

        // 2. Renderer
        m_renderer.reset();

        // 3. Window
        m_window.reset();

        // 4. Input & EventQueue
        m_input.reset();
        m_eventQueue.reset();

        // 5. Platform
        Platform::Shutdown();
        m_initialized = false;
        LOG_INFO("[Engine] Engine shutdown complete.");
    }

    void Engine::Run()
    {
        if (!m_initialized)
        {
            LOG_ERROR("[Engine] Cannot run Engine: Not initialized.");
            return;
        }

        LOG_INFO("[Engine] Entering Engine main loop.");

        while (m_running && m_window && m_window->IsOpen())
        {
            m_stageStopwatch.Restart();

            // Main Loop Stage Contracts (HANDBOOK-001 & HANDBOOK-006)
            PollPlatform();
            ProcessEvents();

            if (!m_running || !m_window->IsOpen())
            {
                break;
            }

            UpdateTime();
            UpdateInput();

            double dt = m_frameTimer.DeltaTime();

            // HANDBOOK-006: Pause suspends simulation (FixedUpdate), but UI, Diagnostics, Rendering continue
            if (!m_paused)
            {
                FixedUpdate(static_cast<double>(m_fixedTimer.FixedDeltaTime()));
            }

            VariableUpdate(dt);
            LateUpdate(dt);

            PrepareRender();
            Render();

            if (!m_screenshotPath.empty() && m_renderer && m_frameCounter >= m_screenshotFrame)
            {
                // Flush before presenting: reading pixels after the swap is not reliable.
                m_renderer->ExecuteCommands();
                m_renderer->SaveScreenshot(m_screenshotPath);
                m_screenshotPath.clear();
            }

            Present();

            CollectDiagnostics();

            m_frameCounter++;

            if (m_exitAfterFrames != 0 && m_frameCounter >= m_exitAfterFrames)
            {
                LOG_INFO("[Engine] Frame limit of {} reached; stopping.", m_exitAfterFrames);
                Stop();
            }
        }

        LOG_INFO("[Engine] Exiting Engine main loop.");
    }

    void Engine::Stop()
    {
        m_running = false;
    }

    void Engine::PollPlatform()
    {
        if (m_eventQueue && m_input)
        {
            EventPump::Poll(*m_eventQueue, *m_input);
        }
    }

    void Engine::ProcessEvents()
    {
        if (m_eventQueue)
        {
            m_eventQueue->ProcessEvents();
        }
    }

    void Engine::UpdateTime()
    {
        m_frameTimer.Tick();
        m_eventQueue->Push(std::make_shared<FrameStartedEvent>(m_frameCounter));
    }

    void Engine::UpdateInput()
    {
    }

    void Engine::FixedUpdate(double fixedDt)
    {
        if (m_sceneManager)
        {
            m_sceneManager->FixedUpdate(fixedDt);
        }
    }

    void Engine::VariableUpdate(double dt)
    {
        if (m_sceneManager)
        {
            m_sceneManager->Update(dt);
        }

        if (m_applicationUpdateCallback)
        {
            m_applicationUpdateCallback(dt);
        }
    }

    void Engine::LateUpdate(double dt)
    {
        (void)dt;
    }

    void Engine::PrepareRender()
    {
        if (m_sceneManager)
        {
            m_sceneManager->PrepareRender();
        }
    }

    void Engine::Render()
    {
        if (m_renderer)
        {
            m_renderer->BeginFrame();

            if (m_sceneRenderingEnabled && m_sceneManager && m_sceneManager->HasActiveScene())
            {
                auto *scene = m_sceneManager->GetActiveScene();
                const auto *camera = scene->GetActiveCamera();
                m_renderSystem.RenderScene(
                    scene->GetRegistry(),
                    *m_renderer,
                    camera ? *camera : m_renderer->GetCamera()
                );
                scene->Render(*m_renderer);
            }

            if (m_applicationRenderCallback)
            {
                m_applicationRenderCallback();
            }
        }
    }

    void Engine::Present()
    {
        if (m_renderer)
        {
            m_renderer->Present();
        }
        m_eventQueue->Push(std::make_shared<FrameEndedEvent>(m_frameCounter));
    }

    void Engine::CollectDiagnostics()
    {
        m_stats.CpuTimeMs = m_stageStopwatch.ElapsedMilliseconds();
        m_stats.FrameTimeMs = m_frameTimer.FrameTimeMs();
        m_stats.FPS = m_frameTimer.FPS();
        m_stats.EventCount = m_eventQueue ? m_eventQueue->GetDiagnostics().TotalProcessed : 0;
        m_stats.FrameNumber = m_frameCounter;
    }

    void Engine::HandleEvents(const Event &event)
    {
        switch (event.GetEventType())
        {
        case EventType::WindowClosed:
        case EventType::ApplicationClosing:
        {
            LOG_INFO("[Engine] Quit event received. Stopping engine...");
            Stop();
            break;
        }
        case EventType::WindowResized:
        {
            const auto &resizedEvent = static_cast<const WindowResizedEvent &>(event);
            LOG_INFO("[Engine] Window resized to {}x{}.", resizedEvent.GetWidth(), resizedEvent.GetHeight());
            if (m_renderer && m_window)
            {
                // Re-query the window: the same event is also raised for pixel-size
                // changes, whose payload is in pixels rather than points.
                int w = 0, h = 0;
                m_window->GetSize(w, h);
                m_renderer->SetLogicalSize(w, h);
            }
            break;
        }
        default:
            break;
        }
    }
}
