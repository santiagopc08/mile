#include "examples/arcade/VoidRunnerScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <memory>

namespace platform::arcade
{
    namespace
    {
        constexpr float kShipRadius = 15.0f;
        constexpr float kThrustAccel = 460.0f;
        constexpr float kTurnSpeed = 4.1f;
        constexpr float kMaxShipSpeed = 460.0f;
        constexpr float kBulletSpeed = 720.0f;
        constexpr float kBulletLife = 1.05f;
        constexpr float kFireInterval = 0.16f;

        const std::vector<glm::vec2> kShipHull{
            {20.0f, 0.0f},
            {-13.0f, -12.0f},
            {-7.0f, 0.0f},
            {-13.0f, 12.0f},
        };

        /// The object's own position plus a mirrored copy for every screen edge it
        /// currently overlaps, so wrapped shapes are drawn on both sides.
        std::vector<glm::vec2> WrapGhosts(const glm::vec2 &position, float radius)
        {
            std::vector<glm::vec2> ghosts{position};

            const float offsetX = position.x < radius ? kScreenWidth
                : (position.x > kScreenWidth - radius ? -kScreenWidth : 0.0f);
            const float offsetY = position.y < radius ? kScreenHeight
                : (position.y > kScreenHeight - radius ? -kScreenHeight : 0.0f);

            if (offsetX != 0.0f) ghosts.push_back({position.x + offsetX, position.y});
            if (offsetY != 0.0f) ghosts.push_back({position.x, position.y + offsetY});
            if (offsetX != 0.0f && offsetY != 0.0f) ghosts.push_back({position.x + offsetX, position.y + offsetY});

            return ghosts;
        }

        std::string Digits(int value, int width)
        {
            char buffer[32];
            std::snprintf(buffer, sizeof(buffer), "%0*d", width, value);
            return std::string(buffer);
        }

        float RadiusForTier(int tier)
        {
            switch (tier)
            {
            case 3:  return 52.0f;
            case 2:  return 30.0f;
            default: return 17.0f;
            }
        }

        glm::vec4 ColorForTier(int tier)
        {
            switch (tier)
            {
            case 3:  return glm::vec4{0.42f, 0.48f, 0.62f, 1.0f};
            case 2:  return glm::vec4{0.55f, 0.60f, 0.74f, 1.0f};
            default: return glm::vec4{0.70f, 0.74f, 0.86f, 1.0f};
            }
        }
    }

    VoidRunnerScene::VoidRunnerScene(ArcadeSession *session)
        : ArcadeScene("Void Runner", session)
    {
    }

    glm::vec2 VoidRunnerScene::Wrap(glm::vec2 position)
    {
        if (position.x < 0.0f) position.x += kScreenWidth;
        if (position.x > kScreenWidth) position.x -= kScreenWidth;
        if (position.y < 0.0f) position.y += kScreenHeight;
        if (position.y > kScreenHeight) position.y -= kScreenHeight;
        return position;
    }

    VoidRunnerScene::Rock VoidRunnerScene::MakeRock(const glm::vec2 &position, const glm::vec2 &velocity, int tier)
    {
        Rock rock;
        rock.Position = position;
        rock.Velocity = velocity;
        rock.Tier = tier;
        rock.Radius = RadiusForTier(tier);
        rock.Rotation = m_random.Range(0.0f, 6.28318530718f);
        rock.Spin = m_random.Range(-1.5f, 1.5f);

        // Irregular silhouette: each vertex is the base radius jittered inwards.
        const int vertices = m_random.RangeInt(8, 11);
        rock.Silhouette.reserve(static_cast<size_t>(vertices));
        for (int i = 0; i < vertices; ++i)
        {
            const float angle = static_cast<float>(i) / static_cast<float>(vertices) * 6.28318530718f;
            const float radius = rock.Radius * m_random.Range(0.72f, 1.0f);
            rock.Silhouette.push_back({std::cos(angle) * radius, std::sin(angle) * radius});
        }

        return rock;
    }

    void VoidRunnerScene::OnInitialize()
    {
        StartRun();
    }

