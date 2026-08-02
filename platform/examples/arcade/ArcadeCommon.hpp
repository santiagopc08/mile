#ifndef PLATFORM_EXAMPLES_ARCADE_ARCADE_COMMON_HPP
#define PLATFORM_EXAMPLES_ARCADE_ARCADE_COMMON_HPP

#include "engine/graphics/Camera2D.hpp"
#include "engine/graphics/Renderer.hpp"
#include "engine/input/Input.hpp"
#include "engine/input/actions/ActionContext.hpp"
#include "engine/scene/Scene.hpp"

#include <glm/glm.hpp>
#include <string>
#include <vector>

namespace platform::arcade
{
    inline constexpr float kScreenWidth = 1280.0f;
    inline constexpr float kScreenHeight = 720.0f;

    namespace Palette
    {
        inline constexpr glm::vec4 Background{0.035f, 0.04f, 0.07f, 1.0f};
        inline constexpr glm::vec4 Text{0.90f, 0.94f, 0.98f, 1.0f};
        inline constexpr glm::vec4 Muted{0.48f, 0.56f, 0.68f, 1.0f};
        inline constexpr glm::vec4 Dim{0.28f, 0.34f, 0.44f, 1.0f};
        inline constexpr glm::vec4 Cyan{0.24f, 0.82f, 0.96f, 1.0f};
        inline constexpr glm::vec4 Magenta{0.96f, 0.32f, 0.62f, 1.0f};
        inline constexpr glm::vec4 Amber{0.99f, 0.75f, 0.24f, 1.0f};
        inline constexpr glm::vec4 Lime{0.52f, 0.92f, 0.44f, 1.0f};
        inline constexpr glm::vec4 Violet{0.62f, 0.48f, 0.98f, 1.0f};
        inline constexpr glm::vec4 Red{0.96f, 0.34f, 0.34f, 1.0f};
    }

    /// Which screen the arcade shell should show next. Scenes only *request* a
    /// change; the application performs it once the scene's update has returned,
    /// because switching destroys the scene that asked for it.
    enum class ArcadeScreen
    {
        None = 0,
        Menu,
        BrickStorm,
        VoidRunner,
        Quit,
    };

    /// State that outlives an individual game screen.
    struct ArcadeSession
    {
        Input *Device{nullptr};
        ArcadeScreen Requested{ArcadeScreen::None};

        int BrickStormHighScore{0};
        int VoidRunnerHighScore{0};

        void Request(ArcadeScreen screen) { Requested = screen; }
    };

    /// Short-lived coloured square used for hit sparks and explosions.
    struct Particle
    {
        glm::vec2 Position{0.0f, 0.0f};
        glm::vec2 Velocity{0.0f, 0.0f};
        glm::vec4 Color{1.0f, 1.0f, 1.0f, 1.0f};
        float Life{0.0f};
        float MaxLife{1.0f};
        float Size{4.0f};
        float Drag{1.4f};
    };

    class ParticleField
    {
    public:
        void Burst(const glm::vec2 &origin, const glm::vec4 &color, int count, float speed, float size = 4.0f);
        void Emit(const glm::vec2 &origin, const glm::vec2 &velocity, const glm::vec4 &color, float life, float size);
        void Update(float dt);
        void Render(Renderer &renderer) const;
        void Clear() { m_particles.clear(); }

        [[nodiscard]] size_t Count() const { return m_particles.size(); }

    private:
        static constexpr size_t kMaxParticles = 900;
        std::vector<Particle> m_particles;
        uint32_t m_seed{0x9E3779B9u};

        float NextFloat();
    };

    /// Deterministic small PRNG so gameplay stays reproducible in tests.
    class Random
    {
    public:
        explicit Random(uint32_t seed = 0x1234567u) : m_state(seed ? seed : 1u) {}

        uint32_t NextUInt();
        float NextFloat();                       // [0, 1)
        float Range(float min, float max);
        int RangeInt(int minInclusive, int maxInclusive);

    private:
        uint32_t m_state{1u};
    };

    // --- Text helpers ----------------------------------------------------
    float TextWidth(const std::string &text, float scale);
    void DrawText(Renderer &renderer, const glm::vec2 &position, const std::string &text, const glm::vec4 &color,
                  float scale = 2.0f);
    void DrawTextCentered(Renderer &renderer, float centerX, float y, const std::string &text, const glm::vec4 &color,
                          float scale = 2.0f);
    void DrawPanel(Renderer &renderer, const glm::vec2 &topLeft, const glm::vec2 &size, const glm::vec4 &fill);

    /// Rotates `points` around the origin and offsets them, ready for a polygon command.
    std::vector<glm::vec2> TransformPoints(const std::vector<glm::vec2> &points, const glm::vec2 &origin,
                                           float rotationRadians, float scale = 1.0f);

    /// Base class shared by every arcade screen: fixed screen-space camera, input
    /// bindings and a shake offset for impact feedback.
    class ArcadeScene : public Scene
    {
    public:
        ArcadeScene(std::string_view name, ArcadeSession *session);

        [[nodiscard]] Camera2D *GetActiveCamera() override { return &m_camera; }

    protected:
        void AddShake(float amount) { m_shake = std::min(18.0f, m_shake + amount); }
        void UpdateShake(float dt);
        [[nodiscard]] glm::vec2 ShakeOffset() const { return m_shakeOffset; }

        [[nodiscard]] Input *Device() const { return m_session ? m_session->Device : nullptr; }
        [[nodiscard]] ArcadeSession *Session() const { return m_session; }

        void PollActions();
        [[nodiscard]] const ActionContext &Actions() const { return m_actions; }

        ArcadeSession *m_session{nullptr};
        ActionContext m_actions;
        ParticleField m_particles;
        Random m_random{0xA53F91u};

    private:
        Camera2D m_camera{kScreenWidth, kScreenHeight};
        float m_shake{0.0f};
        glm::vec2 m_shakeOffset{0.0f, 0.0f};
    };
}

#endif // PLATFORM_EXAMPLES_ARCADE_ARCADE_COMMON_HPP
