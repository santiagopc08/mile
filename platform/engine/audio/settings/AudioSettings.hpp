#ifndef PLATFORM_ENGINE_AUDIO_SETTINGS_AUDIO_SETTINGS_HPP
#define PLATFORM_ENGINE_AUDIO_SETTINGS_AUDIO_SETTINGS_HPP

#include "engine/audio/bus/AudioBusSystem.hpp"

namespace platform
{
    class AudioSettings
    {
    public:
        AudioSettings() = default;

        void SetMasterVolume(float vol, AudioBusSystem *busSystem = nullptr);
        void SetMusicVolume(float vol, AudioBusSystem *busSystem = nullptr);
        void SetSFXVolume(float vol, AudioBusSystem *busSystem = nullptr);
        void SetUIVolume(float vol, AudioBusSystem *busSystem = nullptr);

        void SetMute(bool mute, AudioBusSystem *busSystem = nullptr);

        [[nodiscard]] float GetMasterVolume() const { return m_masterVolume; }
        [[nodiscard]] float GetMusicVolume() const { return m_musicVolume; }
        [[nodiscard]] float GetSFXVolume() const { return m_sfxVolume; }
        [[nodiscard]] float GetUIVolume() const { return m_uiVolume; }
        [[nodiscard]] bool IsMuted() const { return m_muted; }

        void ApplyToBusSystem(AudioBusSystem &busSystem);

    private:
        float m_masterVolume{1.0f};
        float m_musicVolume{0.8f};
        float m_sfxVolume{0.9f};
        float m_uiVolume{0.7f};
        bool m_muted{false};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_SETTINGS_AUDIO_SETTINGS_HPP
