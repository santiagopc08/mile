#ifndef PLATFORM_EXAMPLES_ARCADE_SUPPLEMENT_SHOOTER_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_SUPPLEMENT_SHOOTER_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <array>
#include <vector>

namespace platform::arcade
{
    class SupplementShooterScene final : public ArcadeScene
    {
    public:
        explicit SupplementShooterScene(ArcadeSession *session);

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

        struct BlockProjectile
        {
            glm::vec2 Position{0.0f, 0.0f};
            float Speed{680.0f};
            int TargetCol{0};
            bool Active{false};
        };

        static constexpr int kGridCols = 10;
        static constexpr int kGridRows = 18;
        static constexpr float kCellSize = 32.0f;
        static constexpr float kBoardOriginX = (kScreenWidth - (kGridCols * kCellSize)) * 0.5f;
        static constexpr float kBoardOriginY = 40.0f;
        static constexpr float kDangerLineY = kBoardOriginY + 16 * kCellSize;

        void ResetGame();
        void SpawnPattern();
        void ShootBlock();
        void UpdateGrid(float dt);
        void CheckCompletedRectangles();
        bool IsSolidRectangle(int r1, int c1, int r2, int c2) const;

        std::array<std::array<int, kGridCols>, kGridRows> m_grid{};
        std::vector<BlockProjectile> m_projectiles;

        State m_state{State::Ready};
        int m_playerCol{4};
        float m_playerVisualX{0.0f};
        float m_descendTimer{0.0f};
        float m_descendInterval{1.2f};
        float m_shootCooldown{0.0f};

        int m_score{0};
        int m_highScore{0};
        int m_stage{1};
        int m_blocksCleared{0};
        int m_combo{0};

        ParticleField m_particles;
        Random m_random{0x50991E77u};

        bool m_spaceLatch{false};
        bool m_escLatch{false};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_SUPPLEMENT_SHOOTER_SCENE_HPP
