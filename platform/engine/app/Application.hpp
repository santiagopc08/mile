#ifndef PLATFORM_ENGINE_APP_APPLICATION_HPP
#define PLATFORM_ENGINE_APP_APPLICATION_HPP

#include "engine/app/Engine.hpp"
#include "engine/platform/WindowConfig.hpp"

#include <memory>
#include <string_view>

namespace platform
{
    class Application
    {
    public:
        Application();
        explicit Application(const WindowConfig &config);
        ~Application();

        bool Initialize(const WindowConfig &config);
        bool Initialize(std::string_view title = "Platform Application", int width = 1280, int height = 720);
        void Run();
        void Shutdown();

        [[nodiscard]] Engine *GetEngine() const { return m_engine.get(); }

    protected:
        virtual void OnUpdate(double dt) { (void)dt; }
        virtual void OnRender() {}

    private:
        std::unique_ptr<Engine> m_engine;
    };
}

#endif // PLATFORM_ENGINE_APP_APPLICATION_HPP
