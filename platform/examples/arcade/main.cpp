#include "engine/app/Application.hpp"
#include "engine/app/HeadlessOptions.hpp"
#include "engine/core/Logger.hpp"
#include "examples/arcade/ArcadeCommon.hpp"
#include "examples/arcade/BrickStormScene.hpp"
#include "examples/arcade/MenuScene.hpp"
#include "examples/arcade/VoidRunnerScene.hpp"

#include <memory>
#include <string>

namespace
{
    using namespace platform::arcade;

    /// Cabinet shell. Scenes ask for a screen change; the shell performs it from
    /// its own update, which runs after the scene update has returned — switching
    /// destroys the scene that made the request, so it must not happen inline.
    class ArcadeApp final : public platform::Application
    {
    public:
        explicit ArcadeApp(const platform::WindowConfig &config)
            : Application(config)
        {
        }

        void Boot(ArcadeScreen startScreen)
        {
            if (auto *engine = GetEngine())
            {
                m_session.Device = engine->GetInput();
                if (auto *renderer = engine->GetRenderer())
                {
                    // Scenes layer on top of the ECS pass, so the backdrop has to be
                    // the frame clear rather than a full-screen quad in OnRender.
                    renderer->SetClearColor(Palette::Background);
                }
            }
            Show(startScreen);
        }

        [[nodiscard]] ArcadeSession &GetSession() { return m_session; }

    protected:
        void OnUpdate(double dt) override
        {
            (void)dt;
            if (m_session.Requested == ArcadeScreen::None)
            {
                return;
            }

            const ArcadeScreen requested = m_session.Requested;
            m_session.Requested = ArcadeScreen::None;

            if (requested == ArcadeScreen::Quit)
            {
                if (auto *engine = GetEngine())
                {
                    engine->Stop();
                }
                return;
            }

            Show(requested);
        }

    private:
        void Show(ArcadeScreen screen)
        {
            auto *engine = GetEngine();
            if (!engine || !engine->GetSceneManager())
            {
                return;
            }

            std::unique_ptr<platform::Scene> scene;
            switch (screen)
            {
            case ArcadeScreen::BrickStorm:
                scene = std::make_unique<BrickStormScene>(&m_session);
                break;
            case ArcadeScreen::VoidRunner:
                scene = std::make_unique<VoidRunnerScene>(&m_session);
                break;
            case ArcadeScreen::Menu:
            default:
                scene = std::make_unique<MenuScene>(&m_session);
                break;
            }

            engine->GetSceneManager()->SwitchScene(std::move(scene));
        }

        ArcadeSession m_session;
    };

    ArcadeScreen ParseStartScreen(int argc, char **argv)
    {
        for (int i = 1; i < argc; ++i)
        {
            if (std::string(argv[i]) != "--game" || i + 1 >= argc)
            {
                continue;
            }

            const std::string name = argv[++i];
            if (name == "brick" || name == "brickstorm") return ArcadeScreen::BrickStorm;
            if (name == "void" || name == "voidrunner") return ArcadeScreen::VoidRunner;
            if (name == "menu") return ArcadeScreen::Menu;
        }
        return ArcadeScreen::Menu;
    }
}

int main(int argc, char **argv)
{
    const auto options = platform::HeadlessOptions::Parse(argc, argv);

    platform::WindowConfig config;
    config.Title = "ORBIT Arcade — Brick Storm / Void Runner";
    config.Width = static_cast<int>(kScreenWidth);
    config.Height = static_cast<int>(kScreenHeight);

    ArcadeApp app(config);
    if (!app.Initialize(config))
    {
        return -1;
    }

    options.Apply(app.GetEngine());
    app.Boot(ParseStartScreen(argc, argv));

    LOG_INFO("ORBIT Arcade ready. 1/2 or Up-Down + Enter to pick a game, Esc to go back.");

    app.Run();
    app.Shutdown();
    return 0;
}
