#include "examples/arcade/MenuScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <cmath>
#include <cstdio>
#include <memory>

namespace platform::arcade
{
    namespace
    {
        std::string Score(int value)
        {
            char buffer[32];
            std::snprintf(buffer, sizeof(buffer), "%06d", value);
            return std::string(buffer);
        }
    }

    MenuScene::MenuScene(ArcadeSession *session)
        : ArcadeScene("Arcade Menu", session)
    {
        m_entries[0] = {
            "BRICK STORM",
            "Break every block. Catch the drops. Do not lose the ball.",
            "A / D or LEFT / RIGHT to steer      SPACE to launch",
            ArcadeScreen::BrickStorm,
            Palette::Cyan,
        };
        m_entries[1] = {
            "VOID RUNNER",
            "Rotate, thrust and shatter the rocks before they shatter you.",
            "A / D rotate      W thrust      SPACE fire",
            ArcadeScreen::VoidRunner,
            Palette::Magenta,
        };
        m_entries[2] = {
            "CYBER VIPER",
            "Speed through the vector grid, consume energy cores and boost your trail.",
            "W / A / S / D or ARROWS to turn      SPACE to deploy",
            ArcadeScreen::CyberViper,
            Palette::Lime,
        };
        m_entries[3] = {
            "TETRIS MATRIX",
            "Guideline 7-bag block stacking, SRS wall kicks, hold piece and line clears.",
            "LEFT / RIGHT move      UP / X rotate      SPACE hard drop      C hold",
            ArcadeScreen::TetrisMatrix,
            Palette::Amber,
        };
        m_entries[4] = {
            "BALL SHOOTERS",
            "Aim and fire a stream of balls to smash numbered blocks before they reach the floor.",
            "A / D or ARROWS aim      SPACE / ENTER fire volley",
            ArcadeScreen::BallShooter,
            Palette::Cyan,
        };
        m_entries[5] = {
            "TANKS DEFENSE",
            "Command a combat tank, blast enemy armor waves, and protect your HQ base.",
            "W / A / S / D or ARROWS drive      SPACE / J fire cannon",
            ArcadeScreen::TankDefense,
            Palette::Lime,
        };
        m_entries[6] = {
            "TURBO HIGHWAY",
            "High-speed retro highway racer: weave through traffic as speed increases linearly.",
            "A / D or ARROWS steer      W / S throttle & brake      SPACE nitro",
            ArcadeScreen::TurboRace,
            Palette::Magenta,
        };
        m_entries[7] = {
            "CYBER FROGGER",
            "Time your hops across a lethal neon highway and raging river to reach the home bays.",
            "W / A / S / D or ARROWS hop      SPACE deploy",
            ArcadeScreen::CyberFrogger,
            Palette::Lime,
        };
        m_entries[8] = {
            "SUPPLEMENT SHOOTER",
            "Shoot block projectiles to fill in gaps in descending shapes and complete solid rectangles.",
            "A / D move ship      SPACE / J shoot block",
            ArcadeScreen::SupplementShooter,
            Palette::Cyan,
        };
    }

    void MenuScene::OnInitialize()
    {
        for (size_t i = 0; i < m_stars.size(); ++i)
        {
            m_stars[i] = {m_random.Range(0.0f, kScreenWidth), m_random.Range(0.0f, kScreenHeight)};
            m_starSpeeds[i] = m_random.Range(14.0f, 90.0f);
        }
    }

    void MenuScene::MoveSelection(int delta)
    {
        m_selected = (m_selected + delta + kEntryCount) % kEntryCount;
    }

    void MenuScene::LaunchSelected()
    {
        if (m_session)
        {
            m_session->Request(m_entries[static_cast<size_t>(m_selected)].Screen);
        }
    }

    void MenuScene::OnUpdate(double dt)
    {
        const auto step = static_cast<float>(dt);
        m_time += step;

        for (size_t i = 0; i < m_stars.size(); ++i)
        {
            m_stars[i].x -= m_starSpeeds[i] * step;
            if (m_stars[i].x < 0.0f)
            {
                m_stars[i].x += kScreenWidth;
                m_stars[i].y = m_random.Range(0.0f, kScreenHeight);
            }
        }

        PollActions();

        const bool up = m_actions.IsActionHeld(InputAction::MoveUp);
        const bool down = m_actions.IsActionHeld(InputAction::MoveDown);
        if ((up || down) && !m_navLatch)
        {
            MoveSelection(down ? 1 : -1);
            m_navLatch = true;
        }
        else if (!up && !down)
        {
            m_navLatch = false;
        }

        auto *input = Device();
        const bool accept = m_actions.IsActionHeld(InputAction::Accept)
            || (input && (input->IsKeyHeld(Key::Enter) || input->IsKeyHeld(Key::Space)));

        if (accept && !m_acceptLatch)
        {
            LaunchSelected();
            m_acceptLatch = true;
        }
        else if (!accept)
        {
            m_acceptLatch = false;
        }

        if (input)
        {
            if (input->IsKeyPressed(Key::Num1)) { m_selected = 0; LaunchSelected(); }
            if (input->IsKeyPressed(Key::Num2)) { m_selected = 1; LaunchSelected(); }
            if (input->IsKeyPressed(Key::Escape) && m_session) { m_session->Request(ArcadeScreen::Quit); }
        }
    }

