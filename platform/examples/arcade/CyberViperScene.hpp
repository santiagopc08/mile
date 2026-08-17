#ifndef PLATFORM_EXAMPLES_ARCADE_CYBER_VIPER_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_CYBER_VIPER_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <deque>
#include <vector>

namespace platform::arcade
{
    class CyberViperScene final : public ArcadeScene
    {
    public:
        explicit CyberViperScene(ArcadeSession *session);

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

        enum class Direction
        {
            Up,
            Down,
            Left,
            Right,
        };

        enum class FoodType
        {
            Standard,
            Golden,
            SpeedBoost,
            Multiplier,
        };

        struct Food
        {
            glm::ivec2 Position{0, 0};
            FoodType Type{FoodType::Standard};
            float Pulse{0.0f};
        };

        struct GridObstacle
        {
            glm::ivec2 Position{0, 0};
            bool Active{true};
        };

        static constexpr int kGridCols = 40;
        static constexpr int kGridRows = 24;
        static constexpr float kCellSize = 26.0f;
        static constexpr float kBoardOriginX = (kScreenWidth - (kGridCols * kCellSize)) * 0.5f;
        static constexpr float kBoardOriginY = 80.0f;

        void ResetGame();
        void SpawnFood();
        void UpdateSnake(float dt);
        void CheckCollisions();
        void AddScore(int points);

        State m_state{State::Ready};
        Direction m_dir{Direction::Right};
        Direction m_nextDir{Direction::Right};

        std::deque<glm::ivec2> m_snake;
        std::vector<Food> m_foods;
        std::vector<GridObstacle> m_obstacles;

        float m_moveTimer{0.0f};
        float m_moveInterval{0.085f};
        float m_boostTimer{0.0f};

        int m_score{0};
        int m_highScore{0};
        int m_multiplier{1};
        int m_lengthTarget{4};

        ParticleField m_particles;
        Random m_random{0xCAFEBABE};

        bool m_spaceLatch{false};
        bool m_escLatch{false};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_CYBER_VIPER_SCENE_HPP
