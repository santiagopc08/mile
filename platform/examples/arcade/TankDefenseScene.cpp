#include "examples/arcade/TankDefenseScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace platform::arcade
{
    namespace
    {
        glm::vec2 DirToVec(TankDefenseScene::Direction dir)
        {
            switch (dir)
            {
            case TankDefenseScene::Direction::Up: return {0.0f, -1.0f};
            case TankDefenseScene::Direction::Right: return {1.0f, 0.0f};
            case TankDefenseScene::Direction::Down: return {0.0f, 1.0f};
            case TankDefenseScene::Direction::Left: return {-1.0f, 0.0f};
            }
            return {0.0f, -1.0f};
        }

        std::string FormatNum(int val)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "%06d", val);
            return std::string(buf);
        }
    }

    TankDefenseScene::TankDefenseScene(ArcadeSession *session)
        : ArcadeScene("Tanks Base Defense", session)
    {
    }

    void TankDefenseScene::OnInitialize()
    {
        ResetGame();
    }

    void TankDefenseScene::ResetGame()
    {
        m_state = State::Briefing;
        m_stage = 1;
        m_score = 0;
        m_lives = 3;
        m_playerWeaponLevel = 1;
        m_briefingTimer = 1.5f;

        LoadMap(m_stage);
    }

    void TankDefenseScene::LoadMap(int stage)
    {
        m_state = State::Briefing;
        m_briefingTimer = 1.5f;
        m_enemiesRemaining = 12 + stage * 2;
        m_enemiesSpawned = 0;
        m_enemySpawnTimer = 1.0f;
        m_freezeTimer = 0.0f;
        m_fortressTimer = 0.0f;

        m_enemies.clear();
        m_bullets.clear();
        m_powerUps.clear();
        m_particles.Clear();

        // Clear Map
        for (auto &row : m_map)
        {
            row.fill(TileType::Empty);
        }

        // Map Border Steel
        for (int c = 0; c < kMapCols; ++c)
        {
            m_map[0][c] = TileType::Steel;
            m_map[kMapRows - 1][c] = TileType::Steel;
        }
        for (int r = 0; r < kMapRows; ++r)
        {
            m_map[r][0] = TileType::Steel;
            m_map[r][kMapCols - 1] = TileType::Steel;
        }

        // Headquarters Base Core at (9, 17)
        m_map[17][9] = TileType::BaseCore;
        // Brick Protection around Base Core
        m_map[17][8] = TileType::Brick;
        m_map[17][10] = TileType::Brick;
        m_map[16][8] = TileType::Brick;
        m_map[16][9] = TileType::Brick;
        m_map[16][10] = TileType::Brick;

        // Procedural Maze Walls
        for (int r = 2; r < kMapRows - 3; r += 2)
        {
            for (int c = 2; c < kMapCols - 2; c += 2)
            {
                const float roll = m_random.NextFloat();
                if (roll > 0.40f)
                {
                    m_map[r][c] = TileType::Brick;
                    m_map[r + 1][c] = TileType::Brick;
                }
                else if (roll > 0.25f)
                {
                    m_map[r][c] = TileType::Steel;
                }
                else if (roll > 0.15f)
                {
                    m_map[r][c] = TileType::Water;
                    m_map[r][c + 1] = TileType::Water;
                }
                else if (roll > 0.05f)
                {
                    m_map[r][c] = TileType::Forest;
                }
            }
        }

        // Spawn Player Tank next to Base
        m_player = {
            glm::vec2{kBoardOriginX + 6 * kTileSize, kBoardOriginY + 17 * kTileSize},
            Direction::Up,
            160.0f,
            1,
            1,
            0.0f,
            0.0f,
            true,
            EnemyType::Scout,
            false,
            3.0f // 3s spawn shield
        };
    }

    void TankDefenseScene::SpawnEnemy()
    {
        if (m_enemiesSpawned >= m_enemiesRemaining + (int)m_enemies.size()) return;
        if (m_enemies.size() >= 4) return;

        // 3 Spawn Points along Top (col 2, col 9, col 16)
        const int spawnCols[3] = {2, 9, 16};
        const int c = spawnCols[m_random.RangeInt(0, 2)];
        const glm::vec2 spawnPos{kBoardOriginX + c * kTileSize, kBoardOriginY + 1 * kTileSize};

        // Check if spawn is obstructed
        for (const auto &e : m_enemies)
        {
            if (e.Active && glm::distance(e.Position, spawnPos) < kTileSize)
                return;
        }

        const float roll = m_random.NextFloat();
        EnemyType type = EnemyType::Scout;
        int hp = 1;
        float spd = 140.0f;
        bool hasPower = (m_random.NextFloat() < 0.25f);

        if (roll > 0.70f)
        {
            type = EnemyType::Heavy;
            hp = 3;
            spd = 90.0f;
        }
        else if (roll > 0.40f)
        {
            type = EnemyType::Assault;
            hp = 2;
            spd = 120.0f;
        }

        m_enemies.push_back({
            spawnPos,
            Direction::Down,
            spd,
            hp,
            hp,
            m_random.Range(0.5f, 1.5f),
            0.0f,
            true,
            type,
            hasPower,
            0.0f
        });

        m_enemiesSpawned++;
    }

    bool TankDefenseScene::CheckTileCollision(const glm::vec2 &pos, const glm::vec2 &size, bool ignoreForest) const
    {
        const int minC = std::max(0, static_cast<int>((pos.x - kBoardOriginX) / kTileSize));
        const int maxC = std::min(kMapCols - 1, static_cast<int>((pos.x + size.x - 1.0f - kBoardOriginX) / kTileSize));
        const int minR = std::max(0, static_cast<int>((pos.y - kBoardOriginY) / kTileSize));
        const int maxR = std::min(kMapRows - 1, static_cast<int>((pos.y + size.y - 1.0f - kBoardOriginY) / kTileSize));

        for (int r = minR; r <= maxR; ++r)
        {
            for (int c = minC; c <= maxC; ++c)
            {
                const TileType t = m_map[r][c];
                if (t == TileType::Brick || t == TileType::Steel || t == TileType::BaseCore || t == TileType::BaseDestroyed)
                    return true;
                if (!ignoreForest && t == TileType::Water)
                    return true;
            }
        }
        return false;
    }

    void TankDefenseScene::DamageTileAt(int col, int row, bool heavy)
    {
        if (col < 0 || col >= kMapCols || row < 0 || row >= kMapRows) return;
        const TileType t = m_map[row][col];
        if (t == TileType::Brick)
        {
            m_map[row][col] = TileType::Empty;
            const glm::vec2 p{kBoardOriginX + (col + 0.5f) * kTileSize, kBoardOriginY + (row + 0.5f) * kTileSize};
            m_particles.Burst(p, Palette::Amber, 10, 120.0f, 3.0f);
        }
        else if (t == TileType::Steel && heavy)
        {
            m_map[row][col] = TileType::Empty;
            const glm::vec2 p{kBoardOriginX + (col + 0.5f) * kTileSize, kBoardOriginY + (row + 0.5f) * kTileSize};
            m_particles.Burst(p, Palette::Cyan, 16, 160.0f, 4.0f);
        }
        else if (t == TileType::BaseCore)
        {
            m_map[row][col] = TileType::BaseDestroyed;
            const glm::vec2 p{kBoardOriginX + (col + 0.5f) * kTileSize, kBoardOriginY + (row + 0.5f) * kTileSize};
            m_particles.Burst(p, Palette::Red, 40, 240.0f, 6.0f);
            m_state = State::GameOver;
        }
    }

    void TankDefenseScene::FireBullet(const glm::vec2 &pos, Direction dir, bool fromPlayer, float speed)
    {
        m_bullets.push_back({pos, dir, speed, fromPlayer, true});
    }

    void TankDefenseScene::ApplyPowerUp(PowerUpType type)
    {
        switch (type)
        {
        case PowerUpType::Star:
            m_playerWeaponLevel = std::min(4, m_playerWeaponLevel + 1);
            m_score += 500;
            break;
        case PowerUpType::Shield:
            m_player.ShieldTimer = 10.0f;
            m_score += 500;
            break;
        case PowerUpType::Bomb:
            for (auto &e : m_enemies)
            {
                if (e.Active)
                {
                    e.Active = false;
                    m_particles.Burst(e.Position + glm::vec2{kTileSize * 0.5f}, Palette::Red, 25, 200.0f, 5.0f);
                    m_score += 200;
                }
            }
            break;
        case PowerUpType::Freeze:
            m_freezeTimer = 8.0f;
            m_score += 500;
            break;
        case PowerUpType::Fortress:
            m_fortressTimer = 15.0f;
            // Upgrade base walls to steel
            m_map[17][8] = TileType::Steel;
            m_map[17][10] = TileType::Steel;
            m_map[16][8] = TileType::Steel;
            m_map[16][9] = TileType::Steel;
            m_map[16][10] = TileType::Steel;
            break;
        default:
            break;
        }
    }

    void TankDefenseScene::UpdatePlayer(float dt)
    {
        if (!m_player.Active) return;

        if (m_player.ShieldTimer > 0.0f)
        {
            m_player.ShieldTimer -= dt;
        }

        m_player.ShootCooldown = std::max(0.0f, m_player.ShootCooldown - dt);

        auto *input = Device();
        if (!input) return;

        glm::vec2 moveVec{0.0f, 0.0f};
        if (input->IsKeyHeld(Key::Up) || input->IsKeyHeld(Key::W))
        {
            m_player.Dir = Direction::Up;
            moveVec.y -= 1.0f;
        }
        else if (input->IsKeyHeld(Key::Down) || input->IsKeyHeld(Key::S))
        {
            m_player.Dir = Direction::Down;
            moveVec.y += 1.0f;
        }
        else if (input->IsKeyHeld(Key::Left) || input->IsKeyHeld(Key::A))
        {
            m_player.Dir = Direction::Left;
            moveVec.x -= 1.0f;
        }
        else if (input->IsKeyHeld(Key::Right) || input->IsKeyHeld(Key::D))
        {
            m_player.Dir = Direction::Right;
            moveVec.x += 1.0f;
        }

        if (glm::length(moveVec) > 0.01f)
        {
            const glm::vec2 newPos = m_player.Position + glm::normalize(moveVec) * (m_player.Speed * dt);
            const glm::vec2 tankSize{kTileSize - 4.0f, kTileSize - 4.0f};

            if (!CheckTileCollision(newPos + glm::vec2{2.0f, 2.0f}, tankSize, false))
            {
                m_player.Position = newPos;
            }
        }

        const bool space = input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::J);
        if (space && m_player.ShootCooldown <= 0.0f)
        {
            const glm::vec2 center = m_player.Position + glm::vec2{kTileSize * 0.5f, kTileSize * 0.5f};
            const glm::vec2 dir = DirToVec(m_player.Dir);
            const float bulletSpd = 400.0f + m_playerWeaponLevel * 60.0f;

            FireBullet(center + dir * (kTileSize * 0.5f), m_player.Dir, true, bulletSpd);
            m_player.ShootCooldown = (m_playerWeaponLevel >= 3) ? 0.18f : 0.32f;
        }
    }

    void TankDefenseScene::UpdateEnemies(float dt)
    {
        if (m_freezeTimer > 0.0f)
        {
            m_freezeTimer -= dt;
            return;
        }

        m_enemySpawnTimer -= dt;
        if (m_enemySpawnTimer <= 0.0f)
        {
            SpawnEnemy();
            m_enemySpawnTimer = m_random.Range(2.0f, 4.0f);
        }

        for (auto &e : m_enemies)
        {
            if (!e.Active) continue;

            e.ShootCooldown -= dt;
            e.MoveTimer -= dt;

            // AI Decision: change direction or target base/player
            if (e.MoveTimer <= 0.0f)
            {
                e.MoveTimer = m_random.Range(1.0f, 2.5f);
                const float roll = m_random.NextFloat();
                if (roll < 0.4f)
                {
                    e.Dir = Direction::Down; // Target base
                }
                else
                {
                    const Direction dirs[4] = {Direction::Up, Direction::Right, Direction::Down, Direction::Left};
                    e.Dir = dirs[m_random.RangeInt(0, 3)];
                }
            }

            // Move in current direction
            const glm::vec2 dirVec = DirToVec(e.Dir);
            const glm::vec2 newPos = e.Position + dirVec * (e.Speed * dt);
            const glm::vec2 tankSize{kTileSize - 4.0f, kTileSize - 4.0f};

            if (!CheckTileCollision(newPos + glm::vec2{2.0f, 2.0f}, tankSize, false))
            {
                e.Position = newPos;
            }
            else
            {
                e.MoveTimer = 0.0f; // Force direction pick on hit
            }

            // Enemy Shooting
            if (e.ShootCooldown <= 0.0f)
            {
                e.ShootCooldown = m_random.Range(1.2f, 2.8f);
                const glm::vec2 center = e.Position + glm::vec2{kTileSize * 0.5f, kTileSize * 0.5f};
                FireBullet(center + dirVec * (kTileSize * 0.5f), e.Dir, false, 320.0f);
            }
        }
    }

    void TankDefenseScene::UpdateBullets(float dt)
    {
        for (size_t i = 0; i < m_bullets.size(); ++i)
        {
            auto &b = m_bullets[i];
            if (!b.Active) continue;

            const glm::vec2 dir = DirToVec(b.Dir);
            b.Position += dir * (b.Speed * dt);

            // Bounds check
            if (b.Position.x < kBoardOriginX || b.Position.x > kBoardOriginX + kMapCols * kTileSize ||
                b.Position.y < kBoardOriginY || b.Position.y > kBoardOriginY + kMapRows * kTileSize)
            {
                b.Active = false;
                continue;
            }

            // Tile collision
            const int c = static_cast<int>((b.Position.x - kBoardOriginX) / kTileSize);
            const int r = static_cast<int>((b.Position.y - kBoardOriginY) / kTileSize);

            if (c >= 0 && c < kMapCols && r >= 0 && r < kMapRows)
            {
                const TileType t = m_map[r][c];
                if (t == TileType::Brick || t == TileType::Steel || t == TileType::BaseCore)
                {
                    DamageTileAt(c, r, b.FromPlayer && m_playerWeaponLevel >= 4);
                    b.Active = false;
                    continue;
                }
            }

            // Player collision
            if (!b.FromPlayer && m_player.Active && m_player.ShieldTimer <= 0.0f)
            {
                if (glm::distance(b.Position, m_player.Position + glm::vec2{kTileSize * 0.5f}) < kTileSize * 0.45f)
                {
                    b.Active = false;
                    m_player.Hp--;
                    if (m_player.Hp <= 0)
                    {
                        m_particles.Burst(m_player.Position + glm::vec2{kTileSize * 0.5f}, Palette::Red, 30, 200.0f, 5.0f);
                        m_lives--;
                        if (m_lives > 0)
                        {
                            m_player.Position = {kBoardOriginX + 6 * kTileSize, kBoardOriginY + 17 * kTileSize};
                            m_player.Hp = 1;
                            m_player.ShieldTimer = 3.0f;
                            m_playerWeaponLevel = std::max(1, m_playerWeaponLevel - 1);
                        }
                        else
                        {
                            m_player.Active = false;
                            m_state = State::GameOver;
                        }
                    }
                    continue;
                }
            }

            // Enemy collision
            if (b.FromPlayer)
            {
                for (auto &e : m_enemies)
                {
                    if (!e.Active) continue;
                    if (glm::distance(b.Position, e.Position + glm::vec2{kTileSize * 0.5f}) < kTileSize * 0.45f)
                    {
                        b.Active = false;
                        e.Hp--;
                        m_particles.Burst(b.Position, Palette::Amber, 8, 100.0f, 2.5f);

                        if (e.Hp <= 0)
                        {
                            e.Active = false;
                            m_particles.Burst(e.Position + glm::vec2{kTileSize * 0.5f}, Palette::Red, 25, 180.0f, 4.0f);
                            m_score += (e.Type == EnemyType::Heavy ? 300 : e.Type == EnemyType::Assault ? 200 : 100);

                            if (e.HasPowerUp)
                            {
                                const PowerUpType pTypes[5] = {PowerUpType::Star, PowerUpType::Shield, PowerUpType::Bomb, PowerUpType::Freeze, PowerUpType::Fortress};
                                m_powerUps.push_back({e.Position, pTypes[m_random.RangeInt(0, 4)], 15.0f, true});
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    void TankDefenseScene::UpdatePowerUps(float dt)
    {
        for (auto &p : m_powerUps)
        {
            if (!p.Active) continue;
            p.LifeTimer -= dt;
            if (p.LifeTimer <= 0.0f)
            {
                p.Active = false;
                continue;
            }

            if (m_player.Active && glm::distance(m_player.Position + glm::vec2{kTileSize * 0.5f}, p.Position + glm::vec2{kTileSize * 0.5f}) < kTileSize * 0.6f)
            {
                ApplyPowerUp(p.Type);
                p.Active = false;
            }
        }
    }

    void TankDefenseScene::OnUpdate(double dt)
    {
        const auto step = static_cast<float>(dt);
        m_particles.Update(step);

        auto *input = Device();
        if (input)
        {
            const bool space = input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::Enter);
            if (space && !m_spaceLatch)
            {
                if (m_state == State::GameOver)
                    ResetGame();
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

        if (m_state == State::Briefing)
        {
            m_briefingTimer -= step;
            if (m_briefingTimer <= 0.0f)
            {
                m_state = State::Playing;
            }
            return;
        }

        if (m_state == State::Playing)
        {
            UpdatePlayer(step);
            UpdateEnemies(step);
            UpdateBullets(step);
            UpdatePowerUps(step);

            // Clean inactive
            m_bullets.erase(std::remove_if(m_bullets.begin(), m_bullets.end(), [](const Bullet &b) { return !b.Active; }), m_bullets.end());
            m_enemies.erase(std::remove_if(m_enemies.begin(), m_enemies.end(), [](const Tank &e) { return !e.Active; }), m_enemies.end());
            m_powerUps.erase(std::remove_if(m_powerUps.begin(), m_powerUps.end(), [](const PowerUp &p) { return !p.Active; }), m_powerUps.end());

            // Fortress Rebuild Timer expiration
            if (m_fortressTimer > 0.0f)
            {
                m_fortressTimer -= step;
                if (m_fortressTimer <= 0.0f)
                {
                    m_map[17][8] = TileType::Brick;
                    m_map[17][10] = TileType::Brick;
                    m_map[16][8] = TileType::Brick;
                    m_map[16][9] = TileType::Brick;
                    m_map[16][10] = TileType::Brick;
                }
            }

            // Check stage clear
            if (m_enemiesSpawned >= m_enemiesRemaining && m_enemies.empty())
            {
                m_stage++;
                m_score += 2000;
                LoadMap(m_stage);
            }
        }
    }

    void TankDefenseScene::OnRender(Renderer &renderer)
    {
        // 1. Battlefield Ground
        renderer.DrawQuad({kBoardOriginX, kBoardOriginY}, {kMapCols * kTileSize, kMapRows * kTileSize}, glm::vec4{0.03f, 0.04f, 0.08f, 0.95f});

        // 2. Map Tiles
        for (int r = 0; r < kMapRows; ++r)
        {
            for (int c = 0; c < kMapCols; ++c)
            {
                const glm::vec2 pos{kBoardOriginX + c * kTileSize, kBoardOriginY + r * kTileSize};
                const glm::vec2 sz{kTileSize, kTileSize};
                const TileType t = m_map[r][c];

                if (t == TileType::Brick)
                {
                    renderer.DrawQuad(pos + glm::vec2{1.0f}, sz - glm::vec2{2.0f}, glm::vec4{0.8f, 0.35f, 0.15f, 1.0f});
                    renderer.DrawQuad(pos + glm::vec2{3.0f}, sz - glm::vec2{6.0f}, glm::vec4{0.65f, 0.25f, 0.1f, 1.0f});
                }
                else if (t == TileType::Steel)
                {
                    renderer.DrawQuad(pos + glm::vec2{1.0f}, sz - glm::vec2{2.0f}, glm::vec4{0.6f, 0.75f, 0.85f, 1.0f});
                    renderer.DrawQuad(pos + glm::vec2{4.0f}, sz - glm::vec2{8.0f}, glm::vec4{0.8f, 0.9f, 1.0f, 1.0f});
                }
                else if (t == TileType::Water)
                {
                    renderer.DrawQuad(pos, sz, glm::vec4{0.1f, 0.4f, 0.8f, 0.75f});
                }
                else if (t == TileType::BaseCore)
                {
                    renderer.DrawQuad(pos + glm::vec2{2.0f}, sz - glm::vec2{4.0f}, Palette::Amber);
                    renderer.DrawText({pos.x + 8.0f, pos.y + 10.0f}, "HQ", Palette::Background, 0.8f);
                }
                else if (t == TileType::BaseDestroyed)
                {
                    renderer.DrawQuad(pos + glm::vec2{2.0f}, sz - glm::vec2{4.0f}, Palette::Dim);
                    renderer.DrawText({pos.x + 8.0f, pos.y + 10.0f}, "XX", Palette::Red, 0.8f);
                }
            }
        }

        // 3. Power-Ups
        for (const auto &p : m_powerUps)
        {
            if (p.Active)
            {
                renderer.DrawQuad(p.Position + glm::vec2{4.0f}, {kTileSize - 8.0f, kTileSize - 8.0f}, Palette::Amber);
                renderer.DrawText({p.Position.x + 8.0f, p.Position.y + 8.0f}, "★", Palette::Background, 1.0f);
            }
        }

        // 4. Enemy Tanks
        for (const auto &e : m_enemies)
        {
            if (!e.Active) continue;
            const glm::vec4 col = e.HasPowerUp ? Palette::Amber : (e.Type == EnemyType::Heavy ? Palette::Red : (e.Type == EnemyType::Assault ? Palette::Magenta : Palette::Cyan));
            renderer.DrawQuad(e.Position + glm::vec2{2.0f}, {kTileSize - 4.0f, kTileSize - 4.0f}, col);

            // Turret Barrel
            const glm::vec2 center = e.Position + glm::vec2{kTileSize * 0.5f};
            const glm::vec2 barrel = center + DirToVec(e.Dir) * (kTileSize * 0.45f);
            renderer.DrawQuad(barrel - glm::vec2{2.0f}, {4.0f, 4.0f}, Palette::Text);
        }

        // 5. Player Tank
        if (m_player.Active)
        {
            renderer.DrawQuad(m_player.Position + glm::vec2{2.0f}, {kTileSize - 4.0f, kTileSize - 4.0f}, Palette::Lime);
            const glm::vec2 center = m_player.Position + glm::vec2{kTileSize * 0.5f};
            const glm::vec2 barrel = center + DirToVec(m_player.Dir) * (kTileSize * 0.45f);
            renderer.DrawQuad(barrel - glm::vec2{2.5f}, {5.0f, 5.0f}, Palette::Amber);

            // Shield Aura
            if (m_player.ShieldTimer > 0.0f)
            {
                renderer.DrawQuad(m_player.Position, {kTileSize, 2.0f}, Palette::Cyan);
                renderer.DrawQuad(m_player.Position + glm::vec2{0.0f, kTileSize - 2.0f}, {kTileSize, 2.0f}, Palette::Cyan);
            }
        }

        // 6. Bullets
        for (const auto &b : m_bullets)
        {
            if (b.Active)
            {
                renderer.DrawQuad(b.Position - glm::vec2{2.5f}, {5.0f, 5.0f}, b.FromPlayer ? Palette::Amber : Palette::Red);
            }
        }

        // 7. Forest Overgrowth (Rendered on top for stealth)
        for (int r = 0; r < kMapRows; ++r)
        {
            for (int c = 0; c < kMapCols; ++c)
            {
                if (m_map[r][c] == TileType::Forest)
                {
                    const glm::vec2 pos{kBoardOriginX + c * kTileSize, kBoardOriginY + r * kTileSize};
                    renderer.DrawQuad(pos, {kTileSize, kTileSize}, glm::vec4{0.1f, 0.65f, 0.2f, 0.75f});
                }
            }
        }

        // 8. Particles
        m_particles.Render(renderer);

        // 9. HUD Stats
        renderer.DrawText({40.0f, 15.0f}, "TANKS DEFENSE", Palette::Cyan, 1.1f);
        renderer.DrawText({340.0f, 15.0f}, "SCORE: " + FormatNum(m_score), Palette::Text, 0.95f);
        renderer.DrawText({640.0f, 15.0f}, "STAGE: " + std::to_string(m_stage), Palette::Amber, 0.95f);
        renderer.DrawText({840.0f, 15.0f}, "LIVES: " + std::to_string(m_lives), Palette::Lime, 0.95f);

        if (m_state == State::Briefing)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 180.0f, kScreenHeight * 0.5f - 40.0f}, {360.0f, 80.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.9f});
            renderer.DrawText({kScreenWidth * 0.5f - 100.0f, kScreenHeight * 0.5f - 10.0f}, "STAGE " + std::to_string(m_stage) + " START", Palette::Amber, 1.2f);
        }
        else if (m_state == State::GameOver)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.92f});
            renderer.DrawText({kScreenWidth * 0.5f - 110.0f, kScreenHeight * 0.5f - 25.0f}, "GAME OVER", Palette::Red, 1.2f);
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f + 15.0f}, "PRESS SPACE TO RESTART", Palette::Text, 0.9f);
        }
    }
}
