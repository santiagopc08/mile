#include "examples/arcade/TetrisMatrixScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace platform::arcade
{
    namespace
    {
        // 4x4 matrix representation of pieces across 4 rotations
        const std::array<glm::ivec2, 4> GetPieceOffsets(TetrisMatrixScene::Tetromino type, int rotation)
        {
            const int rot = (rotation % 4 + 4) % 4;
            switch (type)
            {
            case TetrisMatrixScene::Tetromino::I:
                if (rot == 0) return {{{0, 1}, {1, 1}, {2, 1}, {3, 1}}};
                if (rot == 1) return {{{2, 0}, {2, 1}, {2, 2}, {2, 3}}};
                if (rot == 2) return {{{0, 2}, {1, 2}, {2, 2}, {3, 2}}};
                return {{{1, 0}, {1, 1}, {1, 2}, {1, 3}}};
            case TetrisMatrixScene::Tetromino::J:
                if (rot == 0) return {{{0, 0}, {0, 1}, {1, 1}, {2, 1}}};
                if (rot == 1) return {{{1, 0}, {2, 0}, {1, 1}, {1, 2}}};
                if (rot == 2) return {{{0, 1}, {1, 1}, {2, 1}, {2, 2}}};
                return {{{1, 0}, {1, 1}, {0, 2}, {1, 2}}};
            case TetrisMatrixScene::Tetromino::L:
                if (rot == 0) return {{{2, 0}, {0, 1}, {1, 1}, {2, 1}}};
                if (rot == 1) return {{{1, 0}, {1, 1}, {1, 2}, {2, 2}}};
                if (rot == 2) return {{{0, 1}, {1, 1}, {2, 1}, {0, 2}}};
                return {{{0, 0}, {1, 0}, {1, 1}, {1, 2}}};
            case TetrisMatrixScene::Tetromino::O:
                return {{{1, 0}, {2, 0}, {1, 1}, {2, 1}}};
            case TetrisMatrixScene::Tetromino::S:
                if (rot == 0 || rot == 2) return {{{1, 0}, {2, 0}, {0, 1}, {1, 1}}};
                return {{{1, 0}, {1, 1}, {2, 1}, {2, 2}}};
            case TetrisMatrixScene::Tetromino::T:
                if (rot == 0) return {{{1, 0}, {0, 1}, {1, 1}, {2, 1}}};
                if (rot == 1) return {{{1, 0}, {1, 1}, {2, 1}, {1, 2}}};
                if (rot == 2) return {{{0, 1}, {1, 1}, {2, 1}, {1, 2}}};
                return {{{1, 0}, {0, 1}, {1, 1}, {1, 2}}};
            case TetrisMatrixScene::Tetromino::Z:
                if (rot == 0 || rot == 2) return {{{0, 0}, {1, 0}, {1, 1}, {2, 1}}};
                return {{{2, 0}, {1, 1}, {2, 1}, {1, 2}}};
            default:
                return {{{0, 0}, {0, 0}, {0, 0}, {0, 0}}};
            }
        }

        glm::vec4 GetTetrominoColor(TetrisMatrixScene::Tetromino type)
        {
            switch (type)
            {
            case TetrisMatrixScene::Tetromino::I: return Palette::Cyan;
            case TetrisMatrixScene::Tetromino::J: return glm::vec4{0.2f, 0.45f, 0.95f, 1.0f};
            case TetrisMatrixScene::Tetromino::L: return Palette::Amber;
            case TetrisMatrixScene::Tetromino::O: return glm::vec4{0.99f, 0.88f, 0.2f, 1.0f};
            case TetrisMatrixScene::Tetromino::S: return Palette::Lime;
            case TetrisMatrixScene::Tetromino::T: return Palette::Violet;
            case TetrisMatrixScene::Tetromino::Z: return Palette::Red;
            default: return Palette::Dim;
            }
        }

        std::string FormatNum(int val)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "%06d", val);
            return std::string(buf);
        }
    }

    TetrisMatrixScene::TetrisMatrixScene(ArcadeSession *session)
        : ArcadeScene("Tetris Matrix", session)
    {
    }

    void TetrisMatrixScene::OnInitialize()
    {
        ResetGame();
    }

    void TetrisMatrixScene::FillBag()
    {
        std::array<Tetromino, 7> pieces = {
            Tetromino::I, Tetromino::J, Tetromino::L, Tetromino::O,
            Tetromino::S, Tetromino::T, Tetromino::Z
        };

        // Fisher-Yates shuffle
        for (int i = 6; i > 0; --i)
        {
            const int j = m_random.RangeInt(0, i);
            std::swap(pieces[i], pieces[j]);
        }

        for (const auto &p : pieces)
        {
            m_bag.push_back(p);
        }
    }

    void TetrisMatrixScene::ResetGame()
    {
        m_state = State::Ready;
        for (auto &row : m_grid)
        {
            row.fill(Tetromino::None);
        }

        m_score = 0;
        m_lines = 0;
        m_level = 1;
        m_combo = 0;
        m_fallInterval = 0.8f;
        m_fallTimer = 0.0f;
        m_lockTimer = 0.0f;
        m_isLocking = false;
        m_hold = Tetromino::None;
        m_canHold = true;
        m_bag.clear();
        m_particles.Clear();

        FillBag();
        FillBag();
        SpawnNextPiece();
    }

    void TetrisMatrixScene::SpawnNextPiece()
    {
        if (m_bag.size() < 7)
        {
            FillBag();
        }

        const Tetromino next = m_bag.front();
        m_bag.pop_front();

        m_current = {next, 0, glm::ivec2{3, 0}};
        m_canHold = true;
        m_isLocking = false;
        m_lockTimer = 0.0f;

        if (!IsValidPosition(m_current))
        {
            m_state = State::GameOver;
        }
    }

    bool TetrisMatrixScene::IsValidPosition(const Piece &piece) const
    {
        if (piece.Type == Tetromino::None) return false;
        const auto offsets = GetPieceOffsets(piece.Type, piece.Rotation);

        for (const auto &off : offsets)
        {
            const int gx = piece.Position.x + off.x;
            const int gy = piece.Position.y + off.y;

            if (gx < 0 || gx >= kCols || gy < 0 || gy >= kRows)
                return false;

            if (m_grid[gy][gx] != Tetromino::None)
                return false;
        }
        return true;
    }

    int TetrisMatrixScene::CalculateGhostY() const
    {
        Piece test = m_current;
        while (IsValidPosition(test))
        {
            test.Position.y += 1;
        }
        return test.Position.y - 1;
    }

    void TetrisMatrixScene::MovePiece(int dx)
    {
        Piece test = m_current;
        test.Position.x += dx;
        if (IsValidPosition(test))
        {
            m_current = test;
            if (m_isLocking)
            {
                m_lockTimer = 0.0f; // Lock delay reset on move
            }
        }
    }

    void TetrisMatrixScene::RotatePiece(int dir)
    {
        Piece test = m_current;
        test.Rotation = (test.Rotation + dir + 4) % 4;

        // Basic wall kick offsets
        const std::array<glm::ivec2, 5> kicks = {
            glm::ivec2{0, 0}, glm::ivec2{-1, 0}, glm::ivec2{1, 0},
            glm::ivec2{0, -1}, glm::ivec2{-1, -1}
        };

        for (const auto &kick : kicks)
        {
            Piece kicked = test;
            kicked.Position += kick;
            if (IsValidPosition(kicked))
            {
                m_current = kicked;
                if (m_isLocking)
                {
                    m_lockTimer = 0.0f;
                }
                return;
            }
        }
    }

    void TetrisMatrixScene::HoldPiece()
    {
        if (!m_canHold || m_state != State::Playing) return;
        m_canHold = false;

        const Tetromino curType = m_current.Type;
        if (m_hold == Tetromino::None)
        {
            m_hold = curType;
            SpawnNextPiece();
        }
        else
        {
            const Tetromino swap = m_hold;
            m_hold = curType;
            m_current = {swap, 0, glm::ivec2{3, 0}};
            m_isLocking = false;
            m_lockTimer = 0.0f;
        }
    }

    void TetrisMatrixScene::HardDrop()
    {
        if (m_state != State::Playing) return;
        const int ghostY = CalculateGhostY();
        const int droppedRows = ghostY - m_current.Position.y;
        m_score += droppedRows * 2;
        m_current.Position.y = ghostY;

        // Particle impact burst
        const auto offsets = GetPieceOffsets(m_current.Type, m_current.Rotation);
        for (const auto &off : offsets)
        {
            const glm::vec2 worldPos{
                kBoardOriginX + (m_current.Position.x + off.x) * kCellSize + kCellSize * 0.5f,
                kBoardOriginY + (m_current.Position.y + off.y) * kCellSize + kCellSize * 0.5f
            };
            m_particles.Burst(worldPos, GetTetrominoColor(m_current.Type), 8, 140.0f, 3.5f);
        }

        LockPiece();
    }

    void TetrisMatrixScene::LockPiece()
    {
        const auto offsets = GetPieceOffsets(m_current.Type, m_current.Rotation);
        for (const auto &off : offsets)
        {
            const int gx = m_current.Position.x + off.x;
            const int gy = m_current.Position.y + off.y;
            if (gx >= 0 && gx < kCols && gy >= 0 && gy < kRows)
            {
                m_grid[gy][gx] = m_current.Type;
            }
        }

        CheckLineClears();
        SpawnNextPiece();
    }

    void TetrisMatrixScene::CheckLineClears()
    {
        int clearedCount = 0;
        for (int r = kRows - 1; r >= 0; --r)
        {
            bool full = true;
            for (int c = 0; c < kCols; ++c)
            {
                if (m_grid[r][c] == Tetromino::None)
                {
                    full = false;
                    break;
                }
            }

            if (full)
            {
                clearedCount++;
                // Particle line explosion
                for (int c = 0; c < kCols; ++c)
                {
                    const glm::vec2 wPos{
                        kBoardOriginX + c * kCellSize + kCellSize * 0.5f,
                        kBoardOriginY + r * kCellSize + kCellSize * 0.5f
                    };
                    m_particles.Burst(wPos, Palette::Cyan, 12, 190.0f, 4.0f);
                }

                // Shift rows down
                for (int downR = r; downR > 0; --downR)
                {
                    m_grid[downR] = m_grid[downR - 1];
                }
                m_grid[0].fill(Tetromino::None);
                r++; // Re-check current row
            }
        }

        if (clearedCount > 0)
        {
            m_lines += clearedCount;
            m_combo++;

            const int basePoints[5] = {0, 100, 300, 500, 800};
            const int pts = (basePoints[clearedCount] * m_level) + (m_combo > 1 ? (m_combo * 50 * m_level) : 0);
            m_score += pts;

            if (m_lines >= m_level * 10)
            {
                m_level++;
                m_fallInterval = std::max(0.1f, 0.8f - (m_level - 1) * 0.07f);
            }

            if (m_score > m_highScore)
            {
                m_highScore = m_score;
            }
        }
        else
        {
            m_combo = 0;
        }
    }

    void TetrisMatrixScene::OnUpdate(double dt)
    {
        const auto step = static_cast<float>(dt);
        m_particles.Update(step);

        auto *input = Device();
        if (input)
        {
            if (input->IsKeyHeld(Key::Left) || input->IsKeyHeld(Key::A))
            {
                MovePiece(-1);
            }
            else if (input->IsKeyHeld(Key::Right) || input->IsKeyHeld(Key::D))
            {
                MovePiece(1);
            }

            const bool up = input->IsKeyHeld(Key::Up) || input->IsKeyHeld(Key::W) || input->IsKeyHeld(Key::X);
            if (up && !m_upLatch)
            {
                RotatePiece(1);
                m_upLatch = true;
            }
            else if (!up)
            {
                m_upLatch = false;
            }

            const bool holdKey = input->IsKeyHeld(Key::C) || input->IsKeyHeld(Key::LeftShift);
            if (holdKey && !m_holdLatch)
            {
                HoldPiece();
                m_holdLatch = true;
            }
            else if (!holdKey)
            {
                m_holdLatch = false;
            }

            const bool space = input->IsKeyHeld(Key::Space);
            if (space && !m_spaceLatch)
            {
                if (m_state == State::Ready)
                    m_state = State::Playing;
                else if (m_state == State::GameOver)
                    ResetGame();
                else
                    HardDrop();
                m_spaceLatch = true;
            }
            else if (!space)
            {
                m_spaceLatch = false;
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

        if (m_state == State::Playing)
        {
            const bool softDrop = input && (input->IsKeyHeld(Key::Down) || input->IsKeyHeld(Key::S));
            const float interval = softDrop ? 0.05f : m_fallInterval;

            m_fallTimer += step;
            if (m_fallTimer >= interval)
            {
                m_fallTimer = 0.0f;
                Piece test = m_current;
                test.Position.y += 1;
                if (IsValidPosition(test))
                {
                    m_current = test;
                    m_isLocking = false;
                    m_lockTimer = 0.0f;
                    if (softDrop) m_score += 1;
                }
                else
                {
                    m_isLocking = true;
                }
            }

            if (m_isLocking)
            {
                m_lockTimer += step;
                if (m_lockTimer >= 0.5f)
                {
                    LockPiece();
                }
            }
        }
    }

    void TetrisMatrixScene::OnRender(Renderer &renderer)
    {
        // Board Background & Grid
        for (int r = 0; r < kRows; ++r)
        {
            for (int c = 0; c < kCols; ++c)
            {
                const glm::vec2 cellPos{
                    kBoardOriginX + c * kCellSize,
                    kBoardOriginY + r * kCellSize
                };
                renderer.DrawQuad(cellPos, {kCellSize - 1.0f, kCellSize - 1.0f}, glm::vec4{0.04f, 0.05f, 0.09f, 0.8f});

                if (m_grid[r][c] != Tetromino::None)
                {
                    renderer.DrawQuad(cellPos + glm::vec2{1.0f, 1.0f}, {kCellSize - 3.0f, kCellSize - 3.0f}, GetTetrominoColor(m_grid[r][c]));
                }
            }
        }

        // Board Border
        const glm::vec2 boardPos{kBoardOriginX - 2.0f, kBoardOriginY - 2.0f};
        const glm::vec2 boardSize{kCols * kCellSize + 4.0f, kRows * kCellSize + 4.0f};
        renderer.DrawQuad({boardPos.x, boardPos.y}, {boardSize.x, 3.0f}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x, boardPos.y + boardSize.y}, {boardSize.x, 3.0f}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x, boardPos.y}, {3.0f, boardSize.y}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x + boardSize.x, boardPos.y}, {3.0f, boardSize.y}, Palette::Cyan);

        // Ghost Piece
        if (m_state == State::Playing && m_current.Type != Tetromino::None)
        {
            const int ghostY = CalculateGhostY();
            const auto offsets = GetPieceOffsets(m_current.Type, m_current.Rotation);
            for (const auto &off : offsets)
            {
                const glm::vec2 pos{
                    kBoardOriginX + (m_current.Position.x + off.x) * kCellSize + 1.0f,
                    kBoardOriginY + (ghostY + off.y) * kCellSize + 1.0f
                };
                renderer.DrawQuad(pos, {kCellSize - 3.0f, kCellSize - 3.0f}, glm::vec4{1.0f, 1.0f, 1.0f, 0.15f});
            }

            // Current Active Piece
            const glm::vec4 curCol = GetTetrominoColor(m_current.Type);
            for (const auto &off : offsets)
            {
                const glm::vec2 pos{
                    kBoardOriginX + (m_current.Position.x + off.x) * kCellSize + 1.0f,
                    kBoardOriginY + (m_current.Position.y + off.y) * kCellSize + 1.0f
                };
                renderer.DrawQuad(pos, {kCellSize - 3.0f, kCellSize - 3.0f}, curCol);
            }
        }

        // Particle System
        m_particles.Render(renderer);

        // HUD Panels (Left: HOLD, Right: NEXT & STATS)
        renderer.DrawText({kBoardOriginX - 160.0f, kBoardOriginY + 20.0f}, "HOLD (C)", Palette::Cyan, 1.0f);
        renderer.DrawQuad({kBoardOriginX - 170.0f, kBoardOriginY + 50.0f}, {120.0f, 100.0f}, glm::vec4{0.05f, 0.06f, 0.12f, 0.9f});
        if (m_hold != Tetromino::None)
        {
            const auto holdOffsets = GetPieceOffsets(m_hold, 0);
            for (const auto &off : holdOffsets)
            {
                const glm::vec2 pos{
                    kBoardOriginX - 150.0f + off.x * 20.0f,
                    kBoardOriginY + 75.0f + off.y * 20.0f
                };
                renderer.DrawQuad(pos, {18.0f, 18.0f}, GetTetrominoColor(m_hold));
            }
        }

        // Right NEXT Preview
        renderer.DrawText({kBoardOriginX + boardSize.x + 40.0f, kBoardOriginY + 20.0f}, "NEXT PIECE", Palette::Cyan, 1.0f);
        renderer.DrawQuad({kBoardOriginX + boardSize.x + 30.0f, kBoardOriginY + 50.0f}, {120.0f, 100.0f}, glm::vec4{0.05f, 0.06f, 0.12f, 0.9f});
        if (!m_bag.empty())
        {
            const Tetromino nextT = m_bag.front();
            const auto nextOffsets = GetPieceOffsets(nextT, 0);
            for (const auto &off : nextOffsets)
            {
                const glm::vec2 pos{
                    kBoardOriginX + boardSize.x + 50.0f + off.x * 20.0f,
                    kBoardOriginY + 75.0f + off.y * 20.0f
                };
                renderer.DrawQuad(pos, {18.0f, 18.0f}, GetTetrominoColor(nextT));
            }
        }

        // Stats Box
        renderer.DrawText({kBoardOriginX + boardSize.x + 40.0f, kBoardOriginY + 180.0f}, "SCORE", Palette::Muted, 0.8f);
        renderer.DrawText({kBoardOriginX + boardSize.x + 40.0f, kBoardOriginY + 205.0f}, FormatNum(m_score), Palette::Text, 1.1f);
        renderer.DrawText({kBoardOriginX + boardSize.x + 40.0f, kBoardOriginY + 250.0f}, "LEVEL: " + std::to_string(m_level), Palette::Amber, 0.9f);
        renderer.DrawText({kBoardOriginX + boardSize.x + 40.0f, kBoardOriginY + 285.0f}, "LINES: " + std::to_string(m_lines), Palette::Lime, 0.9f);

        if (m_state == State::Ready)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.88f});
            renderer.DrawText({kScreenWidth * 0.5f - 170.0f, kScreenHeight * 0.5f - 20.0f}, "PRESS SPACE TO START TETRIS", Palette::Cyan, 1.0f);
        }
        else if (m_state == State::GameOver)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.88f});
            renderer.DrawText({kScreenWidth * 0.5f - 90.0f, kScreenHeight * 0.5f - 25.0f}, "GAME OVER", Palette::Red, 1.2f);
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f + 15.0f}, "PRESS SPACE TO RESTART", Palette::Text, 0.9f);
        }
    }
}
