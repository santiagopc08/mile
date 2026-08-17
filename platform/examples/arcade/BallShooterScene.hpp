#ifndef PLATFORM_EXAMPLES_ARCADE_BALL_SHOOTER_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_BALL_SHOOTER_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <vector>

namespace platform::arcade
{
    class BallShooterScene final : public ArcadeScene
    {
    public:
        explicit BallShooterScene(ArcadeSession *session);

        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        enum class State
        {
            Aiming,
            Shooting,
            GameOver,
        };

        enum class ItemType
        {
            Brick,
            AddBall,
            LaserRow,
            LaserCol,
            Bomb,
        };

        struct Item
        {
            glm::ivec2 GridPos{0, 0};
            ItemType Type{ItemType::Brick};
            int Hp{1};
            int MaxHp{1};
            float Pulse{0.0f};
        };

        struct Ball
        {
            glm::vec2 Position{0.0f, 0.0f};
            glm::vec2 Velocity{0.0f, 0.0f};
            bool Active{false};
            bool Returning{false};
        };

        static constexpr int kCols = 7;
        static constexpr int kRows = 9;
        static constexpr float kCellSize = 64.0f;
        static constexpr float kBoardOriginX = (kScreenWidth - (kCols * kCellSize)) * 0.5f;
        static constexpr float kBoardOriginY = 60.0f;
        static constexpr float kFloorY = kBoardOriginY + kRows * kCellSize;

        void ResetGame();
        void SpawnRow();
        void ShootVolley(const glm::vec2 &targetDir);
        void UpdatePhysics(float dt);
        void CheckCollisions();
        void FinishTurn();

        std::vector<Item> m_items;
        std::vector<Ball> m_balls;

        State m_state{State::Aiming};
        glm::vec2 m_cannonPos{kScreenWidth * 0.5f, kFloorY};
        glm::vec2 m_newCannonPos{kScreenWidth * 0.5f, kFloorY};
        glm::vec2 m_aimDir{0.0f, -1.0f};

        int m_ballCount{10};
        int m_ballsToSpawn{0};
        float m_spawnTimer{0.0f};
        float m_aimAngle{-1.5707963f}; // -90 deg (straight up)

        int m_score{0};
        int m_highScore{0};
        int m_wave{1};
        int m_extraBallsThisTurn{0};

        ParticleField m_particles;
        Random m_random{0x8A115400u};

        bool m_spaceLatch{false};
        bool m_escLatch{false};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_BALL_SHOOTER_SCENE_HPP
