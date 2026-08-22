#include "examples/arcade/BallShooterScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace platform::arcade
{
    namespace
    {
        glm::vec4 GetBrickColor(int hp, int maxHp)
        {
            const float ratio = static_cast<float>(hp) / static_cast<float>(std::max(1, maxHp));
            if (ratio > 0.75f) return Palette::Red;
            if (ratio > 0.50f) return Palette::Magenta;
            if (ratio > 0.25f) return Palette::Amber;
            return Palette::Lime;
        }

        std::string FormatNum(int val)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "%06d", val);
            return std::string(buf);
        }
    }

    BallShooterScene::BallShooterScene(ArcadeSession *session)
        : ArcadeScene("Ball Shooters", session)
    {
    }

    void BallShooterScene::OnInitialize()
    {
        ResetGame();
    }

    void BallShooterScene::ResetGame()
    {
        m_state = State::Aiming;
        m_items.clear();
        m_balls.clear();
        m_particles.Clear();

        m_score = 0;
        m_wave = 1;
        m_ballCount = 10;
        m_extraBallsThisTurn = 0;
        m_aimAngle = -1.5707963f; // Straight up

        m_cannonPos = {kScreenWidth * 0.5f, kFloorY};
        m_newCannonPos = m_cannonPos;

        SpawnRow();
        SpawnRow();
    }

    void BallShooterScene::SpawnRow()
    {
        // Check if any existing brick is already at danger zone
        for (const auto &item : m_items)
        {
            if (item.Type == ItemType::Brick && item.GridPos.y >= kRows - 1)
            {
                m_state = State::GameOver;
                return;
            }
        }

        // Shift all existing items down by 1
        for (auto &item : m_items)
        {
            item.GridPos.y += 1;
        }

        // Spawn new row at y = 1
        for (int c = 0; c < kCols; ++c)
        {
            const float roll = m_random.NextFloat();
            if (roll > 0.45f)
            {
                const int hp = m_wave * m_random.RangeInt(1, 3);
                m_items.push_back({glm::ivec2{c, 1}, ItemType::Brick, hp, hp, 0.0f});
            }
            else if (roll > 0.35f)
            {
                m_items.push_back({glm::ivec2{c, 1}, ItemType::AddBall, 1, 1, 0.0f});
            }
            else if (roll > 0.28f)
            {
                m_items.push_back({glm::ivec2{c, 1}, ItemType::LaserRow, 1, 1, 0.0f});
            }
            else if (roll > 0.22f)
            {
                m_items.push_back({glm::ivec2{c, 1}, ItemType::Bomb, 1, 1, 0.0f});
            }
        }
    }

    void BallShooterScene::ShootVolley(const glm::vec2 &targetDir)
    {
        if (m_state != State::Aiming) return;
        m_state = State::Shooting;
        m_aimDir = glm::normalize(targetDir);
        m_ballsToSpawn = m_ballCount;
        m_spawnTimer = 0.0f;
        m_newCannonPos = glm::vec2{0.0f, 0.0f}; // Will be set by first returning ball
        m_extraBallsThisTurn = 0;
    }

    void BallShooterScene::OnUpdate(double dt)
    {
        const auto step = static_cast<float>(dt);
        m_particles.Update(step);

        for (auto &item : m_items)
        {
            item.Pulse += step * 4.0f;
        }

        auto *input = Device();
        if (input)
        {
            if (m_state == State::Aiming)
            {
                if (input->IsKeyHeld(Key::Left) || input->IsKeyHeld(Key::A))
                {
                    m_aimAngle = std::max(-2.8f, m_aimAngle - 1.8f * step);
                }
                if (input->IsKeyHeld(Key::Right) || input->IsKeyHeld(Key::D))
                {
                    m_aimAngle = std::min(-0.34f, m_aimAngle + 1.8f * step);
                }

                const bool space = input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::Enter);
                if (space && !m_spaceLatch)
                {
                    ShootVolley(glm::vec2{std::cos(m_aimAngle), std::sin(m_aimAngle)});
                    m_spaceLatch = true;
                }
                else if (!space)
                {
                    m_spaceLatch = false;
                }
            }
            else if (m_state == State::GameOver)
            {
                const bool space = input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::Enter);
                if (space && !m_spaceLatch)
                {
                    ResetGame();
                    m_spaceLatch = true;
                }
                else if (!space)
                {
                    m_spaceLatch = false;
                }
            }

            const bool esc = input->IsKeyHeld(Key::Escape);
            if (esc && !m_escLatch)
            {
                if (m_session)
                    m_session->Request(ArcadeScreen::Menu);
                m_escLatch = true;
            }
            else if (!esc)
            {
                m_escLatch = false;
            }
        }

        if (m_state == State::Shooting)
        {
            // Spawn stream of balls
            if (m_ballsToSpawn > 0)
            {
                m_spawnTimer += step;
                if (m_spawnTimer >= 0.045f)
                {
                    m_spawnTimer = 0.0f;
                    m_ballsToSpawn--;
                    m_balls.push_back({
                        m_cannonPos,
                        m_aimDir * 720.0f,
                        true,
                        false
                    });
                }
            }

            UpdatePhysics(step);
            CheckCollisions();

            // Check if all balls returned
            bool allReturned = (m_ballsToSpawn == 0);
            for (const auto &b : m_balls)
            {
                if (b.Active)
                {
                    allReturned = false;
                    break;
                }
            }

            if (allReturned)
            {
                FinishTurn();
            }
        }
    }

    void BallShooterScene::UpdatePhysics(float dt)
    {
        const float leftBound = kBoardOriginX + 6.0f;
        const float rightBound = kBoardOriginX + kCols * kCellSize - 6.0f;
        const float topBound = kBoardOriginY + 6.0f;

        for (auto &b : m_balls)
        {
            if (!b.Active) continue;

            b.Position += b.Velocity * dt;

            // Left / Right Walls
            if (b.Position.x < leftBound)
            {
                b.Position.x = leftBound;
                b.Velocity.x = std::abs(b.Velocity.x);
            }
            else if (b.Position.x > rightBound)
            {
                b.Position.x = rightBound;
                b.Velocity.x = -std::abs(b.Velocity.x);
            }

            // Top Ceiling
            if (b.Position.y < topBound)
            {
                b.Position.y = topBound;
                b.Velocity.y = std::abs(b.Velocity.y);
            }

            // Floor Collision -> Ball Returns
            if (b.Position.y >= kFloorY)
            {
                b.Active = false;
                if (m_newCannonPos.x == 0.0f && m_newCannonPos.y == 0.0f)
                {
                    m_newCannonPos = glm::vec2{
                        std::max(leftBound + 20.0f, std::min(rightBound - 20.0f, b.Position.x)),
                        kFloorY
                    };
                }
            }
        }
    }

    void BallShooterScene::CheckCollisions()
    {
        const float ballRadius = 5.0f;

        for (auto &b : m_balls)
        {
            if (!b.Active) continue;

            for (auto it = m_items.begin(); it != m_items.end();)
            {
                const float bx = kBoardOriginX + it->GridPos.x * kCellSize + 4.0f;
                const float by = kBoardOriginY + it->GridPos.y * kCellSize + 4.0f;
                const float bw = kCellSize - 8.0f;
                const float bh = kCellSize - 8.0f;

                // Point-to-AABB distance
                const float closestX = std::max(bx, std::min(b.Position.x, bx + bw));
                const float closestY = std::max(by, std::min(b.Position.y, by + bh));

                const float dx = b.Position.x - closestX;
                const float dy = b.Position.y - closestY;
                const float distSq = dx * dx + dy * dy;

                if (distSq < ballRadius * ballRadius)
                {
                    if (it->Type == ItemType::Brick)
                    {
                        it->Hp--;
                        m_score += 10;

                        // Reflect ball velocity
                        if (std::abs(dx) > std::abs(dy))
                        {
                            b.Velocity.x = (dx > 0) ? std::abs(b.Velocity.x) : -std::abs(b.Velocity.x);
                        }
                        else
                        {
                            b.Velocity.y = (dy > 0) ? std::abs(b.Velocity.y) : -std::abs(b.Velocity.y);
                        }

                        if (it->Hp <= 0)
                        {
                            m_particles.Burst(glm::vec2{bx + bw * 0.5f, by + bh * 0.5f}, Palette::Cyan, 18, 160.0f, 4.0f);
                            it = m_items.erase(it);
                            continue;
                        }
                    }
                    else if (it->Type == ItemType::AddBall)
                    {
                        m_extraBallsThisTurn++;
                        m_particles.Burst(glm::vec2{bx + bw * 0.5f, by + bh * 0.5f}, Palette::Amber, 16, 140.0f, 4.0f);
                        it = m_items.erase(it);
                        continue;
                    }
                    else if (it->Type == ItemType::LaserRow)
                    {
                        const int row = it->GridPos.y;
                        m_particles.Burst(glm::vec2{bx + bw * 0.5f, by + bh * 0.5f}, Palette::Cyan, 30, 240.0f, 5.0f);
                        it = m_items.erase(it);

                        // Damage entire row
                        for (auto &other : m_items)
                        {
                            if (other.GridPos.y == row && other.Type == ItemType::Brick)
                            {
                                other.Hp = std::max(0, other.Hp - m_wave * 2);
                            }
                        }
                        continue;
                    }
                    else if (it->Type == ItemType::Bomb)
                    {
                        const glm::ivec2 center = it->GridPos;
                        m_particles.Burst(glm::vec2{bx + bw * 0.5f, by + bh * 0.5f}, Palette::Red, 40, 280.0f, 6.0f);
                        it = m_items.erase(it);

                        // Area damage
                        for (auto &other : m_items)
                        {
                            if (std::abs(other.GridPos.x - center.x) <= 1 && std::abs(other.GridPos.y - center.y) <= 1)
                            {
                                if (other.Type == ItemType::Brick)
                                {
                                    other.Hp = std::max(0, other.Hp - m_wave * 3);
                                }
                            }
                        }
                        continue;
                    }
                }
                ++it;
            }
        }
    }

    void BallShooterScene::FinishTurn()
    {
        m_ballCount += m_extraBallsThisTurn;
        m_balls.clear();
        m_cannonPos = m_newCannonPos;
        m_wave++;
        SpawnRow();
        m_state = State::Aiming;
    }

    void BallShooterScene::OnRender(Renderer &renderer)
    {
        // 1. Grid Background
        for (int r = 0; r < kRows; ++r)
        {
            for (int c = 0; c < kCols; ++c)
            {
                const glm::vec2 cellPos{
                    kBoardOriginX + c * kCellSize,
                    kBoardOriginY + r * kCellSize
                };
                renderer.DrawQuad(cellPos, {kCellSize - 1.0f, kCellSize - 1.0f}, glm::vec4{0.03f, 0.04f, 0.08f, 0.6f});
            }
        }

        // 2. Playfield Borders
        const glm::vec2 boardPos{kBoardOriginX - 2.0f, kBoardOriginY - 2.0f};
        const glm::vec2 boardSize{kCols * kCellSize + 4.0f, kRows * kCellSize + 4.0f};
        renderer.DrawQuad({boardPos.x, boardPos.y}, {boardSize.x, 3.0f}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x, boardPos.y + boardSize.y}, {boardSize.x, 3.0f}, Palette::Red); // Danger floor line
        renderer.DrawQuad({boardPos.x, boardPos.y}, {3.0f, boardSize.y}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x + boardSize.x, boardPos.y}, {3.0f, boardSize.y}, Palette::Cyan);

        // 3. Bricks & Pickups
        for (const auto &item : m_items)
        {
            const glm::vec2 pos{
                kBoardOriginX + item.GridPos.x * kCellSize + 3.0f,
                kBoardOriginY + item.GridPos.y * kCellSize + 3.0f
            };
            const glm::vec2 sz{kCellSize - 6.0f, kCellSize - 6.0f};

            if (item.Type == ItemType::Brick)
            {
                const glm::vec4 col = GetBrickColor(item.Hp, item.MaxHp);
                renderer.DrawQuad(pos, sz, col);
                renderer.DrawText({pos.x + 14.0f, pos.y + 18.0f}, std::to_string(item.Hp), Palette::Background, 0.9f);
            }
            else if (item.Type == ItemType::AddBall)
            {
                renderer.DrawQuad(pos + glm::vec2{12.0f, 12.0f}, {sz.x - 24.0f, sz.y - 24.0f}, Palette::Amber);
                renderer.DrawText({pos.x + 16.0f, pos.y + 18.0f}, "+", Palette::Background, 1.0f);
            }
            else if (item.Type == ItemType::LaserRow)
            {
                renderer.DrawQuad(pos, sz, Palette::Cyan);
                renderer.DrawText({pos.x + 14.0f, pos.y + 18.0f}, "LAS", Palette::Background, 0.75f);
            }
            else if (item.Type == ItemType::Bomb)
            {
                renderer.DrawQuad(pos, sz, Palette::Red);
                renderer.DrawText({pos.x + 14.0f, pos.y + 18.0f}, "TNT", Palette::Background, 0.75f);
            }
        }

        // 4. Trajectory Aim Guide
        if (m_state == State::Aiming)
        {
            const glm::vec2 dir{std::cos(m_aimAngle), std::sin(m_aimAngle)};
            for (int i = 1; i <= 24; ++i)
            {
                const glm::vec2 dotPos = m_cannonPos + dir * (i * 22.0f);
                if (dotPos.y < kBoardOriginY || dotPos.x < kBoardOriginX || dotPos.x > kBoardOriginX + kCols * kCellSize)
                    break;
                renderer.DrawQuad(dotPos - glm::vec2{2.5f, 2.5f}, {5.0f, 5.0f}, Palette::Cyan);
            }

            // Cannon Origin Indicator
            renderer.DrawQuad(m_cannonPos - glm::vec2{8.0f, 8.0f}, {16.0f, 16.0f}, Palette::Amber);
            renderer.DrawText({m_cannonPos.x - 20.0f, m_cannonPos.y + 15.0f}, "x" + std::to_string(m_ballCount), Palette::Text, 0.85f);
        }

        // 5. Active Balls
        for (const auto &b : m_balls)
        {
            if (b.Active)
            {
                renderer.DrawQuad(b.Position - glm::vec2{4.5f, 4.5f}, {9.0f, 9.0f}, Palette::Text);
            }
        }

        // 6. Particles
        m_particles.Render(renderer);

        // 7. HUD
        renderer.DrawText({40.0f, 25.0f}, "BALL SHOOTERS", Palette::Cyan, 1.2f);
        renderer.DrawText({360.0f, 25.0f}, "SCORE: " + FormatNum(m_score), Palette::Text, 1.0f);
        renderer.DrawText({720.0f, 25.0f}, "WAVE: " + std::to_string(m_wave), Palette::Amber, 1.0f);
        renderer.DrawText({960.0f, 25.0f}, "BALLS: " + std::to_string(m_ballCount), Palette::Lime, 1.0f);

        if (m_state == State::GameOver)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.88f});
            renderer.DrawText({kScreenWidth * 0.5f - 90.0f, kScreenHeight * 0.5f - 25.0f}, "GAME OVER", Palette::Red, 1.2f);
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f + 15.0f}, "PRESS SPACE TO RESTART", Palette::Text, 0.9f);
        }
    }
}
