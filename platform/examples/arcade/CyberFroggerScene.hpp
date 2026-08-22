#ifndef PLATFORM_EXAMPLES_ARCADE_CYBER_FROGGER_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_CYBER_FROGGER_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <array>
#include <vector>

namespace platform::arcade
{
    class CyberFroggerScene final : public ArcadeScene
    {
    public:
        explicit CyberFroggerScene(ArcadeSession *session);

        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        enum class State
        {
            Ready,
            Playing,
            StageClear,
            GameOver,
        };

        enum class ObstacleType
        {
            Car,
            Truck,
            Racer,
            LogSmall,
            LogMedium,
            LogLarge,
            Turtles,
        };

        struct Obstacle
        {
            glm::vec2 Position{0.0f, 0.0f};
            glm::vec2 Size{40.0f, 32.0f};
            float Speed{100.0f};
            ObstacleType Type{ObstacleType::Car};
            glm::vec4 Color{Palette::Amber};
            int Row{0};
            bool IsWaterRide{false};
        };

        static constexpr int kGridCols = 15;
        static constexpr int kGridRows = 13;
        static constexpr float kCellSize = 44.0f;
        static constexpr float kBoardOriginX = (kScreenWidth - (kGridCols * kCellSize)) * 0.5f;
        static constexpr float kBoardOriginY = 50.0f;

        void ResetGame();
        void SetupStage(int stage);
        void MovePlayer(int dx, int dy);
        void KillPlayer(const std::string &reason);
        void CheckCollisions(float dt);

        State m_state{State::Ready};
        int m_playerCol{7};
        int m_playerRow{12}; // Bottom row = 12
        float m_playerVisualX{0.0f};
        float m_playerVisualY{0.0f};
        float m_hopTimer{0.0f};

        std::array<bool, 5> m_homeFilled{false, false, false, false, false};
        int m_flyBayIndex{-1};
        float m_flyTimer{0.0f};

        int m_stage{1};
        int m_score{0};
        int m_highScore{0};
        int m_lives{3};
        float m_timeRemaining{45.0f};

        std::vector<Obstacle> m_obstacles;
        ParticleField m_particles;
        Random m_random{0xF2066E2u};

        bool m_upLatch{false};
        bool m_downLatch{false};
        bool m_leftLatch{false};
        bool m_rightLatch{false};
        bool m_spaceLatch{false};
        bool m_escLatch{false};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_CYBER_FROGGER_SCENE_HPP
