#ifndef PLATFORM_EXAMPLES_ARCADE_TETRIS_MATRIX_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_TETRIS_MATRIX_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <array>
#include <deque>
#include <vector>

namespace platform::arcade
{
    class TetrisMatrixScene final : public ArcadeScene
    {
    public:
        explicit TetrisMatrixScene(ArcadeSession *session);

        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        enum class State
        {
            Ready,
            Playing,
            GameOver,
        };

        enum class Tetromino
        {
            None = 0,
            I,
            J,
            L,
            O,
            S,
            T,
            Z,
        };

        struct Piece
        {
            Tetromino Type{Tetromino::None};
            int Rotation{0}; // 0 = 0, 1 = 90, 2 = 180, 3 = 270
            glm::ivec2 Position{0, 0};
        };

        static constexpr int kCols = 10;
        static constexpr int kRows = 20;
        static constexpr float kCellSize = 28.0f;
        static constexpr float kBoardOriginX = (kScreenWidth - (kCols * kCellSize)) * 0.5f;
        static constexpr float kBoardOriginY = 60.0f;

        void ResetGame();
        void SpawnNextPiece();
        bool IsValidPosition(const Piece &piece) const;
        void LockPiece();
        void CheckLineClears();
        void RotatePiece(int dir);
        void MovePiece(int dx);
        void HardDrop();
        void HoldPiece();
        int CalculateGhostY() const;
        void FillBag();

        std::array<std::array<Tetromino, kCols>, kRows> m_grid{};
        Piece m_current{};
        Tetromino m_hold{Tetromino::None};
        bool m_canHold{true};

        std::deque<Tetromino> m_bag;

        State m_state{State::Ready};
        float m_fallTimer{0.0f};
        float m_fallInterval{0.8f};
        float m_lockTimer{0.0f};
        bool m_isLocking{false};

        int m_score{0};
        int m_highScore{0};
        int m_lines{0};
        int m_level{1};
        int m_combo{0};

        ParticleField m_particles;
        Random m_random{0x5EED7E77u};

        bool m_spaceLatch{false};
        bool m_upLatch{false};
        bool m_holdLatch{false};
        bool m_escLatch{false};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_TETRIS_MATRIX_SCENE_HPP
