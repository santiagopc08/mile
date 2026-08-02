#include "examples/arcade/BrickStormScene.hpp"

#include "engine/graphics/RenderCommand.hpp"
#include "engine/graphics/components/RenderLayerComponent.hpp"
#include "engine/graphics/components/ShapeComponent.hpp"
#include "engine/graphics/components/VisibilityComponent.hpp"
#include "engine/scene/components/Components.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>
#include <memory>

namespace platform::arcade
{
    namespace
    {
        constexpr float kWallLeft = 24.0f;
        constexpr float kWallRight = kScreenWidth - 24.0f;

        constexpr int kBrickColumns = 12;
        constexpr float kBrickWidth = 88.0f;
        constexpr float kBrickHeight = 30.0f;
        constexpr float kBrickGap = 6.0f;

        std::string Digits(int value, int width)
        {
            char buffer[32];
            std::snprintf(buffer, sizeof(buffer), "%0*d", width, value);
            return std::string(buffer);
        }

        const char *DropLabel(BrickStormScene::DropKind kind)
        {
            switch (kind)
            {
            case BrickStormScene::DropKind::WidePaddle: return "W";
            case BrickStormScene::DropKind::MultiBall:  return "M";
            case BrickStormScene::DropKind::SlowBall:   return "S";
            case BrickStormScene::DropKind::ExtraLife:  return "+";
            }
            return "?";
        }

        glm::vec4 DropColor(BrickStormScene::DropKind kind)
        {
            switch (kind)
            {
            case BrickStormScene::DropKind::WidePaddle: return Palette::Cyan;
            case BrickStormScene::DropKind::MultiBall:  return Palette::Amber;
            case BrickStormScene::DropKind::SlowBall:   return Palette::Violet;
            case BrickStormScene::DropKind::ExtraLife:  return Palette::Lime;
            }
            return Palette::Text;
        }
    }

    BrickStormScene::BrickStormScene(ArcadeSession *session)
        : ArcadeScene("Brick Storm", session)
    {
    }

    EntityID BrickStormScene::SpawnQuad(const glm::vec2 &position, const glm::vec2 &size, const glm::vec4 &color, int layer)
    {
        const EntityID entity = CreateEntity("Quad");
        auto &transform = GetRegistry().AddComponent<TransformComponent>(entity);
        transform.Position = position;

        auto &shape = GetRegistry().AddComponent<ShapeComponent>(entity);
        shape.Size = size;
        shape.Color = color;

        GetRegistry().AddComponent<RenderLayerComponent>(entity).LayerID = layer;
        GetRegistry().AddComponent<VisibilityComponent>(entity);
        return entity;
    }

    void BrickStormScene::OnInitialize()
    {
        m_paddle = SpawnQuad({m_paddleX, kPaddleY}, {m_paddleWidth, 18.0f}, Palette::Cyan, 3);
        StartRun();
    }

    void BrickStormScene::ClearBoard()
    {
        auto &registry = GetRegistry();
        for (const auto &brick : m_bricks) registry.DestroyEntity(brick.Entity);
        for (const auto &ball : m_balls) registry.DestroyEntity(ball.Entity);
        for (const auto &drop : m_drops) registry.DestroyEntity(drop.Entity);
        registry.FlushDestroyedEntities();

        m_bricks.clear();
        m_balls.clear();
        m_drops.clear();
    }

    void BrickStormScene::StartRun()
    {
        m_score = 0;
        m_lives = 3;
        m_level = 1;
        m_combo = 0;
        m_comboTimer = 0.0f;
        m_gameOver = false;
        m_paddleWidth = kBasePaddleWidth;
        m_wideTimer = 0.0f;
        m_slowTimer = 0.0f;
        m_paddleX = kScreenWidth * 0.5f;
        m_particles.Clear();
        BuildLevel(1);
    }

