#include "examples/arcade/CyberFroggerScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace platform::arcade
{
    namespace
    {
        const std::array<int, 5> kHomeCols = {1, 4, 7, 10, 13};

        std::string FormatNum(int val)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "%06d", val);
            return std::string(buf);
        }
    }

    CyberFroggerScene::CyberFroggerScene(ArcadeSession *session)
        : ArcadeScene("Cyber Frogger", session)
    {
    }

    void CyberFroggerScene::OnInitialize()
    {
        ResetGame();
    }

    void CyberFroggerScene::ResetGame()
    {
        m_state = State::Ready;
        m_stage = 1;
        m_score = 0;
        m_lives = 3;
        m_homeFilled.fill(false);
        m_flyBayIndex = -1;
        m_flyTimer = 0.0f;

        SetupStage(m_stage);
    }

    void CyberFroggerScene::SetupStage(int stage)
    {
        m_playerCol = 7;
        m_playerRow = 12;
        m_playerVisualX = kBoardOriginX + (m_playerCol + 0.5f) * kCellSize;
        m_playerVisualY = kBoardOriginY + (m_playerRow + 0.5f) * kCellSize;
        m_hopTimer = 0.0f;
        m_timeRemaining = 45.0f;

        m_obstacles.clear();
        m_particles.Clear();

        const float stageMultiplier = 1.0f + (stage - 1) * 0.15f;

        // ── Road Obstacles (Rows 7 - 11) ────────────────────────────────────
        // Row 11: Slow Sedans ->
        for (int i = 0; i < 3; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 220.0f, kBoardOriginY + 11 * kCellSize + 6.0f},
                glm::vec2{50.0f, 32.0f},
                70.0f * stageMultiplier,
                ObstacleType::Car,
                Palette::Amber,
                11,
                false
            });
        }
        // Row 10: Fast Racers <-
        for (int i = 0; i < 3; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 240.0f, kBoardOriginY + 10 * kCellSize + 6.0f},
                glm::vec2{48.0f, 32.0f},
                -130.0f * stageMultiplier,
                ObstacleType::Racer,
                Palette::Magenta,
                10,
                false
            });
        }
        // Row 9: Bulldozers ->
        for (int i = 0; i < 3; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 210.0f, kBoardOriginY + 9 * kCellSize + 6.0f},
                glm::vec2{55.0f, 32.0f},
                85.0f * stageMultiplier,
                ObstacleType::Car,
                Palette::Lime,
                9,
                false
            });
        }
        // Row 8: Speedy Sedans <-
        for (int i = 0; i < 2; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 320.0f, kBoardOriginY + 8 * kCellSize + 6.0f},
                glm::vec2{50.0f, 32.0f},
                -160.0f * stageMultiplier,
                ObstacleType::Racer,
                Palette::Cyan,
                8,
                false
            });
        }
        // Row 7: Heavy Freight Trucks ->
        for (int i = 0; i < 2; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 340.0f, kBoardOriginY + 7 * kCellSize + 6.0f},
                glm::vec2{90.0f, 32.0f},
                65.0f * stageMultiplier,
                ObstacleType::Truck,
                glm::vec4{0.3f, 0.6f, 0.9f, 1.0f},
                7,
                false
            });
        }

        // ── River Logs & Turtles (Rows 1 - 5) ───────────────────────────────
        // Row 5: Medium Logs ->
        for (int i = 0; i < 3; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 240.0f, kBoardOriginY + 5 * kCellSize + 4.0f},
                glm::vec2{110.0f, 36.0f},
                80.0f * stageMultiplier,
                ObstacleType::LogMedium,
                glm::vec4{0.6f, 0.35f, 0.15f, 1.0f},
                5,
                true
            });
        }
        // Row 4: Turtles <-
        for (int i = 0; i < 4; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 190.0f, kBoardOriginY + 4 * kCellSize + 4.0f},
                glm::vec2{80.0f, 36.0f},
                -90.0f * stageMultiplier,
                ObstacleType::Turtles,
                glm::vec4{0.2f, 0.75f, 0.5f, 1.0f},
                4,
                true
            });
        }
        // Row 3: Large Logs ->
        for (int i = 0; i < 2; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 360.0f, kBoardOriginY + 3 * kCellSize + 4.0f},
                glm::vec2{170.0f, 36.0f},
                110.0f * stageMultiplier,
                ObstacleType::LogLarge,
                glm::vec4{0.6f, 0.35f, 0.15f, 1.0f},
                3,
                true
            });
        }
        // Row 2: Small Logs ->
        for (int i = 0; i < 3; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 220.0f, kBoardOriginY + 2 * kCellSize + 4.0f},
                glm::vec2{85.0f, 36.0f},
                65.0f * stageMultiplier,
                ObstacleType::LogSmall,
                glm::vec4{0.6f, 0.35f, 0.15f, 1.0f},
                2,
                true
            });
        }
        // Row 1: Turtles <-
        for (int i = 0; i < 3; ++i)
        {
            m_obstacles.push_back({
                glm::vec2{kBoardOriginX + i * 230.0f, kBoardOriginY + 1 * kCellSize + 4.0f},
                glm::vec2{95.0f, 36.0f},
                -100.0f * stageMultiplier,
                ObstacleType::Turtles,
                glm::vec4{0.2f, 0.75f, 0.5f, 1.0f},
                1,
                true
            });
        }
    }

    void CyberFroggerScene::MovePlayer(int dx, int dy)
    {
        if (m_state != State::Playing) return;

        const int targetCol = std::max(0, std::min(kGridCols - 1, m_playerCol + dx));
        const int targetRow = std::max(0, std::min(kGridRows - 1, m_playerRow + dy));

        // Bonus for forward hop
        if (targetRow < m_playerRow)
        {
            m_score += 10;
        }

        m_playerCol = targetCol;
        m_playerRow = targetRow;
        m_hopTimer = 0.12f;

        // Particle hop puff
        const glm::vec2 pPos{kBoardOriginX + (m_playerCol + 0.5f) * kCellSize, kBoardOriginY + (m_playerRow + 0.5f) * kCellSize};
        m_particles.Burst(pPos, Palette::Lime, 6, 60.0f, 2.0f);

        // Check if reached Home Row (Row 0)
        if (m_playerRow == 0)
        {
            bool landedHome = false;
            for (size_t i = 0; i < kHomeCols.size(); ++i)
            {
                if (m_playerCol == kHomeCols[i] && !m_homeFilled[i])
                {
                    m_homeFilled[i] = true;
                    landedHome = true;
                    m_score += 500 + static_cast<int>(m_timeRemaining * 10.0f);

                    if (m_flyBayIndex == static_cast<int>(i))
                    {
                        m_score += 200;
                        m_flyBayIndex = -1;
                    }

                    m_particles.Burst(pPos, Palette::Amber, 25, 180.0f, 4.0f);

                    // Check if all 5 homes are filled
                    bool allFilled = true;
                    for (bool filled : m_homeFilled)
                    {
                        if (!filled) { allFilled = false; break; }
                    }

                    if (allFilled)
                    {
                        m_stage++;
                        m_score += 1000;
                        m_homeFilled.fill(false);
                        SetupStage(m_stage);
                    }
                    else
                    {
                        // Reset frog position
                        m_playerCol = 7;
                        m_playerRow = 12;
                        m_timeRemaining = 45.0f;
                    }
                    break;
                }
            }

            if (!landedHome)
            {
                KillPlayer("Missed home bay / hit alligator wall");
            }
        }
    }

    void CyberFroggerScene::KillPlayer(const std::string &reason)
    {
        (void)reason;
        const glm::vec2 pPos{kBoardOriginX + (m_playerCol + 0.5f) * kCellSize, kBoardOriginY + (m_playerRow + 0.5f) * kCellSize};
        m_particles.Burst(pPos, Palette::Red, 35, 200.0f, 5.0f);

        m_lives--;
        if (m_lives > 0)
        {
            m_playerCol = 7;
            m_playerRow = 12;
            m_timeRemaining = 45.0f;
        }
        else
        {
            m_state = State::GameOver;
            if (m_score > m_highScore)
            {
                m_highScore = m_score;
            }
        }
    }

    void CyberFroggerScene::CheckCollisions(float dt)
    {
        const float frogX = kBoardOriginX + (m_playerCol + 0.5f) * kCellSize;
        const float frogY = kBoardOriginY + (m_playerRow + 0.5f) * kCellSize;

        // 1. Road Collisions (Rows 7 to 11)
        if (m_playerRow >= 7 && m_playerRow <= 11)
        {
            for (const auto &obs : m_obstacles)
            {
                if (obs.Row == m_playerRow)
                {
                    if (frogX >= obs.Position.x - 14.0f && frogX <= obs.Position.x + obs.Size.x + 14.0f)
                    {
                        KillPlayer("Car Squashed");
                        return;
                    }
                }
            }
        }

        // 2. River Collisions (Rows 1 to 5)
        if (m_playerRow >= 1 && m_playerRow <= 5)
        {
            bool onRide = false;
            float rideSpeed = 0.0f;

            for (const auto &obs : m_obstacles)
            {
                if (obs.Row == m_playerRow && obs.IsWaterRide)
                {
                    if (frogX >= obs.Position.x - 8.0f && frogX <= obs.Position.x + obs.Size.x + 8.0f)
                    {
                        onRide = true;
                        rideSpeed = obs.Speed;
                        break;
                    }
                }
            }

            if (onRide)
            {
                // Drift with log/turtle
                m_playerVisualX += rideSpeed * dt;
                m_playerCol = static_cast<int>(std::round((m_playerVisualX - kBoardOriginX) / kCellSize - 0.5f));

                // Carried off-screen
                if (m_playerVisualX < kBoardOriginX - 10.0f || m_playerVisualX > kBoardOriginX + kGridCols * kCellSize + 10.0f)
                {
                    KillPlayer("Carried off screen");
                    return;
                }
            }
            else
            {
                // Drown in water
                KillPlayer("Drowned in river");
                return;
            }
        }
        else
        {
            m_playerVisualX = kBoardOriginX + (m_playerCol + 0.5f) * kCellSize;
        }

        m_playerVisualY = kBoardOriginY + (m_playerRow + 0.5f) * kCellSize;
    }

    void CyberFroggerScene::OnUpdate(double dt)
    {
        const auto step = static_cast<float>(dt);
        m_particles.Update(step);

        auto *input = Device();
        if (input)
        {
            const bool up = input->IsKeyHeld(Key::Up) || input->IsKeyHeld(Key::W);
            if (up && !m_upLatch)
            {
                MovePlayer(0, -1);
                m_upLatch = true;
            }
            else if (!up) m_upLatch = false;

            const bool down = input->IsKeyHeld(Key::Down) || input->IsKeyHeld(Key::S);
            if (down && !m_downLatch)
            {
                MovePlayer(0, 1);
                m_downLatch = true;
            }
            else if (!down) m_downLatch = false;

            const bool left = input->IsKeyHeld(Key::Left) || input->IsKeyHeld(Key::A);
            if (left && !m_leftLatch)
            {
                MovePlayer(-1, 0);
                m_leftLatch = true;
            }
            else if (!left) m_leftLatch = false;

            const bool right = input->IsKeyHeld(Key::Right) || input->IsKeyHeld(Key::D);
            if (right && !m_rightLatch)
            {
                MovePlayer(1, 0);
                m_rightLatch = true;
            }
            else if (!right) m_rightLatch = false;

            const bool space = input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::Enter);
            if (space && !m_spaceLatch)
            {
                if (m_state == State::Ready)
                    m_state = State::Playing;
                else if (m_state == State::GameOver)
                    ResetGame();
                m_spaceLatch = true;
            }
            else if (!space) m_spaceLatch = false;

            const bool esc = input->IsKeyHeld(Key::Escape);
            if (esc && !m_escLatch)
            {
                if (m_session) m_session->Request(ArcadeScreen::Menu);
                m_escLatch = true;
            }
            else if (!esc) m_escLatch = false;
        }

        if (m_state == State::Playing)
        {
            m_timeRemaining -= step;
            if (m_timeRemaining <= 0.0f)
            {
                KillPlayer("Time Out");
            }

            // Fly bonus timer
            m_flyTimer -= step;
            if (m_flyTimer <= 0.0f)
            {
                m_flyTimer = m_random.Range(5.0f, 10.0f);
                m_flyBayIndex = m_random.RangeInt(0, 4);
                if (m_homeFilled[m_flyBayIndex]) m_flyBayIndex = -1;
            }

            // Update obstacles
            const float boardLeft = kBoardOriginX - 180.0f;
            const float boardRight = kBoardOriginX + kGridCols * kCellSize + 180.0f;

            for (auto &obs : m_obstacles)
            {
                obs.Position.x += obs.Speed * step;
                if (obs.Speed > 0.0f && obs.Position.x > boardRight)
                {
                    obs.Position.x = boardLeft - obs.Size.x;
                }
                else if (obs.Speed < 0.0f && obs.Position.x < boardLeft - obs.Size.x)
                {
                    obs.Position.x = boardRight;
                }
            }

            CheckCollisions(step);
        }
    }

    void CyberFroggerScene::OnRender(Renderer &renderer)
    {
        // 1. Grid Backgrounds
        // River Zone (Rows 0 - 5)
        renderer.DrawQuad({kBoardOriginX, kBoardOriginY}, {kGridCols * kCellSize, 6 * kCellSize}, glm::vec4{0.05f, 0.15f, 0.35f, 1.0f});
        // Median Island (Row 6)
        renderer.DrawQuad({kBoardOriginX, kBoardOriginY + 6 * kCellSize}, {kGridCols * kCellSize, kCellSize}, glm::vec4{0.1f, 0.4f, 0.15f, 1.0f});
        // Highway Zone (Rows 7 - 11)
        renderer.DrawQuad({kBoardOriginX, kBoardOriginY + 7 * kCellSize}, {kGridCols * kCellSize, 5 * kCellSize}, glm::vec4{0.08f, 0.09f, 0.14f, 1.0f});
        // Starting Sidewalk (Row 12)
        renderer.DrawQuad({kBoardOriginX, kBoardOriginY + 12 * kCellSize}, {kGridCols * kCellSize, kCellSize}, glm::vec4{0.1f, 0.4f, 0.15f, 1.0f});

        // 2. Destination Bays & Lily Pads (Row 0)
        for (size_t i = 0; i < kHomeCols.size(); ++i)
        {
            const float bayX = kBoardOriginX + kHomeCols[i] * kCellSize;
            const float bayY = kBoardOriginY;

            if (m_homeFilled[i])
            {
                renderer.DrawQuad({bayX + 4.0f, bayY + 4.0f}, {kCellSize - 8.0f, kCellSize - 8.0f}, Palette::Lime);
                renderer.DrawText({bayX + 12.0f, bayY + 12.0f}, "🐸", Palette::Background, 1.0f);
            }
            else
            {
                renderer.DrawQuad({bayX + 4.0f, bayY + 4.0f}, {kCellSize - 8.0f, kCellSize - 8.0f}, glm::vec4{0.02f, 0.3f, 0.2f, 0.8f});
                if (m_flyBayIndex == static_cast<int>(i))
                {
                    renderer.DrawText({bayX + 14.0f, bayY + 12.0f}, "🪰", Palette::Amber, 0.9f);
                }
            }
        }

        // 3. Obstacles (Logs, Turtles, Cars, Trucks)
        for (const auto &obs : m_obstacles)
        {
            renderer.DrawQuad(obs.Position, obs.Size, obs.Color);
            if (obs.Type == ObstacleType::Turtles)
            {
                renderer.DrawQuad(obs.Position + glm::vec2{6.0f, 6.0f}, {obs.Size.x - 12.0f, obs.Size.y - 12.0f}, Palette::Lime);
            }
        }

        // 4. Player Cyber Frog
        if (m_state != State::GameOver)
        {
            const glm::vec2 fPos{m_playerVisualX - 16.0f, m_playerVisualY - 16.0f};
            renderer.DrawQuad(fPos, {32.0f, 32.0f}, Palette::Lime);
            // Frog Eyes
            renderer.DrawQuad(fPos + glm::vec2{4.0f, 4.0f}, {6.0f, 6.0f}, Palette::Text);
            renderer.DrawQuad(fPos + glm::vec2{22.0f, 4.0f}, {6.0f, 6.0f}, Palette::Text);
        }

        // 5. Particles
        m_particles.Render(renderer);

        // 6. HUD Dashboard
        renderer.DrawText({40.0f, 15.0f}, "CYBER FROGGER", Palette::Cyan, 1.1f);
        renderer.DrawText({340.0f, 15.0f}, "SCORE: " + FormatNum(m_score), Palette::Text, 0.95f);
        renderer.DrawText({640.0f, 15.0f}, "STAGE: " + std::to_string(m_stage), Palette::Amber, 0.95f);
        renderer.DrawText({840.0f, 15.0f}, "LIVES: " + std::to_string(m_lives), Palette::Lime, 0.95f);
        renderer.DrawText({1040.0f, 15.0f}, "TIME: " + std::to_string(static_cast<int>(m_timeRemaining)), Palette::Red, 0.95f);

        if (m_state == State::Ready)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.88f});
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f - 20.0f}, "PRESS SPACE TO START FROGGER", Palette::Cyan, 1.0f);
        }
        else if (m_state == State::GameOver)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.92f});
            renderer.DrawText({kScreenWidth * 0.5f - 110.0f, kScreenHeight * 0.5f - 25.0f}, "GAME OVER", Palette::Red, 1.2f);
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f + 15.0f}, "PRESS SPACE TO RESTART", Palette::Text, 0.9f);
        }
    }
}