    void MenuScene::OnRender(Renderer &renderer)
    {
        for (size_t i = 0; i < m_stars.size(); ++i)
        {
            const float brightness = 0.18f + (m_starSpeeds[i] / 90.0f) * 0.5f;
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                m_stars[i], glm::vec2{2.0f, 2.0f}, 0.0f, glm::vec4{brightness, brightness * 1.1f, brightness * 1.4f, 1.0f}));
        }

        const float pulse = 0.5f + 0.5f * std::sin(m_time * 2.4f);

        DrawTextCentered(renderer, kScreenWidth * 0.5f, 76.0f, "ORBIT ARCADE", Palette::Text, 5.0f);
        DrawTextCentered(renderer, kScreenWidth * 0.5f, 130.0f, "TWO GAMES ON THE NATIVE C++ RUNTIME", Palette::Dim, 1.75f);

        constexpr float cardTop = 200.0f;
        constexpr float cardHeight = 132.0f;
        constexpr float cardGap = 26.0f;
        constexpr float cardX = 200.0f;
        constexpr float cardWidth = kScreenWidth - cardX * 2.0f;

        for (int i = 0; i < kEntryCount; ++i)
        {
            const auto &entry = m_entries[static_cast<size_t>(i)];
            const bool selected = i == m_selected;
            const float top = cardTop + static_cast<float>(i) * (cardHeight + cardGap);

            const glm::vec4 fill = selected
                ? glm::vec4{entry.Color.r * 0.16f, entry.Color.g * 0.16f, entry.Color.b * 0.16f, 1.0f}
                : glm::vec4{0.07f, 0.085f, 0.12f, 1.0f};

            DrawPanel(renderer, {cardX, top}, {cardWidth, cardHeight}, fill);

            renderer.SubmitCommand(std::make_unique<DrawRectangleOutlineCommand>(
                glm::vec2{cardX + cardWidth * 0.5f, top + cardHeight * 0.5f}, glm::vec2{cardWidth, cardHeight},
                selected ? entry.Color : Palette::Dim, selected ? 3.0f : 1.0f));

            // Accent bar on the selected card, breathing with the pulse.
            DrawPanel(renderer, {cardX, top}, {6.0f, cardHeight},
                      selected ? glm::vec4{entry.Color.r, entry.Color.g, entry.Color.b, 0.45f + pulse * 0.55f}
                               : Palette::Dim);

            const int number = i + 1;
            DrawText(renderer, {cardX + 26.0f, top + 26.0f}, std::to_string(number), entry.Color, 3.0f);
            DrawText(renderer, {cardX + 68.0f, top + 26.0f}, entry.Title, selected ? Palette::Text : Palette::Muted, 3.0f);
            DrawText(renderer, {cardX + 68.0f, top + 64.0f}, entry.Tagline, Palette::Muted, 1.75f);
            DrawText(renderer, {cardX + 68.0f, top + 90.0f}, entry.Controls, Palette::Dim, 1.5f);

            const int high = entry.Screen == ArcadeScreen::BrickStorm
                ? (m_session ? m_session->BrickStormHighScore : 0)
                : (m_session ? m_session->VoidRunnerHighScore : 0);
            const std::string best = "BEST " + Score(high);
            DrawText(renderer, {cardX + cardWidth - TextWidth(best, 1.75f) - 22.0f, top + 30.0f}, best,
                     selected ? entry.Color : Palette::Dim, 1.75f);
        }

        DrawTextCentered(renderer, kScreenWidth * 0.5f, 566.0f, "UP / DOWN TO CHOOSE      ENTER TO PLAY",
                         glm::vec4{Palette::Text.r, Palette::Text.g, Palette::Text.b, 0.35f + pulse * 0.65f}, 2.0f);
        DrawTextCentered(renderer, kScreenWidth * 0.5f, 606.0f, "OR PRESS 1 / 2", Palette::Dim, 1.75f);
        DrawTextCentered(renderer, kScreenWidth * 0.5f, 672.0f, "ESC QUITS      IN GAME: ESC RETURNS HERE, R RESTARTS",
                         Palette::Dim, 1.5f);
    }
}
