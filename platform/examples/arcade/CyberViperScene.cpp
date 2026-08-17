#include "examples/arcade/CyberViperScene.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <cstdio>

namespace platform::arcade
{
    namespace
    {
        std::string FormatScore(int val)
        {
            char buf[32];
            std::snprintf(buf, sizeof(buf), "%06d", val);
            return std::string(buf);
        }
    }

    CyberViperScene::CyberViperScene(ArcadeSession *session)
        : ArcadeScene("Cyber Viper", session)
    {
        if (session)
        {
            m_highScore = session->CyberViperHighScore;
        }
    }

    void CyberViperScene::OnInitialize()
    {
        ResetGame();
    }

    void CyberViperScene::ResetGame()
    {
        m_state = State::Ready;
        m_dir = Direction::Right;
        m_nextDir = Direction::Right;
        m_score = 0;
        m_multiplier = 1;
        m_lengthTarget = 5;
        m_moveInterval = 0.09f;
        m_boostTimer = 0.0f;
        m_moveTimer = 0.0f;

        m_snake.clear();
        const int startX = kGridCols / 4;
        const int startY = kGridRows / 2;
        for (int i = 0; i < 4; ++i)
        {
            m_snake.push_front({startX + i, startY});
        }

        m_foods.clear();
        m_obstacles.clear();
        m_particles.Clear();

        SpawnFood();
        SpawnFood();
    }

    void CyberViperScene::SpawnFood()
    {
        if (m_foods.size() >= 3)
            return;

        for (int attempt = 0; attempt < 100; ++attempt)
        {
            const int rx = m_random.RangeInt(1, kGridCols - 2);
            const int ry = m_random.RangeInt(1, kGridRows - 2);
            const glm::ivec2 pos{rx, ry};

            bool collides = false;
            for (const auto &seg : m_snake)
            {
                if (seg == pos)
                {
                    collides = true;
                    break;
                }
            }
            for (const auto &f : m_foods)
            {
                if (f.Position == pos)
                {
                    collides = true;
                    break;
                }
            }
            if (collides)
                continue;

            FoodType type = FoodType::Standard;
            const float roll = m_random.NextFloat();
            if (roll > 0.85f)
                type = FoodType::Golden;
            else if (roll > 0.70f)
                type = FoodType::SpeedBoost;
            else if (roll > 0.55f)
                type = FoodType::Multiplier;

            m_foods.push_back({pos, type, 0.0f});
            break;
        }
    }

    void CyberViperScene::AddScore(int points)
    {
        m_score += points * m_multiplier;
        if (m_score > m_highScore)
        {
            m_highScore = m_score;
            if (m_session)
            {
                m_session->CyberViperHighScore = m_highScore;
            }
        }
    }

