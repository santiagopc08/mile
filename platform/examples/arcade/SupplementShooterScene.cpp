#include "examples/arcade/SupplementShooterScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace platform::arcade
{
    namespace
    {
        glm::vec4 GetBlockColor(int blockId)
        {
            switch (blockId)
            {
            case 1: return Palette::Cyan;
            case 2: return Palette::Amber;
            case 3: return Palette::Magenta;
            case 4: return Palette::Lime;
            case 5: return Palette::Violet;
            default: return Palette::Text;
            }
        }

        std::string FormatNum(int val)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "%06d", val);
            return std::string(buf);
        }
    }

    SupplementShooterScene::SupplementShooterScene(ArcadeSession *session)
        : ArcadeScene("Supplement Shooter", session)
    {
    }

    void SupplementShooterScene::OnInitialize()
    {
        ResetGame();
    }

    void SupplementShooterScene::ResetGame()
    {
        m_state = State::Ready;
        for (auto &row : m_grid)
        {
            row.fill(0);
        }

        m_score = 0;
        m_stage = 1;
        m_blocksCleared = 0;
        m_combo = 0;
        m_playerCol = 4;
        m_playerVisualX = kBoardOriginX + (m_playerCol + 0.5f) * kCellSize;
        m_descendInterval = 1.2f;
        m_descendTimer = 0.0f;
        m_shootCooldown = 0.0f;

        m_projectiles.clear();
        m_particles.Clear();

        SpawnPattern();
        SpawnPattern();
    }

    void SupplementShooterScene::SpawnPattern()
    {
        // Check if any block crosses danger line
        for (int c = 0; c < kGridCols; ++c)
        {
            if (m_grid[15][c] != 0)
            {
                m_state = State::GameOver;
                return;
            }
        }

        // Shift rows down by 3
        for (int r = kGridRows - 1; r >= 3; --r)
        {
            m_grid[r] = m_grid[r - 3];
        }
        for (int r = 0; r < 3; ++r)
        {
            m_grid[r].fill(0);
        }

        // Generate irregular notched geometric shapes
        const int colStart = m_random.RangeInt(1, kGridCols - 4);
        const int width = m_random.RangeInt(3, 4);
        const int height = 3;
        const int blockId = m_random.RangeInt(1, 5);

        // Fill with a few missing gap slots to "supplement"
        for (int r = 0; r < height; ++r)
        {
            for (int c = 0; c < width; ++c)
            {
                if ((r == 1 && c == 1) || (r == 2 && c == 0) || (r == 2 && c == width - 1))
                {
                    m_grid[r][colStart + c] = 0; // Empty gap to fill
                }
                else
                {
                    m_grid[r][colStart + c] = blockId;
                }
            }
        }
    }

    void SupplementShooterScene::ShootBlock()
    {
        if (m_state != State::Playing || m_shootCooldown > 0.0f) return;
        m_shootCooldown = 0.14f;

        const glm::vec2 spawnPos{
            kBoardOriginX + (m_playerCol + 0.5f) * kCellSize,
            kDangerLineY + 20.0f
        };

        m_projectiles.push_back({
            spawnPos,
            720.0f,
            m_playerCol,
            true
        });

        m_particles.Burst(spawnPos, Palette::Cyan, 4, 60.0f, 1.5f);
    }

    bool SupplementShooterScene::IsSolidRectangle(int r1, int c1, int r2, int c2) const
    {
        for (int r = r1; r <= r2; ++r)
        {
            for (int c = c1; c <= c2; ++c)
            {
                if (m_grid[r][c] == 0) return false;
            }
        }
        return true;
    }

    void SupplementShooterScene::CheckCompletedRectangles()
    {
        // Search for solid bounding rectangles (at least 2x2)
        for (int h = 6; h >= 2; --h)
        {
            for (int w = 6; w >= 2; --w)
            {
                for (int r = 0; r <= kGridRows - h; ++r)
                {
                    for (int c = 0; c <= kGridCols - w; ++c)
                    {
                        if (IsSolidRectangle(r, c, r + h - 1, c + w - 1))
                        {
                            // Rectangle Completed! Detonate and clear!
                            const int clearedCount = w * h;
                            m_blocksCleared += clearedCount;
                            m_combo++;

                            const int pts = clearedCount * 50 * m_combo * m_stage;
                            m_score += pts;

                            // Clear cells and explode
                            for (int dr = r; dr < r + h; ++dr)
                            {
                                for (int dc = c; dc < c + w; ++dc)
                                {
                                    const glm::vec2 pPos{
                                        kBoardOriginX + (dc + 0.5f) * kCellSize,
                                        kBoardOriginY + (dr + 0.5f) * kCellSize
                                    };
                                    m_particles.Burst(pPos, GetBlockColor(m_grid[dr][dc]), 12, 160.0f, 3.5f);
                                    m_grid[dr][dc] = 0;
                                }
                            }

                            if (m_blocksCleared >= m_stage * 25)
                            {
                                m_stage++;
                                m_descendInterval = std::max(0.35f, 1.2f - (m_stage - 1) * 0.1f);
                            }

                            if (m_score > m_highScore)
                            {
                                m_highScore = m_score;
                            }
                            return; // Re-evaluate next update
                        }
                    }
                }
            }
        }
    }

    void SupplementShooterScene::UpdateGrid(float dt)
    {
        m_descendTimer += dt;
        if (m_descendTimer >= m_descendInterval)
        {
            m_descendTimer = 0.0f;
            // Shift all grid rows down by 1
            for (int c = 0; c < kGridCols; ++c)
            {
                if (m_grid[15][c] != 0)
                {
                    m_state = State::GameOver;
                    return;
                }
            }

            for (int r = kGridRows - 1; r > 0; --r)
            {
                m_grid[r] = m_grid[r - 1];
            }
            m_grid[0].fill(0);

            // Spawn new shape periodically
            if (m_random.NextFloat() < 0.35f)
            {
                SpawnPattern();
            }
        }
    }

    void SupplementShooterScene::OnUpdate(double dt)
    {
        const auto step = static_cast<float>(dt);
        m_particles.Update(step);
        m_shootCooldown = std::max(0.0f, m_shootCooldown - step);

        auto *input = Device();
        if (input)
        {
            if (m_state == State::Playing)
            {
                if (input->IsKeyHeld(Key::Left) || input->IsKeyHeld(Key::A))
                {
                    m_playerCol = std::max(0, m_playerCol - 1);
                }
                else if (input->IsKeyHeld(Key::Right) || input->IsKeyHeld(Key::D))
                {
                    m_playerCol = std::min(kGridCols - 1, m_playerCol + 1);
                }

                if (input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::J))
                {
                    ShootBlock();
                }
            }

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

        m_playerVisualX = kBoardOriginX + (m_playerCol + 0.5f) * kCellSize;

        if (m_state == State::Playing)
        {
            UpdateGrid(step);

            // Update Block Projectiles
            for (auto &proj : m_projectiles)
            {
                if (!proj.Active) continue;
                proj.Position.y -= proj.Speed * step;

                const int col = proj.TargetCol;
                const int row = static_cast<int>((proj.Position.y - kBoardOriginY) / kCellSize);

                if (row < 0)
                {
                    proj.Active = false;
                    continue;
                }

                // Check collision with lowest solid block in that column or top of grid
                if (row >= 0 && row < kGridRows)
                {
                    if (row == 0 || m_grid[row - 1][col] != 0)
                    {
                        // Plug the gap!
                        m_grid[row][col] = 1; // Solid player plug block
                        proj.Active = false;

                        const glm::vec2 pPos{
                            kBoardOriginX + (col + 0.5f) * kCellSize,
                            kBoardOriginY + (row + 0.5f) * kCellSize
                        };
                        m_particles.Burst(pPos, Palette::Cyan, 8, 100.0f, 2.5f);

                        CheckCompletedRectangles();
                    }
                }
            }

            // Cleanup inactive projectiles
            m_projectiles.erase(std::remove_if(m_projectiles.begin(), m_projectiles.end(), [](const BlockProjectile &p) { return !p.Active; }), m_projectiles.end());
        }
    }

    void SupplementShooterScene::OnRender(Renderer &renderer)
    {
        // 1. Grid Background
        for (int r = 0; r < kGridRows; ++r)
        {
            for (int c = 0; c < kGridCols; ++c)
            {
                const glm::vec2 cellPos{
                    kBoardOriginX + c * kCellSize,
                    kBoardOriginY + r * kCellSize
                };
                renderer.DrawQuad(cellPos, {kCellSize - 1.0f, kCellSize - 1.0f}, glm::vec4{0.04f, 0.05f, 0.1f, 0.6f});

                if (m_grid[r][c] != 0)
                {
                    renderer.DrawQuad(cellPos + glm::vec2{1.0f}, {kCellSize - 3.0f, kCellSize - 3.0f}, GetBlockColor(m_grid[r][c]));
                }
            }
        }

        // 2. Playfield Outline
        const glm::vec2 boardPos{kBoardOriginX - 2.0f, kBoardOriginY - 2.0f};
        const glm::vec2 boardSize{kGridCols * kCellSize + 4.0f, kGridRows * kCellSize + 4.0f};
        renderer.DrawQuad(boardPos, {boardSize.x, 3.0f}, Palette::Cyan);
        renderer.DrawQuad(boardPos, {3.0f, boardSize.y}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x + boardSize.x, boardPos.y}, {3.0f, boardSize.y}, Palette::Cyan);

        // 3. Danger Floor Line (Red)
        renderer.DrawQuad({kBoardOriginX, kDangerLineY}, {kGridCols * kCellSize, 3.0f}, Palette::Red);

        // 4. Player Ship
        const glm::vec2 shipPos{m_playerVisualX - 16.0f, kDangerLineY + 16.0f};
        renderer.DrawQuad(shipPos, {32.0f, 18.0f}, Palette::Cyan);
        renderer.DrawQuad({m_playerVisualX - 4.0f, kDangerLineY + 8.0f}, {8.0f, 8.0f}, Palette::Amber);

        // 5. Block Projectiles
        for (const auto &p : m_projectiles)
        {
            if (p.Active)
            {
                renderer.DrawQuad(p.Position - glm::vec2{8.0f, 8.0f}, {16.0f, 16.0f}, Palette::Cyan);
            }
        }

        // 6. Particles
        m_particles.Render(renderer);

        // 7. HUD Stats
        renderer.DrawText({40.0f, 15.0f}, "SUPPLEMENT SHOOTER", Palette::Cyan, 1.1f);
        renderer.DrawText({360.0f, 15.0f}, "SCORE: " + FormatNum(m_score), Palette::Text, 0.95f);
        renderer.DrawText({660.0f, 15.0f}, "STAGE: " + std::to_string(m_stage), Palette::Amber, 0.95f);
        renderer.DrawText({880.0f, 15.0f}, "CLEARED: " + std::to_string(m_blocksCleared), Palette::Lime, 0.95f);

        if (m_state == State::Ready)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.88f});
            renderer.DrawText({kScreenWidth * 0.5f - 170.0f, kScreenHeight * 0.5f - 20.0f}, "PRESS SPACE TO START FILLING", Palette::Cyan, 1.0f);
        }
        else if (m_state == State::GameOver)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.92f});
            renderer.DrawText({kScreenWidth * 0.5f - 110.0f, kScreenHeight * 0.5f - 25.0f}, "GAME OVER", Palette::Red, 1.2f);
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f + 15.0f}, "PRESS SPACE TO RESTART", Palette::Text, 0.9f);
        }
    }
}
