#include "examples/arcade/TurboRaceScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace platform::arcade
{
    namespace
    {
        std::string FormatNum(int val)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "%06d", val);
            return std::string(buf);
        }
    }

    TurboRaceScene::TurboRaceScene(ArcadeSession *session)
        : ArcadeScene("Turbo Highway Race", session)
    {
    }

    void TurboRaceScene::OnInitialize()
    {
        ResetGame();
    }

    void TurboRaceScene::ResetGame()
    {
        m_state = State::Ready;
        m_playerPos = {kScreenWidth * 0.5f, kScreenHeight - 140.0f};
        m_playerVel = {0.0f, 0.0f};
        m_speed = 140.0f;
        m_distance = 0.0f;
        m_fuel = 100.0f;
        m_nitroTimer = 0.0f;
        m_shieldTimer = 0.0f;
        m_score = 0;
        m_overtakes = 0;

        m_traffic.clear();
        m_pickups.clear();
        m_particles.Clear();

        m_trafficSpawnTimer = 1.0f;
        m_pickupSpawnTimer = 3.0f;
    }

    void TurboRaceScene::SpawnTraffic()
    {
        const float laneWidth = kRoadWidth / static_cast<float>(kLaneCount);
        const int lane = m_random.RangeInt(0, kLaneCount - 1);
        const float laneCenterX = kRoadLeft + lane * laneWidth + laneWidth * 0.5f;

        // Check if spawn lane is obstructed
        for (const auto &c : m_traffic)
        {
            if (c.Active && std::abs(c.Position.x - laneCenterX) < 25.0f && c.Position.y < 120.0f)
                return;
        }

        const float roll = m_random.NextFloat();
        VehicleType type = VehicleType::Sedan;
        glm::vec2 size{36.0f, 70.0f};
        float spd = m_speed * 0.45f;
        glm::vec4 col = Palette::Amber;

        if (roll > 0.70f)
        {
            type = VehicleType::Truck;
            size = {42.0f, 130.0f};
            spd = m_speed * 0.35f;
            col = glm::vec4{0.3f, 0.6f, 0.9f, 1.0f};
        }
        else if (roll > 0.45f)
        {
            type = VehicleType::Supercar;
            size = {34.0f, 68.0f};
            spd = m_speed * 0.65f;
            col = Palette::Magenta;
        }

        m_traffic.push_back({
            glm::vec2{laneCenterX, -100.0f},
            size,
            spd,
            type,
            col,
            true,
            false
        });
    }

    void TurboRaceScene::SpawnPickup()
    {
        const float laneWidth = kRoadWidth / static_cast<float>(kLaneCount);
        const int lane = m_random.RangeInt(0, kLaneCount - 1);
        const float laneCenterX = kRoadLeft + lane * laneWidth + laneWidth * 0.5f;

        const float roll = m_random.NextFloat();
        PickupType type = PickupType::Coin;
        if (roll > 0.75f) type = PickupType::Nitro;
        else if (roll > 0.50f) type = PickupType::Fuel;
        else if (roll > 0.35f) type = PickupType::Shield;

        m_pickups.push_back({
            glm::vec2{laneCenterX, -60.0f},
            type,
            true
        });
    }

    void TurboRaceScene::UpdatePhysics(float dt)
    {
        // Speed scaling linearly with distance
        if (m_nitroTimer > 0.0f)
        {
            m_nitroTimer -= dt;
            m_speed = std::min(m_maxSpeed, m_speed + 160.0f * dt);
        }
        else
        {
            const float targetSpeed = 140.0f + std::min(240.0f, m_distance * 0.05f);
            m_speed = std::min(targetSpeed, m_speed + 15.0f * dt);
        }

        m_distance += (m_speed * 0.15f) * dt;
        m_score += static_cast<int>(m_speed * 0.3f * dt);

        // Road scroll offset
        m_roadScrollOffset = std::fmod(m_roadScrollOffset + m_speed * 2.2f * dt, 80.0f);

        // Player lateral movement
        m_playerPos.x += m_playerVel.x * dt;
        m_playerPos.x = std::max(kRoadLeft + 25.0f, std::min(kRoadRight - 25.0f, m_playerPos.x));
        m_playerVel.x *= std::exp(-7.0f * dt); // Friction damping

        // Exhaust / Nitro Particles
        if (m_nitroTimer > 0.0f)
        {
            m_particles.Burst(m_playerPos + glm::vec2{-10.0f, 35.0f}, Palette::Cyan, 2, 80.0f, 3.0f);
            m_particles.Burst(m_playerPos + glm::vec2{10.0f, 35.0f}, Palette::Cyan, 2, 80.0f, 3.0f);
        }
        else
        {
            m_particles.Burst(m_playerPos + glm::vec2{0.0f, 35.0f}, Palette::Amber, 1, 40.0f, 2.0f);
        }

        // Spawn Timers
        m_trafficSpawnTimer -= dt;
        if (m_trafficSpawnTimer <= 0.0f)
        {
            SpawnTraffic();
            m_trafficSpawnTimer = std::max(0.6f, 2.0f - (m_speed / m_maxSpeed) * 1.2f);
        }

        m_pickupSpawnTimer -= dt;
        if (m_pickupSpawnTimer <= 0.0f)
        {
            SpawnPickup();
            m_pickupSpawnTimer = m_random.Range(3.5f, 6.0f);
        }

        // Update Traffic
        for (auto &c : m_traffic)
        {
            if (!c.Active) continue;
            // Relative speed difference
            const float relSpeed = (m_speed - c.Speed) * 2.2f;
            c.Position.y += relSpeed * dt;

            // Near-miss graze detection
            if (!c.Grazed && std::abs(c.Position.y - m_playerPos.y) < 40.0f)
            {
                const float dx = std::abs(c.Position.x - m_playerPos.x);
                if (dx < 50.0f && dx > 32.0f)
                {
                    c.Grazed = true;
                    m_score += 250;
                    m_overtakes++;
                    m_particles.Burst(m_playerPos, Palette::Cyan, 12, 120.0f, 3.5f);
                }
            }

            if (c.Position.y > kScreenHeight + 150.0f || c.Position.y < -300.0f)
            {
                c.Active = false;
            }
        }

        // Update Pickups
        for (auto &p : m_pickups)
        {
            if (!p.Active) continue;
            p.Position.y += m_speed * 2.2f * dt;
            if (p.Position.y > kScreenHeight + 80.0f)
            {
                p.Active = false;
            }
        }
    }

    void TurboRaceScene::CheckCollisions()
    {
        const glm::vec2 playerSize{36.0f, 72.0f};

        // 1. Pickups
        for (auto &p : m_pickups)
        {
            if (!p.Active) continue;
            if (glm::distance(p.Position, m_playerPos) < 40.0f)
            {
                p.Active = false;
                if (p.Type == PickupType::Coin)
                {
                    m_score += 500;
                    m_particles.Burst(p.Position, Palette::Amber, 16, 140.0f, 3.0f);
                }
                else if (p.Type == PickupType::Nitro)
                {
                    m_nitroTimer = 5.0f;
                    m_score += 300;
                    m_particles.Burst(p.Position, Palette::Cyan, 25, 200.0f, 4.0f);
                }
                else if (p.Type == PickupType::Fuel)
                {
                    m_fuel = std::min(100.0f, m_fuel + 35.0f);
                    m_particles.Burst(p.Position, Palette::Lime, 18, 150.0f, 3.0f);
                }
                else if (p.Type == PickupType::Shield)
                {
                    m_shieldTimer = 8.0f;
                    m_particles.Burst(p.Position, Palette::Violet, 20, 160.0f, 3.5f);
                }
            }
        }

        // 2. Traffic Crash
        for (auto &c : m_traffic)
        {
            if (!c.Active) continue;

            const float dx = std::abs(c.Position.x - m_playerPos.x);
            const float dy = std::abs(c.Position.y - m_playerPos.y);

            if (dx < (c.Size.x + playerSize.x) * 0.42f && dy < (c.Size.y + playerSize.y) * 0.42f)
            {
                if (m_shieldTimer > 0.0f || m_nitroTimer > 0.0f)
                {
                    // Destroy traffic car
                    c.Active = false;
                    m_score += 400;
                    m_particles.Burst(c.Position, Palette::Red, 30, 240.0f, 5.0f);
                    if (m_shieldTimer > 0.0f) m_shieldTimer = 0.0f; // Consume shield
                }
                else
                {
                    // Player Crashed
                    m_particles.Burst(m_playerPos, Palette::Red, 50, 300.0f, 6.0f);
                    m_state = State::GameOver;
                    if (m_score > m_highScore)
                    {
                        m_highScore = m_score;
                    }
                }
                break;
            }
        }
    }

    void TurboRaceScene::OnUpdate(double dt)
    {
        const auto step = static_cast<float>(dt);
        m_particles.Update(step);

        auto *input = Device();
        if (input)
        {
            if (m_state == State::Racing)
            {
                const float steerPower = 580.0f;
                if (input->IsKeyHeld(Key::Left) || input->IsKeyHeld(Key::A))
                {
                    m_playerVel.x = -steerPower;
                }
                else if (input->IsKeyHeld(Key::Right) || input->IsKeyHeld(Key::D))
                {
                    m_playerVel.x = steerPower;
                }

                if (input->IsKeyHeld(Key::Up) || input->IsKeyHeld(Key::W))
                {
                    m_speed = std::min(m_maxSpeed, m_speed + 60.0f * step);
                }
                else if (input->IsKeyHeld(Key::Down) || input->IsKeyHeld(Key::S))
                {
                    m_speed = std::max(80.0f, m_speed - 120.0f * step);
                }
            }

            const bool space = input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::Enter);
            if (space && !m_spaceLatch)
            {
                if (m_state == State::Ready)
                    m_state = State::Racing;
                else if (m_state == State::GameOver)
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

        if (m_state == State::Racing)
        {
            UpdatePhysics(step);
            CheckCollisions();

            // Clean inactive
            m_traffic.erase(std::remove_if(m_traffic.begin(), m_traffic.end(), [](const TrafficCar &c) { return !c.Active; }), m_traffic.end());
            m_pickups.erase(std::remove_if(m_pickups.begin(), m_pickups.end(), [](const Pickup &p) { return !p.Active; }), m_pickups.end());
        }
    }

    void TurboRaceScene::OnRender(Renderer &renderer)
    {
        // 1. Road Asphalt
        renderer.DrawQuad({kRoadLeft, 0.0f}, {kRoadWidth, kScreenHeight}, glm::vec4{0.06f, 0.08f, 0.12f, 1.0f});

        // 2. Curbs / Rumble Strips
        for (float y = -80.0f + m_roadScrollOffset; y < kScreenHeight + 80.0f; y += 40.0f)
        {
            const bool alt = (static_cast<int>(std::floor((y - m_roadScrollOffset) / 40.0f)) % 2 == 0);
            const glm::vec4 curbCol = alt ? Palette::Red : Palette::Text;

            renderer.DrawQuad({kRoadLeft - 14.0f, y}, {12.0f, 38.0f}, curbCol);
            renderer.DrawQuad({kRoadRight + 2.0f, y}, {12.0f, 38.0f}, curbCol);
        }

        // 3. Dashed Lane Markings
        const float laneWidth = kRoadWidth / static_cast<float>(kLaneCount);
        for (int l = 1; l < kLaneCount; ++l)
        {
            const float lx = kRoadLeft + l * laneWidth;
            for (float y = -80.0f + m_roadScrollOffset; y < kScreenHeight + 80.0f; y += 50.0f)
            {
                renderer.DrawQuad({lx - 2.0f, y}, {4.0f, 26.0f}, glm::vec4{1.0f, 1.0f, 1.0f, 0.35f});
            }
        }

        // 4. Pickups
        for (const auto &p : m_pickups)
        {
            if (!p.Active) continue;
            const glm::vec4 pCol = (p.Type == PickupType::Coin ? Palette::Amber : p.Type == PickupType::Nitro ? Palette::Cyan : p.Type == PickupType::Fuel ? Palette::Lime : Palette::Violet);
            renderer.DrawQuad(p.Position - glm::vec2{14.0f, 14.0f}, {28.0f, 28.0f}, pCol);
            renderer.DrawText(p.Position - glm::vec2{8.0f, 6.0f}, (p.Type == PickupType::Coin ? "$" : p.Type == PickupType::Nitro ? "N" : p.Type == PickupType::Fuel ? "F" : "S"), Palette::Background, 0.9f);
        }

        // 5. Traffic Vehicles
        for (const auto &c : m_traffic)
        {
            if (!c.Active) continue;
            renderer.DrawQuad(c.Position - c.Size * 0.5f, c.Size, c.Color);
            // Tail Lights
            renderer.DrawQuad({c.Position.x - c.Size.x * 0.4f, c.Position.y + c.Size.y * 0.45f}, {6.0f, 4.0f}, Palette::Red);
            renderer.DrawQuad({c.Position.x + c.Size.x * 0.4f - 6.0f, c.Position.y + c.Size.y * 0.45f}, {6.0f, 4.0f}, Palette::Red);
        }

        // 6. Player Race Car
        if (m_state != State::GameOver)
        {
            const glm::vec2 pSize{36.0f, 72.0f};
            renderer.DrawQuad(m_playerPos - pSize * 0.5f, pSize, Palette::Cyan);
            // Windshield
            renderer.DrawQuad({m_playerPos.x - 12.0f, m_playerPos.y - 18.0f}, {24.0f, 16.0f}, glm::vec4{0.05f, 0.1f, 0.2f, 1.0f});
            // Headlights Beam
            renderer.DrawQuad({m_playerPos.x - 14.0f, m_playerPos.y - 36.0f}, {6.0f, 4.0f}, Palette::Amber);
            renderer.DrawQuad({m_playerPos.x + 8.0f, m_playerPos.y - 36.0f}, {6.0f, 4.0f}, Palette::Amber);

            // Shield / Nitro Aura
            if (m_shieldTimer > 0.0f)
            {
                renderer.DrawQuad(m_playerPos - glm::vec2{24.0f, 42.0f}, {48.0f, 84.0f}, glm::vec4{0.6f, 0.2f, 0.9f, 0.4f});
            }
        }

        // 7. Particles
        m_particles.Render(renderer);

        // 8. HUD Dashboard
        renderer.DrawText({40.0f, 20.0f}, "TURBO HIGHWAY", Palette::Cyan, 1.2f);
        renderer.DrawText({340.0f, 20.0f}, "SCORE: " + FormatNum(m_score), Palette::Text, 1.0f);
        renderer.DrawText({640.0f, 20.0f}, "SPEED: " + std::to_string(static_cast<int>(m_speed)) + " KM/H", Palette::Amber, 1.0f);
        renderer.DrawText({920.0f, 20.0f}, "DIST: " + std::to_string(static_cast<int>(m_distance)) + " M", Palette::Lime, 1.0f);

        if (m_state == State::Ready)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.88f});
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f - 20.0f}, "PRESS SPACE TO START RACE", Palette::Cyan, 1.0f);
        }
        else if (m_state == State::GameOver)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.92f});
            renderer.DrawText({kScreenWidth * 0.5f - 100.0f, kScreenHeight * 0.5f - 25.0f}, "CRASHED!", Palette::Red, 1.2f);
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f + 15.0f}, "PRESS SPACE TO RESTART", Palette::Text, 0.9f);
        }
    }
}