    void VoidRunnerScene::StartRun()
    {
        m_rocks.clear();
        m_bullets.clear();
        m_particles.Clear();

        m_score = 0;
        m_lives = 3;
        m_wave = 1;
        m_gameOver = false;

        m_shipPosition = {kScreenWidth * 0.5f, kScreenHeight * 0.5f};
        m_shipVelocity = {0.0f, 0.0f};
        m_shipRotation = -1.5707963f;
        m_invulnerable = 2.0f;
        // Swallow the key that launched the game so it does not fire on frame one.
        m_fireCooldown = 0.35f;

        SpawnWave(1);
    }

    void VoidRunnerScene::SpawnWave(int wave)
    {
        m_wave = wave;
        m_waveBanner = 1.7f;

        const int count = std::min(9, 3 + wave);
        for (int i = 0; i < count; ++i)
        {
            // Spawn around the rim so nothing materialises on top of the ship.
            glm::vec2 position;
            do
            {
                position = {m_random.Range(0.0f, kScreenWidth), m_random.Range(0.0f, kScreenHeight)};
            } while (glm::length(position - m_shipPosition) < 240.0f);

            const float angle = m_random.Range(0.0f, 6.28318530718f);
            const float speed = m_random.Range(38.0f, 68.0f) + static_cast<float>(wave) * 5.0f;
            m_rocks.push_back(MakeRock(position, {std::cos(angle) * speed, std::sin(angle) * speed}, 3));
        }
    }

    void VoidRunnerScene::Fire()
    {
        Bullet bullet;
        bullet.Position = m_shipPosition + glm::vec2{std::cos(m_shipRotation), std::sin(m_shipRotation)} * 20.0f;
        bullet.Velocity = glm::vec2{std::cos(m_shipRotation), std::sin(m_shipRotation)} * kBulletSpeed + m_shipVelocity * 0.35f;
        bullet.Life = kBulletLife;
        m_bullets.push_back(bullet);

        m_fireCooldown = kFireInterval;
        AddShake(1.2f);
    }

    void VoidRunnerScene::SplitRock(size_t index)
    {
        const Rock rock = m_rocks[index];
        m_rocks.erase(m_rocks.begin() + static_cast<long>(index));

        m_particles.Burst(rock.Position, ColorForTier(rock.Tier), 14 + rock.Tier * 6, 220.0f, 4.0f);
        AddShake(rock.Tier == 3 ? 6.0f : 3.0f);

        switch (rock.Tier)
        {
        case 3: m_score += 20; break;
        case 2: m_score += 50; break;
        default: m_score += 100; break;
        }

        if (rock.Tier <= 1)
        {
            return;
        }

        // Two children fly apart perpendicular-ish to the parent's heading.
        for (int i = 0; i < 2; ++i)
        {
            const float angle = m_random.Range(0.0f, 6.28318530718f);
            const float speed = m_random.Range(70.0f, 130.0f) + static_cast<float>(m_wave) * 4.0f;
            m_rocks.push_back(MakeRock(rock.Position,
                                       rock.Velocity * 0.35f + glm::vec2{std::cos(angle), std::sin(angle)} * speed,
                                       rock.Tier - 1));
        }
    }

    void VoidRunnerScene::KillShip()
    {
        m_lives -= 1;
        m_particles.Burst(m_shipPosition, Palette::Amber, 40, 340.0f, 5.0f);
        AddShake(16.0f);

        m_shipPosition = {kScreenWidth * 0.5f, kScreenHeight * 0.5f};
        m_shipVelocity = {0.0f, 0.0f};
        m_shipRotation = -1.5707963f;
        m_invulnerable = 2.4f;

        if (m_lives <= 0)
        {
            m_gameOver = true;
            m_restartLatch = true;
            if (m_session)
            {
                m_session->VoidRunnerHighScore = std::max(m_session->VoidRunnerHighScore, m_score);
            }
        }
    }

