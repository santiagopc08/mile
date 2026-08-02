#ifndef PLATFORM_EXAMPLES_ARCADE_BRICK_STORM_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_BRICK_STORM_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <vector>

namespace platform::arcade
{
    /// Block breaker built on the ECS: paddle, balls, bricks and drops are all
    /// entities carrying Transform + Shape, so the engine's RenderSystem draws them.
    class BrickStormScene final : public ArcadeScene
    {
    public:
        explicit BrickStormScene(ArcadeSession *session);

        enum class DropKind
        {
            WidePaddle = 0,
            MultiBall,
            SlowBall,
            ExtraLife,
        };

        [[nodiscard]] int GetScore() const { return m_score; }
        [[nodiscard]] int GetLives() const { return m_lives; }
        [[nodiscard]] int GetLevel() const { return m_level; }
        [[nodiscard]] size_t GetBrickCount() const { return m_bricks.size(); }
        [[nodiscard]] size_t GetBallCount() const { return m_balls.size(); }
        [[nodiscard]] bool IsGameOver() const { return m_gameOver; }

        void StartRun();
        void BuildLevel(int level);

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        struct Ball
        {
            EntityID Entity{kNullEntity};
            glm::vec2 Position{0.0f, 0.0f};
            glm::vec2 Velocity{0.0f, 0.0f};
            float Radius{9.0f};
        };

        struct Brick
        {
            EntityID Entity{kNullEntity};
            glm::vec2 Position{0.0f, 0.0f};
            glm::vec2 HalfSize{0.0f, 0.0f};
            int Hits{1};
            bool Golden{false};
        };

        struct Drop
        {
            EntityID Entity{kNullEntity};
            glm::vec2 Position{0.0f, 0.0f};
            DropKind Kind{DropKind::WidePaddle};
        };

        EntityID SpawnQuad(const glm::vec2 &position, const glm::vec2 &size, const glm::vec4 &color, int layer);
        void ClearBoard();
        void SpawnBall(const glm::vec2 &position, const glm::vec2 &velocity);
        void SpawnDrop(const glm::vec2 &position);
        void ApplyDrop(DropKind kind);
        void LoseLife();
        void BreakBrick(size_t index);

        void UpdatePaddle(float dt);
        void UpdateBalls(float dt);
        void UpdateDrops(float dt);
        void SyncTransforms();

        [[nodiscard]] glm::vec4 BrickColor(const Brick &brick) const;

        static constexpr float kPlayfieldTop = 92.0f;
        static constexpr float kPaddleY = 660.0f;
        static constexpr float kBasePaddleWidth = 132.0f;
        static constexpr float kBaseBallSpeed = 430.0f;

        EntityID m_paddle{kNullEntity};
        std::vector<Ball> m_balls;
        std::vector<Brick> m_bricks;
        std::vector<Drop> m_drops;

        float m_paddleX{kScreenWidth * 0.5f};
        float m_paddleWidth{kBasePaddleWidth};
        float m_wideTimer{0.0f};
        float m_slowTimer{0.0f};

        int m_score{0};
        int m_lives{3};
        int m_level{1};
        int m_combo{0};
        float m_comboTimer{0.0f};
        float m_flash{0.0f};
        float m_levelBanner{0.0f};

        bool m_ballHeld{true};
        bool m_gameOver{false};
        bool m_restartLatch{true};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_BRICK_STORM_SCENE_HPP
