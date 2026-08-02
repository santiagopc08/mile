#include "examples/arcade/ArcadeCommon.hpp"

#include "engine/graphics/RenderCommand.hpp"

#include <algorithm>
#include <cmath>
#include <memory>

namespace platform::arcade
{
    uint32_t Random::NextUInt()
    {
        // xorshift32: tiny, fast and fully deterministic from the seed.
        m_state ^= m_state << 13;
        m_state ^= m_state >> 17;
        m_state ^= m_state << 5;
        return m_state;
    }

    float Random::NextFloat()
    {
        return static_cast<float>(NextUInt() & 0xFFFFFFu) / static_cast<float>(0x1000000u);
    }

    float Random::Range(float min, float max)
    {
        return min + NextFloat() * (max - min);
    }

    int Random::RangeInt(int minInclusive, int maxInclusive)
    {
        if (maxInclusive <= minInclusive)
        {
            return minInclusive;
        }
        const auto span = static_cast<uint32_t>(maxInclusive - minInclusive + 1);
        return minInclusive + static_cast<int>(NextUInt() % span);
    }

    float ParticleField::NextFloat()
    {
        m_seed ^= m_seed << 13;
        m_seed ^= m_seed >> 17;
        m_seed ^= m_seed << 5;
        return static_cast<float>(m_seed & 0xFFFFFFu) / static_cast<float>(0x1000000u);
    }

    void ParticleField::Burst(const glm::vec2 &origin, const glm::vec4 &color, int count, float speed, float size)
    {
        for (int i = 0; i < count; ++i)
        {
            if (m_particles.size() >= kMaxParticles)
            {
                return;
            }

            const float angle = NextFloat() * 6.28318530718f;
            const float magnitude = speed * (0.35f + NextFloat() * 0.65f);

            Particle particle;
            particle.Position = origin;
            particle.Velocity = {std::cos(angle) * magnitude, std::sin(angle) * magnitude};
            particle.Color = color;
            particle.MaxLife = 0.35f + NextFloat() * 0.45f;
            particle.Life = particle.MaxLife;
            particle.Size = size * (0.6f + NextFloat() * 0.8f);
            m_particles.push_back(particle);
        }
    }

    void ParticleField::Emit(const glm::vec2 &origin, const glm::vec2 &velocity, const glm::vec4 &color, float life,
                             float size)
    {
        if (m_particles.size() >= kMaxParticles)
        {
            return;
        }

        Particle particle;
        particle.Position = origin;
        particle.Velocity = velocity;
        particle.Color = color;
        particle.MaxLife = life;
        particle.Life = life;
        particle.Size = size;
        m_particles.push_back(particle);
    }

    void ParticleField::Update(float dt)
    {
        for (auto &particle : m_particles)
        {
            particle.Life -= dt;
            particle.Position += particle.Velocity * dt;
            particle.Velocity -= particle.Velocity * std::min(1.0f, particle.Drag * dt);
        }

        m_particles.erase(
            std::remove_if(m_particles.begin(), m_particles.end(),
                           [](const Particle &particle) { return particle.Life <= 0.0f; }),
            m_particles.end());
    }

    void ParticleField::Render(Renderer &renderer) const
    {
        for (const auto &particle : m_particles)
        {
            const float fade = std::clamp(particle.Life / particle.MaxLife, 0.0f, 1.0f);
            glm::vec4 color = particle.Color;
            color.a *= fade;

            const float size = particle.Size * (0.4f + fade * 0.6f);
            renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
                particle.Position, glm::vec2{size, size}, 0.0f, color));
        }
    }

    float TextWidth(const std::string &text, float scale)
    {
        return static_cast<float>(text.size()) * DrawTextCommand::GlyphWidth(scale);
    }

    void DrawText(Renderer &renderer, const glm::vec2 &position, const std::string &text, const glm::vec4 &color,
                  float scale)
    {
        renderer.SubmitCommand(std::make_unique<DrawTextCommand>(position, text, color, scale));
    }

    void DrawTextCentered(Renderer &renderer, float centerX, float y, const std::string &text, const glm::vec4 &color,
                          float scale)
    {
        DrawText(renderer, {centerX - TextWidth(text, scale) * 0.5f, y}, text, color, scale);
    }

    void DrawPanel(Renderer &renderer, const glm::vec2 &topLeft, const glm::vec2 &size, const glm::vec4 &fill)
    {
        renderer.SubmitCommand(std::make_unique<DrawRectangleCommand>(
            topLeft + size * 0.5f, size, 0.0f, fill));
    }

    std::vector<glm::vec2> TransformPoints(const std::vector<glm::vec2> &points, const glm::vec2 &origin,
                                           float rotationRadians, float scale)
    {
        const float cosR = std::cos(rotationRadians);
        const float sinR = std::sin(rotationRadians);

        std::vector<glm::vec2> transformed;
        transformed.reserve(points.size());
        for (const auto &point : points)
        {
            const glm::vec2 scaled = point * scale;
            transformed.push_back({
                origin.x + scaled.x * cosR - scaled.y * sinR,
                origin.y + scaled.x * sinR + scaled.y * cosR,
            });
        }
        return transformed;
    }

    ArcadeScene::ArcadeScene(std::string_view name, ArcadeSession *session)
        : Scene(name), m_session(session)
    {
        // Screen-space camera: world coordinates map 1:1 to pixels.
        m_camera.SetZoom(1.0f);
        m_camera.SetPosition({kScreenWidth * 0.5f, kScreenHeight * 0.5f});
    }

    void ArcadeScene::PollActions()
    {
        if (auto *input = Device())
        {
            m_actions.Update(input->CreateSnapshot());
        }
    }

    void ArcadeScene::UpdateShake(float dt)
    {
        if (m_shake <= 0.0f)
        {
            m_shakeOffset = {0.0f, 0.0f};
            return;
        }

        m_shake = std::max(0.0f, m_shake - dt * 46.0f);
        m_shakeOffset = {
            m_random.Range(-m_shake, m_shake),
            m_random.Range(-m_shake, m_shake),
        };
    }
}