    void VoidRunnerScene::OnUpdate(double dt)
    {
        const auto step = std::min(0.05f, static_cast<float>(dt));

        PollActions();
        UpdateShake(step);
        m_particles.Update(step);
        m_waveBanner = std::max(0.0f, m_waveBanner - step);

        auto *input = Device();
        if (input)
        {
            if (input->IsKeyPressed(Key::Escape) && m_session)
            {
                m_session->Request(ArcadeScreen::Menu);
                return;
            }

            const bool restart = input->IsKeyHeld(Key::R);
            if (restart && !m_restartLatch)
            {
                StartRun();
                m_restartLatch = true;
                return;
            }
            if (!restart)
            {
                m_restartLatch = false;
            }
        }

        if (m_gameOver)
        {
            return;
        }

        // --- Ship ---------------------------------------------------------
        const float turn = (m_actions.IsActionHeld(InputAction::MoveRight) ? 1.0f : 0.0f)
            - (m_actions.IsActionHeld(InputAction::MoveLeft) ? 1.0f : 0.0f);
        m_shipRotation += turn * kTurnSpeed * step;

        const bool thrusting = m_actions.IsActionHeld(InputAction::MoveUp);
        if (thrusting)
        {
            const glm::vec2 forward{std::cos(m_shipRotation), std::sin(m_shipRotation)};
            m_shipVelocity += forward * kThrustAccel * step;

            m_thrustPulse += step;
            if (m_thrustPulse > 0.02f)
            {
                m_thrustPulse = 0.0f;
                const glm::vec2 exhaust = m_shipPosition - forward * 16.0f;
                m_particles.Emit(exhaust, -forward * m_random.Range(90.0f, 190.0f) + m_shipVelocity * 0.2f,
                                 Palette::Amber, 0.30f, 4.0f);
            }
        }

        const float speed = glm::length(m_shipVelocity);
        if (speed > kMaxShipSpeed)
        {
            m_shipVelocity *= kMaxShipSpeed / speed;
        }
        m_shipVelocity -= m_shipVelocity * std::min(1.0f, 0.55f * step); // space drag, for control

        m_shipPosition = Wrap(m_shipPosition + m_shipVelocity * step);
        m_invulnerable = std::max(0.0f, m_invulnerable - step);

        // --- Firing -------------------------------------------------------
        m_fireCooldown = std::max(0.0f, m_fireCooldown - step);
        const bool fireDown = m_actions.IsActionHeld(InputAction::Accept)
            || (input && (input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::Enter)));

        // Auto-fire while held; the cooldown is what paces the shots.
        if (fireDown && m_fireCooldown <= 0.0f)
        {
            Fire();
        }

        // --- Bullets ------------------------------------------------------
        for (size_t i = 0; i < m_bullets.size();)
        {
            Bullet &bullet = m_bullets[i];
            bullet.Life -= step;
            bullet.Position = Wrap(bullet.Position + bullet.Velocity * step);

            if (bullet.Life <= 0.0f)
            {
                m_bullets.erase(m_bullets.begin() + static_cast<long>(i));
                continue;
            }

            bool consumed = false;
            for (size_t r = 0; r < m_rocks.size(); ++r)
            {
                if (glm::length(bullet.Position - m_rocks[r].Position) <= m_rocks[r].Radius)
                {
                    SplitRock(r);
                    consumed = true;
                    break;
                }
            }

            if (consumed)
            {
                m_bullets.erase(m_bullets.begin() + static_cast<long>(i));
                continue;
            }

            ++i;
        }

        // --- Rocks --------------------------------------------------------
        for (auto &rock : m_rocks)
        {
            rock.Position = Wrap(rock.Position + rock.Velocity * step);
            rock.Rotation += rock.Spin * step;

            if (m_invulnerable <= 0.0f
                && glm::length(rock.Position - m_shipPosition) <= rock.Radius + kShipRadius * 0.7f)
            {
                KillShip();
                break;
            }
        }

