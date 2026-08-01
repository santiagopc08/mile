#ifndef PLATFORM_ENGINE_AUDIO_BUS_AUDIO_BUS_HPP
#define PLATFORM_ENGINE_AUDIO_BUS_AUDIO_BUS_HPP

#include "engine/audio/AudioTypes.hpp"
#include <string>
#include <vector>
#include <algorithm>
#include <glm/glm.hpp>

namespace platform
{
    class AudioBus
    {
    public:
        AudioBus() = default;
        AudioBus(AudioBusType type, std::string name, AudioBus *parent = nullptr);

        void SetVolume(float volume) { m_volume = glm::clamp(volume, 0.0f, 1.0f); }
        [[nodiscard]] float GetVolume() const { return m_volume; }

        void SetMute(bool mute) { m_mute = mute; }
        [[nodiscard]] bool IsMuted() const { return m_mute; }

        void SetSolo(bool solo) { m_solo = solo; }
        [[nodiscard]] bool IsSolo() const { return m_solo; }

        [[nodiscard]] AudioBusType GetType() const { return m_type; }
        [[nodiscard]] const std::string &GetName() const { return m_name; }

        [[nodiscard]] float GetEffectiveVolume() const;

    private:
        AudioBusType m_type{AudioBusType::Master};
        std::string m_name{"Master"};
        float m_volume{1.0f};
        bool m_mute{false};
        bool m_solo{false};
        AudioBus *m_parent{nullptr};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_BUS_AUDIO_BUS_HPP
