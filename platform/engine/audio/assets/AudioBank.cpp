#include "engine/audio/assets/AudioBank.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    AudioBank::AudioBank() = default;

    bool AudioBank::RegisterSound(const std::string &name, SoundAsset sound)
    {
        if (m_sounds.find(name) != m_sounds.end())
        {
            LOG_INFO("[AudioBank] Sound '{}' already loaded. Reusing cached asset.", name);
            m_sounds[name].IncrementRefCount();
            return true;
        }

        m_sounds[name] = std::move(sound);
        LOG_INFO("[AudioBank] Registered Sound Asset '{}'.", name);
        return true;
    }

    bool AudioBank::RegisterMusic(const std::string &name, MusicAsset music)
    {
        if (m_musicTracks.find(name) != m_musicTracks.end())
        {
            LOG_INFO("[AudioBank] Music '{}' already loaded. Reusing cached asset.", name);
            return true;
        }

        m_musicTracks[name] = std::move(music);
        LOG_INFO("[AudioBank] Registered Music Asset '{}'.", name);
        return true;
    }

    SoundAsset *AudioBank::GetSound(const std::string &name)
    {
        auto it = m_sounds.find(name);
        if (it != m_sounds.end())
        {
            return &it->second;
        }
        return nullptr;
    }

    MusicAsset *AudioBank::GetMusic(const std::string &name)
    {
        auto it = m_musicTracks.find(name);
        if (it != m_musicTracks.end())
        {
            return &it->second;
        }
        return nullptr;
    }

    bool AudioBank::HasSound(const std::string &name) const
    {
        return m_sounds.find(name) != m_sounds.end();
    }

    bool AudioBank::HasMusic(const std::string &name) const
    {
        return m_musicTracks.find(name) != m_musicTracks.end();
    }

    void AudioBank::UnloadAll()
    {
        m_sounds.clear();
        m_musicTracks.clear();
        LOG_INFO("[AudioBank] Unloaded all audio assets.");
    }
}
