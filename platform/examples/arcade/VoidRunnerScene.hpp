#ifndef PLATFORM_EXAMPLES_ARCADE_VOID_RUNNER_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_VOID_RUNNER_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <vector>

namespace platform::arcade
{
    /// Vector-shooter in the Asteroids tradition: everything wraps at the screen
    /// edges and rocks split into smaller rocks when shot.
    class VoidRunnerScene final : public ArcadeScene
    {
    public:
        explicit VoidRunnerScene(ArcadeSession *session);

        struct Rock
        {
            glm::vec2 Position{0.0f, 0.0f};
            glm::vec2 Velocity{0.0f, 0.0f};
            float Radius{48.0f};
            float Rotation{0.0f};
            float Spin{0.0f};
            int Tier{3}; // 3 = large, 2 = medium, 1 = small
            std::vector<glm::vec2> Silhouette;
        };

        struct Bullet
        {
            glm::vec2 Position{0.0f, 0.0f};
            glm::vec2 Velocity{0.0f, 0.0f};
            float Life{0.0f};
        };

        [[nodiscard]] int GetScore() const { return m_score; }
        [[nodiscard]] int GetLives() const { return m_lives; }
        [[nodiscard]] int GetWave() const { return m_wave; }
        [[nodiscard]] size_t GetRockCount() const { return m_rocks.size(); }
        [[nodiscard]] size_t GetBulletCount() const { return m_bullets.size(); }
        [[nodiscard]] bool IsGameOver() const { return m_gameOver; }
        [[nodiscard]] const glm::vec2 &GetShipPosition() const { return m_shipPosition; }

        void StartRun();
        void SpawnWave(int wave);
        void Fire();

    protected:
        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        Rock MakeRock(const glm::vec2 &position, const glm::vec2 &velocity, int tier);
        void SplitRock(size_t index);
        void KillShip();
        static glm::vec2 Wrap(glm::vec2 position);

        std::vector<Rock> m_rocks;
        std::vector<Bullet> m_bullets;

        glm::vec2 m_shipPosition{kScreenWidth * 0.5f, kScreenHeight * 0.5f};
        glm::vec2 m_shipVelocity{0.0f, 0.0f};
        float m_shipRotation{-1.5707963f}; // pointing up
        float m_fireCooldown{0.0f};
        float m_invulnerable{0.0f};
        float m_thrustPulse{0.0f};
        float m_waveBanner{0.0f};

        int m_score{0};
        int m_lives{3};
        int m_wave{1};

        bool m_gameOver{false};
        bool m_restartLatch{true};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_VOID_RUNNER_SCENE_HPP
