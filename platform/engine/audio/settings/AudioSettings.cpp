#include "engine/audio/settings/AudioSettings.hpp"
#include <algorithm>

namespace platform
{
    void AudioSettings::SetMasterVolume(float vol, AudioBusSystem *busSystem)
    {
        m_masterVolume = glm::clamp(vol, 0.0f, 1.0f);
        if (busSystem) busSystem->SetBusVolume(AudioBusType::Master, m_masterVolume);
    }

    void AudioSettings::SetMusicVolume(float vol, AudioBusSystem *busSystem)
    {
        m_musicVolume = glm::clamp(vol, 0.0f, 1.0f);
        if (busSystem) busSystem->SetBusVolume(AudioBusType::Music, m_musicVolume);
    }

    void AudioSettings::SetSFXVolume(float vol, AudioBusSystem *busSystem)
    {
        m_sfxVolume = glm::clamp(vol, 0.0f, 1.0f);
        if (busSystem) busSystem->SetBusVolume(AudioBusType::SFX, m_sfxVolume);
    }

    void AudioSettings::SetUIVolume(float vol, AudioBusSystem *busSystem)
    {
        m_uiVolume = glm::clamp(vol, 0.0f, 1.0f);
        if (busSystem) busSystem->SetBusVolume(AudioBusType::UI, m_uiVolume);
    }

    void AudioSettings::SetMute(bool mute, AudioBusSystem *busSystem)
    {
        m_muted = mute;
        if (busSystem) busSystem->SetBusMute(AudioBusType::Master, m_muted);
    }

    void AudioSettings::ApplyToBusSystem(AudioBusSystem &busSystem)
    {
        busSystem.SetBusVolume(AudioBusType::Master, m_masterVolume);
        busSystem.SetBusVolume(AudioBusType::Music, m_musicVolume);
        busSystem.SetBusVolume(AudioBusType::SFX, m_sfxVolume);
        busSystem.SetBusVolume(AudioBusType::UI, m_uiVolume);
        busSystem.SetBusMute(AudioBusType::Master, m_muted);
    }
}