    void BrickStormScene::BuildLevel(int level)
    {
        ClearBoard();
        m_level = level;
        m_levelBanner = 1.6f;
        m_ballHeld = true;

        // Rows grow with the level and cap out, so later boards are dense but fair.
        const int rows = std::min(8, 4 + (level - 1) / 2);
        const float boardWidth = kBrickColumns * kBrickWidth + (kBrickColumns - 1) * kBrickGap;
        const float startX = (kScreenWidth - boardWidth) * 0.5f + kBrickWidth * 0.5f;

        for (int row = 0; row < rows; ++row)
        {
            for (int column = 0; column < kBrickColumns; ++column)
            {
                // Carve a couple of gaps per row so the ball can find a way upstairs.
                if (m_random.NextFloat() < 0.08f + static_cast<float>(row) * 0.01f)
                {
                    continue;
                }

                Brick brick;
                brick.Position = {
                    startX + static_cast<float>(column) * (kBrickWidth + kBrickGap),
                    kPlayfieldTop + 30.0f + static_cast<float>(row) * (kBrickHeight + kBrickGap),
                };
                brick.HalfSize = {kBrickWidth * 0.5f, kBrickHeight * 0.5f};
                brick.Hits = 1 + std::min(2, (rows - 1 - row) / 2 + (level - 1) / 3);
                brick.Golden = m_random.NextFloat() < 0.07f;
                if (brick.Golden)
                {
                    brick.Hits += 1;
                }

                brick.Entity = SpawnQuad(brick.Position, {kBrickWidth, kBrickHeight}, BrickColor(brick), 1);
                m_bricks.push_back(brick);
            }
        }
    }

    glm::vec4 BrickStormScene::BrickColor(const Brick &brick) const
    {
        if (brick.Golden)
        {
            return Palette::Amber;
        }
        switch (brick.Hits)
        {
        case 1:  return Palette::Cyan;
        case 2:  return Palette::Violet;
        default: return Palette::Magenta;
        }
    }

    void BrickStormScene::SpawnBall(const glm::vec2 &position, const glm::vec2 &velocity)
    {
        Ball ball;
        ball.Position = position;
        ball.Velocity = velocity;
        ball.Entity = SpawnQuad(position, {ball.Radius * 2.0f, ball.Radius * 2.0f}, Palette::Text, 4);

        auto &shape = *GetRegistry().GetComponent<ShapeComponent>(ball.Entity);
        shape.Type = ShapeType::Circle;
        shape.Radius = ball.Radius;

        m_balls.push_back(ball);
    }

    void BrickStormScene::SpawnDrop(const glm::vec2 &position)
    {
        Drop drop;
        drop.Position = position;
        drop.Kind = static_cast<DropKind>(m_random.RangeInt(0, 3));
        drop.Entity = SpawnQuad(position, {22.0f, 22.0f}, DropColor(drop.Kind), 2);
        m_drops.push_back(drop);
    }

    void BrickStormScene::ApplyDrop(DropKind kind)
    {
        switch (kind)
        {
        case DropKind::WidePaddle:
            m_wideTimer = 12.0f;
            break;
        case DropKind::MultiBall:
        {
            // Fork every ball currently in play, up to a sane cap.
            const size_t existing = m_balls.size();
            for (size_t i = 0; i < existing && m_balls.size() < 6; ++i)
            {
                const glm::vec2 velocity = m_balls[i].Velocity;
                SpawnBall(m_balls[i].Position, {-velocity.y, velocity.x});
            }
            break;
        }
        case DropKind::SlowBall:
            m_slowTimer = 8.0f;
            break;
        case DropKind::ExtraLife:
            m_lives = std::min(6, m_lives + 1);
            break;
        }

        m_score += 60;
        m_flash = 0.35f;
    }

    void BrickStormScene::BreakBrick(size_t index)
    {
        Brick &brick = m_bricks[index];
        brick.Hits -= 1;

        m_combo = std::min(9, m_combo + 1);
        m_comboTimer = 1.6f;
        AddShake(brick.Golden ? 5.0f : 2.5f);

        if (brick.Hits > 0)
        {
            GetRegistry().GetComponent<ShapeComponent>(brick.Entity)->Color = BrickColor(brick);
            m_particles.Burst(brick.Position, BrickColor(brick), 6, 140.0f, 3.0f);
            m_score += 10 * m_combo;
            return;
        }

        m_particles.Burst(brick.Position, BrickColor(brick), 18, 260.0f, 5.0f);
        m_score += (brick.Golden ? 150 : 50) * m_combo;

        if (brick.Golden || m_random.NextFloat() < 0.12f)
        {
            SpawnDrop(brick.Position);
        }

        GetRegistry().DestroyEntity(brick.Entity);
        m_bricks.erase(m_bricks.begin() + static_cast<long>(index));
    }

