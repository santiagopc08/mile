#include "engine/audio/AudioSource.hpp"

namespace platform
{
    AudioSource::AudioSource() = default;

    AudioSource::AudioSource(uint64_t sourceID, std::string soundName)
        : m_sourceID(sourceID), m_soundName(std::move(soundName))
    {
    }

    void AudioSource::Play()
    {
        m_state = PlaybackState::Playing;
    }

    void AudioSource::Pause()
    {
        if (m_state == PlaybackState::Playing)
        {
            m_state = PlaybackState::Paused;
        }
    }

    void AudioSource::Resume()
    {
        if (m_state == PlaybackState::Paused)
        {
            m_state = PlaybackState::Playing;
        }
    }

    void AudioSource::Stop()
    {
        m_state = PlaybackState::Stopped;
    }

    void AudioSource::Restart()
    {
        m_state = PlaybackState::Playing;
    }
}
