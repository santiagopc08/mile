#include "engine/app/Application.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    Application::Application()
        : m_engine(std::make_unique<Engine>())
    {
    }

    Application::Application(const WindowConfig &config)
        : m_engine(std::make_unique<Engine>(config))
    {
    }

    Application::~Application() = default;

    bool Application::Initialize(const WindowConfig &config)
    {
        if (!m_engine)
        {
            m_engine = std::make_unique<Engine>();
        }
        return m_engine->Initialize(config);
    }

    bool Application::Initialize(std::string_view title, int width, int height)
    {
        WindowConfig config;
        config.Title = std::string(title);
        config.Width = width;
        config.Height = height;
        return Initialize(config);
    }

    void Application::Run()
    {
        if (m_engine)
        {
            m_engine->SetApplicationCallbacks(
                [this](double dt) { OnUpdate(dt); },
                [this]() { OnRender(); }
            );
            m_engine->Run();
        }
    }

    void Application::Shutdown()
    {
        if (m_engine)
        {
            m_engine->Stop();
            m_engine.reset();
        }
    }
}