    void BrickStormScene::LoseLife()
    {
        m_lives -= 1;
        m_combo = 0;
        m_paddleWidth = kBasePaddleWidth;
        m_wideTimer = 0.0f;
        m_slowTimer = 0.0f;
        AddShake(12.0f);
        m_particles.Burst({m_paddleX, kPaddleY}, Palette::Red, 26, 300.0f, 5.0f);

        if (m_lives <= 0)
        {
            m_gameOver = true;
            m_restartLatch = true;
            if (m_session)
            {
                m_session->BrickStormHighScore = std::max(m_session->BrickStormHighScore, m_score);
            }
            return;
        }

        m_ballHeld = true;
    }

    void BrickStormScene::UpdatePaddle(float dt)
    {
        const float direction = (m_actions.IsActionHeld(InputAction::MoveRight) ? 1.0f : 0.0f)
            - (m_actions.IsActionHeld(InputAction::MoveLeft) ? 1.0f : 0.0f);

        m_paddleX += direction * 780.0f * dt;

        const float half = m_paddleWidth * 0.5f;
        m_paddleX = std::clamp(m_paddleX, kWallLeft + half, kWallRight - half);

        m_wideTimer = std::max(0.0f, m_wideTimer - dt);
        m_slowTimer = std::max(0.0f, m_slowTimer - dt);
        m_paddleWidth = m_wideTimer > 0.0f ? kBasePaddleWidth * 1.65f : kBasePaddleWidth;
    }

    void BrickStormScene::UpdateBalls(float dt)
    {
        const float half = m_paddleWidth * 0.5f;

        if (m_ballHeld)
        {
            // Keep exactly one ball parked on the bat; recreating it every frame
            // would churn entity ids for as long as the player waits.
            while (m_balls.size() > 1)
            {
                GetRegistry().DestroyEntity(m_balls.back().Entity);
                m_balls.pop_back();
            }
            if (m_balls.empty())
            {
                SpawnBall({m_paddleX, kPaddleY - 22.0f}, {0.0f, 0.0f});
            }
            m_balls[0].Position = {m_paddleX, kPaddleY - 22.0f};

            auto *input = Device();
            const bool launch = m_actions.IsActionHeld(InputAction::Accept)
                || (input && (input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::Enter)));
            if (launch)
            {
                const float speed = kBaseBallSpeed + static_cast<float>(m_level - 1) * 18.0f;
                m_balls[0].Velocity = {m_random.Range(-0.45f, 0.45f) * speed, -speed};
                m_ballHeld = false;
            }
            return;
        }

        const float speedScale = m_slowTimer > 0.0f ? 0.62f : 1.0f;

        for (size_t i = 0; i < m_balls.size();)
        {
            Ball &ball = m_balls[i];
            ball.Position += ball.Velocity * speedScale * dt;

            // Walls.
            if (ball.Position.x - ball.Radius < kWallLeft && ball.Velocity.x < 0.0f)
            {
                ball.Position.x = kWallLeft + ball.Radius;
                ball.Velocity.x = -ball.Velocity.x;
                m_particles.Burst(ball.Position, Palette::Dim, 4, 90.0f, 3.0f);
            }
            else if (ball.Position.x + ball.Radius > kWallRight && ball.Velocity.x > 0.0f)
            {
                ball.Position.x = kWallRight - ball.Radius;
                ball.Velocity.x = -ball.Velocity.x;
                m_particles.Burst(ball.Position, Palette::Dim, 4, 90.0f, 3.0f);
            }

            if (ball.Position.y - ball.Radius < kPlayfieldTop && ball.Velocity.y < 0.0f)
            {
                ball.Position.y = kPlayfieldTop + ball.Radius;
                ball.Velocity.y = -ball.Velocity.y;
                m_particles.Burst(ball.Position, Palette::Dim, 4, 90.0f, 3.0f);
            }

            // Paddle: the bounce angle follows where the ball lands on the bat.
            if (ball.Velocity.y > 0.0f
                && ball.Position.y + ball.Radius >= kPaddleY - 9.0f
                && ball.Position.y - ball.Radius <= kPaddleY + 9.0f
                && std::abs(ball.Position.x - m_paddleX) <= half + ball.Radius)
            {
                const float offset = std::clamp((ball.Position.x - m_paddleX) / half, -1.0f, 1.0f);
                const float speed = std::max(kBaseBallSpeed, glm::length(ball.Velocity));
                const float angle = offset * 1.05f; // up to 60 degrees off vertical

                ball.Velocity = {std::sin(angle) * speed, -std::cos(angle) * speed};
                ball.Position.y = kPaddleY - 9.0f - ball.Radius;

                m_combo = 0;
                m_particles.Burst(ball.Position, Palette::Cyan, 8, 150.0f, 3.5f);
                AddShake(1.5f);
            }

            // Bricks: resolve on the shallower penetration axis.
            for (size_t b = 0; b < m_bricks.size(); ++b)
            {
                const Brick &brick = m_bricks[b];
                const float dx = ball.Position.x - brick.Position.x;
                const float dy = ball.Position.y - brick.Position.y;
                const float overlapX = brick.HalfSize.x + ball.Radius - std::abs(dx);
                const float overlapY = brick.HalfSize.y + ball.Radius - std::abs(dy);

                if (overlapX <= 0.0f || overlapY <= 0.0f)
                {
                    continue;
                }

                if (overlapX < overlapY)
                {
                    ball.Velocity.x = dx < 0.0f ? -std::abs(ball.Velocity.x) : std::abs(ball.Velocity.x);
                    ball.Position.x += dx < 0.0f ? -overlapX : overlapX;
                }
                else
                {
                    ball.Velocity.y = dy < 0.0f ? -std::abs(ball.Velocity.y) : std::abs(ball.Velocity.y);
                    ball.Position.y += dy < 0.0f ? -overlapY : overlapY;
                }

                BreakBrick(b);
                break;
            }

            if (ball.Position.y - ball.Radius > kScreenHeight)
            {
                GetRegistry().DestroyEntity(ball.Entity);
                m_balls.erase(m_balls.begin() + static_cast<long>(i));
                continue;
            }

            ++i;
        }

