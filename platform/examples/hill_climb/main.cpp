#include "engine/app/Application.hpp"
#include "engine/app/HeadlessOptions.hpp"
#include "examples/hill_climb/NativeHillClimbScene.hpp"
#include "engine/core/Logger.hpp"

namespace
{
    /// Thin shell around the engine loop that owns the quit shortcut.
    class HillClimbApp final : public platform::Application
    {
    public:
        explicit HillClimbApp(const platform::WindowConfig &config)
            : Application(config)
        {
        }

    protected:
        void OnUpdate(double dt) override
        {
            (void)dt;
            auto *engine = GetEngine();
            auto *input = engine ? engine->GetInput() : nullptr;
            if (input && input->IsKeyPressed(platform::Key::Escape))
            {
                engine->Stop();
            }
        }
    };
}

int main(int argc, char **argv)
{
    const auto options = platform::HeadlessOptions::Parse(argc, argv);

    platform::WindowConfig config;
    config.Title = "Hill Climb Native — Drive Test";
    config.Width = 1280;
    config.Height = 720;

    HillClimbApp app(config);
    if (!app.Initialize(config))
    {
        return -1;
    }

    auto *engine = app.GetEngine();
    options.Apply(engine);

    if (engine && engine->GetSceneManager())
    {
        auto scene = std::make_unique<platform::NativeHillClimbScene>();
        scene->BindInput(engine->GetInput());
        engine->GetSceneManager()->LoadScene(std::move(scene));
    }

    LOG_INFO("Hill Climb Native ready. D/Right accelerate, A/Left brake-reverse, R restart, Esc quit.");

    app.Run();
    app.Shutdown();
    return 0;
}
