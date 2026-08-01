#include "engine/audio/AudioManager.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    AudioManager::AudioManager() = default;

    void AudioManager::Initialize(size_t maxVoices)
    {
        m_maxVoices = maxVoices;
        m_sources.clear();
        LOG_INFO("[AudioManager] Initialized Audio Manager with {} voice channels.", m_maxVoices);
    }

    void AudioManager::Update(double dt, const AudioListener &listener, AudioBusSystem &busSystem)
    {
        (void)dt;

        for (auto it = m_sources.begin(); it != m_sources.end();)
        {
            auto &source = *it;
            if (!source->IsPlaying() && !source->IsPaused())
            {
                it = m_sources.erase(it);
                continue;
            }

            // Apply 2D Spatial calculation if spatialized
            SpatialAudio2D::Evaluate(*source, listener);

            // Apply Bus Gain
            float busGain = busSystem.GetBusEffectiveVolume(source->GetBusType());
            source->SetEffectiveVolume(source->GetEffectiveVolume() * busGain);

            ++it;
        }
    }

    AudioSource *AudioManager::PlaySound(const std::string &soundName, AudioBusType bus, float volume, bool loop)
    {
        if (m_sources.size() >= m_maxVoices)
        {
            LOG_WARN("[AudioManager] Max concurrent voices reached ({}). Evicting oldest voice.", m_maxVoices);
            m_sources.erase(m_sources.begin());
        }

        auto source = std::make_unique<AudioSource>(m_nextSourceID++, soundName);
        source->SetBusType(bus);
        source->SetVolume(volume);
        source->SetLoop(loop);
        source->SetSpatial(false);
        source->Play();

        AudioSource *ptr = source.get();
        m_sources.push_back(std::move(source));
        m_totalSoundsPlayed++;

        return ptr;
    }

    AudioSource *AudioManager::PlaySpatialSound(const std::string &soundName, const glm::vec2 &position, AudioBusType bus, float volume, bool loop)
    {
        AudioSource *source = PlaySound(soundName, bus, volume, loop);
        if (source)
        {
            source->SetSpatial(true);
            source->SetPosition(position);
        }
        return source;
    }

    void AudioManager::StopAllSounds()
    {
        for (auto &source : m_sources)
        {
            source->Stop();
        }
        m_sources.clear();
    }

    size_t AudioManager::GetActiveVoiceCount() const
    {
        size_t count = 0;
        for (const auto &s : m_sources)
        {
            if (s->IsPlaying())
            {
                count++;
            }
        }
        return count;
    }
}
