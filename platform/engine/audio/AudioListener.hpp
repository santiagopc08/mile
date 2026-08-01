#ifndef PLATFORM_ENGINE_AUDIO_AUDIO_LISTENER_HPP
#define PLATFORM_ENGINE_AUDIO_AUDIO_LISTENER_HPP

#include <glm/glm.hpp>

namespace platform
{
    class AudioListener
    {
    public:
        AudioListener() = default;
        explicit AudioListener(const glm::vec2 &position) : m_position(position) {}

        void SetPosition(const glm::vec2 &position) { m_position = position; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }

        void SetVelocity(const glm::vec2 &velocity) { m_velocity = velocity; }
        [[nodiscard]] const glm::vec2 &GetVelocity() const { return m_velocity; }

        void SetOrientation(float radians) { m_orientation = radians; }
        [[nodiscard]] float GetOrientation() const { return m_orientation; }

    private:
        glm::vec2 m_position{0.0f, 0.0f};
        glm::vec2 m_velocity{0.0f, 0.0f};
        float m_orientation{0.0f};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_AUDIO_LISTENER_HPP
