#ifndef PLATFORM_EXAMPLES_ARCADE_TANK_DEFENSE_SCENE_HPP
#define PLATFORM_EXAMPLES_ARCADE_TANK_DEFENSE_SCENE_HPP

#include "examples/arcade/ArcadeCommon.hpp"

#include <array>
#include <vector>

namespace platform::arcade
{
    class TankDefenseScene final : public ArcadeScene
    {
    public:
        explicit TankDefenseScene(ArcadeSession *session);

        void OnInitialize() override;
        void OnUpdate(double dt) override;
        void OnRender(Renderer &renderer) override;

    private:
        enum class State
        {
            Briefing,
            Playing,
            Victory,
            GameOver,
        };

        enum class TileType : uint8_t
        {
            Empty = 0,
            Brick,
            Steel,
            Water,
            Forest,
            BaseCore,
            BaseDestroyed,
        };

        enum class Direction : uint8_t
        {
            Up = 0,
            Right,
            Down,
            Left,
        };

        enum class EnemyType : uint8_t
        {
            Scout = 0,
            Assault,
            Heavy,
            Elite,
        };

        enum class PowerUpType : uint8_t
        {
            None = 0,
            Star,
            Shield,
            Bomb,
            Freeze,
            Fortress,
        };

        struct Bullet
        {
            glm::vec2 Position{0.0f, 0.0f};
            Direction Dir{Direction::Up};
            float Speed{400.0f};
            bool FromPlayer{false};
            bool Active{false};
        };

        struct Tank
        {
            glm::vec2 Position{0.0f, 0.0f};
            Direction Dir{Direction::Up};
            float Speed{140.0f};
            int Hp{1};
            int MaxHp{1};
            float ShootCooldown{0.0f};
            float MoveTimer{0.0f};
            bool Active{false};
            EnemyType Type{EnemyType::Scout};
            bool HasPowerUp{false};
            float ShieldTimer{0.0f};
        };

        struct PowerUp
        {
            glm::vec2 Position{0.0f, 0.0f};
            PowerUpType Type{PowerUpType::Star};
            float LifeTimer{15.0f};
            bool Active{false};
        };

        static constexpr int kMapCols = 19;
        static constexpr int kMapRows = 19;
        static constexpr float kTileSize = 34.0f;
        static constexpr float kBoardOriginX = (kScreenWidth - (kMapCols * kTileSize)) * 0.5f;
        static constexpr float kBoardOriginY = 40.0f;

        void ResetGame();
        void LoadMap(int stage);
        void SpawnEnemy();
        void UpdatePlayer(float dt);
        void UpdateEnemies(float dt);
        void UpdateBullets(float dt);
        void UpdatePowerUps(float dt);
        bool CheckTileCollision(const glm::vec2 &pos, const glm::vec2 &size, bool ignoreForest = true) const;
        void DamageTileAt(int col, int row, bool heavy);
        void FireBullet(const glm::vec2 &pos, Direction dir, bool fromPlayer, float speed = 420.0f);
        void ApplyPowerUp(PowerUpType type);

        std::array<std::array<TileType, kMapCols>, kMapRows> m_map{};
        Tank m_player{};
        std::vector<Tank> m_enemies;
        std::vector<Bullet> m_bullets;
        std::vector<PowerUp> m_powerUps;

        State m_state{State::Briefing};
        int m_stage{1};
        int m_score{0};
        int m_highScore{0};
        int m_lives{3};
        int m_enemiesRemaining{16};
        int m_enemiesSpawned{0};
        int m_playerWeaponLevel{1};

        float m_enemySpawnTimer{0.0f};
        float m_freezeTimer{0.0f};
        float m_fortressTimer{0.0f};
        float m_briefingTimer{2.0f};

        ParticleField m_particles;
        Random m_random{0x7A4C1990u};

        bool m_spaceLatch{false};
        bool m_escLatch{false};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_TANK_DEFENSE_SCENE_HPP