    void CyberViperScene::OnUpdate(double dt)
    {
        const auto step = static_cast<float>(dt);
        m_particles.Update(step);

        for (auto &f : m_foods)
        {
            f.Pulse += step * 4.0f;
        }

        auto *input = Device();
        if (input)
        {
            if (input->IsKeyHeld(Key::W) || input->IsKeyHeld(Key::Up))
            {
                if (m_dir != Direction::Down)
                    m_nextDir = Direction::Up;
            }
            else if (input->IsKeyHeld(Key::S) || input->IsKeyHeld(Key::Down))
            {
                if (m_dir != Direction::Up)
                    m_nextDir = Direction::Down;
            }
            else if (input->IsKeyHeld(Key::A) || input->IsKeyHeld(Key::Left))
            {
                if (m_dir != Direction::Right)
                    m_nextDir = Direction::Left;
            }
            else if (input->IsKeyHeld(Key::D) || input->IsKeyHeld(Key::Right))
            {
                if (m_dir != Direction::Left)
                    m_nextDir = Direction::Right;
            }

            const bool space = input->IsKeyHeld(Key::Space) || input->IsKeyHeld(Key::Enter);
            if (space && !m_spaceLatch)
            {
                if (m_state == State::Ready)
                    m_state = State::Playing;
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

        if (m_state == State::Playing)
        {
            if (m_boostTimer > 0.0f)
            {
                m_boostTimer -= step;
            }

            const float currentInterval = m_boostTimer > 0.0f ? m_moveInterval * 0.5f : m_moveInterval;
            m_moveTimer += step;

            if (m_moveTimer >= currentInterval)
            {
                m_moveTimer = 0.0f;
                m_dir = m_nextDir;
                UpdateSnake(step);
            }
        }
    }

    void CyberViperScene::UpdateSnake(float dt)
    {
        (void)dt;
        if (m_snake.empty())
            return;

        glm::ivec2 head = m_snake.front();
        switch (m_dir)
        {
        case Direction::Up:
            head.y -= 1;
            break;
        case Direction::Down:
            head.y += 1;
            break;
        case Direction::Left:
            head.x -= 1;
            break;
        case Direction::Right:
            head.x += 1;
            break;
        }

        // Wall collision or wraparound check
        if (head.x < 0 || head.x >= kGridCols || head.y < 0 || head.y >= kGridRows)
        {
            // Crash
            const glm::vec2 worldPos{
                kBoardOriginX + head.x * kCellSize + kCellSize * 0.5f,
                kBoardOriginY + head.y * kCellSize + kCellSize * 0.5f};
            m_particles.Burst(worldPos, Palette::Red, 40, 280.0f, 6.0f);
            m_state = State::GameOver;
            return;
        }

        // Self collision check
        for (const auto &seg : m_snake)
        {
            if (seg == head)
            {
                const glm::vec2 worldPos{
                    kBoardOriginX + head.x * kCellSize + kCellSize * 0.5f,
                    kBoardOriginY + head.y * kCellSize + kCellSize * 0.5f};
                m_particles.Burst(worldPos, Palette::Magenta, 50, 320.0f, 6.0f);
                m_state = State::GameOver;
                return;
            }
        }

        m_snake.push_front(head);

        // Check Food
        bool ate = false;
        for (auto it = m_foods.begin(); it != m_foods.end();)
        {
            if (it->Position == head)
            {
                ate = true;
                const glm::vec2 worldPos{
                    kBoardOriginX + head.x * kCellSize + kCellSize * 0.5f,
                    kBoardOriginY + head.y * kCellSize + kCellSize * 0.5f};

                switch (it->Type)
                {
                case FoodType::Standard:
                    AddScore(100);
                    m_lengthTarget += 2;
                    m_particles.Burst(worldPos, Palette::Cyan, 20, 180.0f, 4.0f);
                    break;
                case FoodType::Golden:
                    AddScore(300);
                    m_lengthTarget += 3;
                    m_particles.Burst(worldPos, Palette::Amber, 30, 240.0f, 5.0f);
                    break;
                case FoodType::SpeedBoost:
                    AddScore(150);
                    m_boostTimer = 4.0f;
                    m_particles.Burst(worldPos, Palette::Lime, 25, 220.0f, 5.0f);
                    break;
                case FoodType::Multiplier:
                    AddScore(200);
                    m_multiplier = std::min(5, m_multiplier + 1);
                    m_particles.Burst(worldPos, Palette::Violet, 25, 220.0f, 5.0f);
                    break;
                }

                it = m_foods.erase(it);
                SpawnFood();
            }
            else
            {
                ++it;
            }
        }

        if (!ate && static_cast<int>(m_snake.size()) > m_lengthTarget)
        {
            m_snake.pop_back();
        }

        // Particle trail on head movement
        const glm::vec2 headWorld{
            kBoardOriginX + head.x * kCellSize + kCellSize * 0.5f,
            kBoardOriginY + head.y * kCellSize + kCellSize * 0.5f};
        m_particles.Emit(headWorld, glm::vec2{0.0f, 0.0f}, m_boostTimer > 0.0f ? Palette::Lime : Palette::Cyan, 0.25f, 3.5f);
    }

    void CyberViperScene::OnRender(Renderer &renderer)
    {
        // 1. Grid Background
        for (int r = 0; r < kGridRows; ++r)
        {
            for (int c = 0; c < kGridCols; ++c)
            {
                const glm::vec2 cellPos{
                    kBoardOriginX + c * kCellSize,
                    kBoardOriginY + r * kCellSize};
                const glm::vec4 cellCol = ((c + r) % 2 == 0)
                    ? glm::vec4{0.05f, 0.06f, 0.10f, 0.6f}
                    : glm::vec4{0.04f, 0.05f, 0.08f, 0.4f};
                renderer.DrawQuad(cellPos, {kCellSize - 1.0f, kCellSize - 1.0f}, cellCol);
            }
        }

        // Grid Border
        const glm::vec2 boardPos{kBoardOriginX - 2.0f, kBoardOriginY - 2.0f};
        const glm::vec2 boardSize{kGridCols * kCellSize + 4.0f, kGridRows * kCellSize + 4.0f};
        renderer.DrawQuad({boardPos.x, boardPos.y}, {boardSize.x, 3.0f}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x, boardPos.y + boardSize.y}, {boardSize.x, 3.0f}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x, boardPos.y}, {3.0f, boardSize.y}, Palette::Cyan);
        renderer.DrawQuad({boardPos.x + boardSize.x, boardPos.y}, {3.0f, boardSize.y}, Palette::Cyan);

        // 2. Food items
        for (const auto &f : m_foods)
        {
            const glm::vec2 center{
                kBoardOriginX + f.Position.x * kCellSize + kCellSize * 0.5f,
                kBoardOriginY + f.Position.y * kCellSize + kCellSize * 0.5f};
            const float pulseScale = 1.0f + std::sin(f.Pulse) * 0.15f;
            const float fSize = (kCellSize * 0.65f) * pulseScale;

            glm::vec4 fCol = Palette::Cyan;
            if (f.Type == FoodType::Golden)
                fCol = Palette::Amber;
            else if (f.Type == FoodType::SpeedBoost)
                fCol = Palette::Lime;
            else if (f.Type == FoodType::Multiplier)
                fCol = Palette::Violet;

            renderer.DrawQuad({center.x - fSize * 0.5f, center.y - fSize * 0.5f}, {fSize, fSize}, fCol);
        }

        // 3. Snake Body Segments
        size_t segIdx = 0;
        for (const auto &seg : m_snake)
        {
            const glm::vec2 pos{
                kBoardOriginX + seg.x * kCellSize + 2.0f,
                kBoardOriginY + seg.y * kCellSize + 2.0f};
            const glm::vec2 sz{kCellSize - 4.0f, kCellSize - 4.0f};

            glm::vec4 col = Palette::Cyan;
            if (segIdx == 0)
            {
                // Head
                col = m_boostTimer > 0.0f ? Palette::Lime : Palette::Text;
            }
            else
            {
                const float t = static_cast<float>(segIdx) / static_cast<float>(m_snake.size());
                col = glm::mix(Palette::Cyan, Palette::Violet, t);
            }

            renderer.DrawQuad(pos, sz, col);
            segIdx++;
        }

        // 4. Particle System
        m_particles.Render(renderer);

        // 5. HUD
        renderer.DrawText({40.0f, 30.0f}, "CYBER VIPER 2088", Palette::Cyan, 1.2f);
        renderer.DrawText({400.0f, 30.0f}, "SCORE: " + FormatScore(m_score), Palette::Text, 1.0f);
        renderer.DrawText({700.0f, 30.0f}, "HIGH: " + FormatScore(m_highScore), Palette::Amber, 1.0f);
        if (m_multiplier > 1)
        {
            renderer.DrawText({950.0f, 30.0f}, "x" + std::to_string(m_multiplier) + " MULTIPLIER", Palette::Violet, 1.0f);
        }

        if (m_state == State::Ready)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.85f});
            renderer.DrawText({kScreenWidth * 0.5f - 180.0f, kScreenHeight * 0.5f - 20.0f}, "PRESS SPACE TO DEPLOY VIPER", Palette::Cyan, 1.0f);
        }
        else if (m_state == State::GameOver)
        {
            renderer.DrawQuad({kScreenWidth * 0.5f - 220.0f, kScreenHeight * 0.5f - 50.0f}, {440.0f, 100.0f}, glm::vec4{0.0f, 0.0f, 0.0f, 0.85f});
            renderer.DrawText({kScreenWidth * 0.5f - 110.0f, kScreenHeight * 0.5f - 25.0f}, "SYSTEM CRASHED", Palette::Red, 1.2f);
            renderer.DrawText({kScreenWidth * 0.5f - 160.0f, kScreenHeight * 0.5f + 15.0f}, "PRESS SPACE TO REBOOT", Palette::Text, 0.9f);
        }
    }
}