        if (m_balls.empty() && !m_gameOver)
        {
            LoseLife();
        }
    }

    void BrickStormScene::UpdateDrops(float dt)
    {
        const float half = m_paddleWidth * 0.5f;

        for (size_t i = 0; i < m_drops.size();)
        {
            Drop &drop = m_drops[i];
            drop.Position.y += 210.0f * dt;

            const bool caught = drop.Position.y > kPaddleY - 20.0f && drop.Position.y < kPaddleY + 20.0f
                && std::abs(drop.Position.x - m_paddleX) < half + 14.0f;

            if (caught)
            {
                m_particles.Burst(drop.Position, DropColor(drop.Kind), 14, 200.0f, 4.0f);
                ApplyDrop(drop.Kind);
            }

            if (caught || drop.Position.y > kScreenHeight + 20.0f)
            {
                GetRegistry().DestroyEntity(drop.Entity);
                m_drops.erase(m_drops.begin() + static_cast<long>(i));
                continue;
            }

            ++i;
        }
    }

    void BrickStormScene::SyncTransforms()
    {
        auto &registry = GetRegistry();

        if (auto *paddleTransform = registry.GetComponent<TransformComponent>(m_paddle))
        {
            paddleTransform->Position = {m_paddleX, kPaddleY};
        }
        if (auto *paddleShape = registry.GetComponent<ShapeComponent>(m_paddle))
        {
            paddleShape->Size = {m_paddleWidth, 18.0f};
            paddleShape->Color = m_wideTimer > 0.0f ? Palette::Lime : Palette::Cyan;
        }

        for (const auto &ball : m_balls)
        {
            if (auto *transform = registry.GetComponent<TransformComponent>(ball.Entity))
            {
                transform->Position = ball.Position;
            }
        }
        for (const auto &drop : m_drops)
        {
            if (auto *transform = registry.GetComponent<TransformComponent>(drop.Entity))
            {
                transform->Position = drop.Position;
            }
        }
    }

    void BrickStormScene::OnUpdate(double dt)
    {
        const auto step = std::min(0.05f, static_cast<float>(dt));

        PollActions();
        UpdateShake(step);
        m_particles.Update(step);
        m_flash = std::max(0.0f, m_flash - step * 3.0f);
        m_levelBanner = std::max(0.0f, m_levelBanner - step);

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

        if (m_comboTimer > 0.0f)
        {
            m_comboTimer -= step;
            if (m_comboTimer <= 0.0f)
            {
                m_combo = 0;
            }
        }

        UpdatePaddle(step);
        UpdateBalls(step);
        UpdateDrops(step);

        if (m_bricks.empty())
        {
            m_score += 500 * m_level;
            BuildLevel(m_level + 1);
        }

        SyncTransforms();
    }

    void BrickStormScene::OnRender(Renderer &renderer)
    {
        // The engine's RenderSystem has already drawn the ECS entities (paddle, balls,
        // bricks, drops) by the time this runs, so everything here layers on top.
        // The background itself comes from the renderer's clear colour.
        const glm::vec2 shake = ShakeOffset();

        // Playfield frame.
        renderer.SubmitCommand(std::make_unique<DrawRectangleOutlineCommand>(
            glm::vec2{kScreenWidth * 0.5f + shake.x, (kPlayfieldTop + kScreenHeight) * 0.5f + shake.y},
            glm::vec2{kWallRight - kWallLeft, kScreenHeight - kPlayfieldTop}, Palette::Dim, 2.0f));

        m_particles.Render(renderer);

        // Drop badges sit on top of their entity quad.
        for (const auto &drop : m_drops)
        {
            DrawTextCentered(renderer, drop.Position.x, drop.Position.y - 7.0f, DropLabel(drop.Kind),
                             glm::vec4{0.04f, 0.05f, 0.08f, 1.0f}, 2.0f);
        }

        // HUD.
        DrawPanel(renderer, {0.0f, 0.0f}, {kScreenWidth, kPlayfieldTop - 8.0f}, glm::vec4{0.06f, 0.07f, 0.11f, 1.0f});
        DrawText(renderer, {28.0f, 20.0f}, "BRICK STORM", Palette::Cyan, 2.5f);
        DrawText(renderer, {28.0f, 54.0f}, "SCORE " + Digits(m_score, 6), Palette::Text, 2.0f);
        DrawText(renderer, {330.0f, 54.0f}, "LEVEL " + std::to_string(m_level), Palette::Muted, 2.0f);
        DrawText(renderer, {500.0f, 54.0f}, "BRICKS " + std::to_string(m_bricks.size()), Palette::Muted, 2.0f);

        for (int i = 0; i < m_lives; ++i)
        {
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                glm::vec2{kScreenWidth - 44.0f - static_cast<float>(i) * 30.0f, 62.0f}, glm::vec2{22.0f, 10.0f}, 0.0f,
                Palette::Cyan));
        }
        DrawText(renderer, {kScreenWidth - 150.0f, 20.0f}, "LIVES", Palette::Muted, 2.0f);

        if (m_combo > 1)
        {
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 20.0f, "COMBO x" + std::to_string(m_combo),
                             Palette::Amber, 2.5f);
        }

        if (m_wideTimer > 0.0f)
        {
            DrawText(renderer, {720.0f, 54.0f}, "WIDE", Palette::Lime, 2.0f);
        }
        if (m_slowTimer > 0.0f)
        {
            DrawText(renderer, {800.0f, 54.0f}, "SLOW", Palette::Violet, 2.0f);
        }

        if (m_flash > 0.0f)
        {
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                glm::vec2{kScreenWidth * 0.5f, kScreenHeight * 0.5f}, glm::vec2{kScreenWidth, kScreenHeight}, 0.0f,
                glm::vec4{1.0f, 1.0f, 1.0f, m_flash * 0.12f}));
        }

        if (m_levelBanner > 0.0f && !m_gameOver)
        {
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 300.0f, "LEVEL " + std::to_string(m_level),
                             Palette::Text, 5.0f);
        }

        if (m_ballHeld && !m_gameOver)
        {
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 560.0f, "PRESS SPACE TO LAUNCH", Palette::Muted, 2.0f);
        }

        if (m_gameOver)
        {
            DrawPanel(renderer, {kScreenWidth * 0.5f - 300.0f, 250.0f}, {600.0f, 200.0f},
                      glm::vec4{0.05f, 0.06f, 0.10f, 0.94f});
            renderer.SubmitCommand(std::make_unique<DrawRectangleOutlineCommand>(
                glm::vec2{kScreenWidth * 0.5f, 350.0f}, glm::vec2{600.0f, 200.0f}, Palette::Red, 2.0f));
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 282.0f, "GAME OVER", Palette::Red, 4.0f);
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 342.0f, "SCORE " + Digits(m_score, 6), Palette::Text, 2.5f);
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 378.0f,
                             "BEST " + Digits(m_session ? m_session->BrickStormHighScore : 0, 6), Palette::Muted, 2.0f);
            DrawTextCentered(renderer, kScreenWidth * 0.5f, 412.0f, "R RESTART      ESC MENU", Palette::Muted, 2.0f);
        }
    }
}