        if (m_rocks.empty() && !m_gameOver)
        {
            m_score += 250 * m_wave;
            SpawnWave(m_wave + 1);
        }
    }

    void VoidRunnerScene::OnRender(Renderer &renderer)
    {
        const glm::vec2 shake = ShakeOffset();

        m_particles.Render(renderer);

        for (const auto &rock : m_rocks)
        {
            const glm::vec4 edge = ColorForTier(rock.Tier);
            const glm::vec4 fill{edge.r * 0.28f, edge.g * 0.28f, edge.b * 0.32f, 1.0f};

            // A rock straddling an edge is drawn again on the opposite side, so the
            // wrap reads as continuous instead of clipping away.
            for (const glm::vec2 &ghost : WrapGhosts(rock.Position, rock.Radius))
            {
                auto points = TransformPoints(rock.Silhouette, ghost + shake, rock.Rotation);
                renderer.SubmitCommand(std::make_unique<DrawConvexPolygonCommand>(points, fill));
                renderer.SubmitCommand(std::make_unique<DrawPolylineCommand>(std::move(points), edge));
            }
        }

        for (const auto &bullet : m_bullets)
        {
            renderer.SubmitCommand(std::make_unique<DrawCircleCommand>(bullet.Position + shake, 3.0f, Palette::Amber));
        }

        // Ship: blinks while the respawn shield is up.
        const bool blinkOff = m_invulnerable > 0.0f && std::fmod(m_invulnerable, 0.24f) < 0.12f;
        if (!m_gameOver && !blinkOff)
        {
            for (const glm::vec2 &ghost : WrapGhosts(m_shipPosition, kShipRadius))
            {
                auto hull = TransformPoints(kShipHull, ghost + shake, m_shipRotation);
                renderer.SubmitCommand(std::make_unique<DrawConvexPolygonCommand>(hull, glm::vec4{0.10f, 0.14f, 0.22f, 1.0f}));
                renderer.SubmitCommand(std::make_unique<DrawPolylineCommand>(std::move(hull), Palette::Cyan));
            }
        }

        // HUD.
        DrawText(renderer, {28.0f, 22.0f}, "VOID RUNNER", Palette::Magenta, 2.5f);
        DrawText(renderer, {28.0f, 56.0f}, "SCORE " + Digits(m_score, 6), Palette::Text, 2.0f);
        DrawText(renderer, {330.0f, 56.0f}, "WAVE " + std::to_string(m_wave), Palette::Muted, 2.0f);
        DrawText(renderer, {480.0f, 56.0f}, "ROCKS " + std::to_string(m_rocks.size()), Palette::Muted, 2.0f);

        for (int i = 0; i < m_lives; ++i)
        {
            auto icon = TransformPoints(kShipHull, {kScreenWidth - 46.0f - static_cast<float>(i) * 34.0f, 62.0f},
                                        -1.5707963f, 0.8f);
            renderer.SubmitCommand(std::make_unique<DrawPolylineCommand>(std::move(icon), Palette::Cyan));
        }
        DrawText(renderer, {kScreenWidth - 150.0f, 22.0f}, "LIVES", Palette::Muted, 2.0f);

        if (m_waveBanner > 0.0f && !m_gameOver)
        {
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 300.0f, "WAVE " + std::to_string(m_wave), Palette::Text, 5.0f);
        }

        if (m_gameOver)
        {
            DrawPanel(renderer, {kScreenWidth * 0.5f - 300.0f, 250.0f}, {600.0f, 200.0f},
                      glm::vec4{0.05f, 0.06f, 0.10f, 0.94f});
            renderer.SubmitCommand(std::make_unique<DrawRectangleOutlineCommand>(
                glm::vec2{kScreenWidth * 0.5f, 350.0f}, glm::vec2{600.0f, 200.0f}, Palette::Magenta, 2.0f));
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 282.0f, "SHIP LOST", Palette::Magenta, 4.0f);
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 342.0f, "SCORE " + Digits(m_score, 6), Palette::Text, 2.5f);
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 378.0f,
                             "BEST " + Digits(m_session ? m_session->VoidRunnerHighScore : 0, 6), Palette::Muted, 2.0f);
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 412.0f, "R RESTART      ESC MENU", Palette::Muted, 2.0f);
        }
        else
        {
            DrawTextCentered(renderer, kScreenWidth * 0.5f, kScreenHeight - 34.0f,
                             "A / D ROTATE      W THRUST      SPACE FIRE      ESC MENU", Palette::Dim, 1.5f);
        }
    }
}
