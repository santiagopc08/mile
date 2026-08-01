#ifndef PLATFORM_ENGINE_AUDIO_AUDIO_MANAGER_HPP
#define PLATFORM_ENGINE_AUDIO_AUDIO_MANAGER_HPP

#include "engine/audio/AudioSource.hpp"
#include "engine/audio/AudioListener.hpp"
#include "engine/audio/bus/AudioBusSystem.hpp"
#include "engine/audio/spatial/SpatialAudio2D.hpp"
#include <vector>
#include <memory>

namespace platform
{
    class AudioManager
    {
    public:
        AudioManager();

        void Initialize(size_t maxVoices = 32);
        void Update(double dt, const AudioListener &listener, AudioBusSystem &busSystem);

        AudioSource *PlaySound(const std::string &soundName, AudioBusType bus = AudioBusType::SFX, float volume = 1.0f, bool loop = false);
        AudioSource *PlaySpatialSound(const std::string &soundName, const glm::vec2 &position, AudioBusType bus = AudioBusType::SFX, float volume = 1.0f, bool loop = false);

        void StopAllSounds();

        [[nodiscard]] const std::vector<std::unique_ptr<AudioSource>> &GetActiveSources() const { return m_sources; }
        [[nodiscard]] size_t GetActiveVoiceCount() const;
        [[nodiscard]] uint64_t GetTotalSoundsPlayed() const { return m_totalSoundsPlayed; }

    private:
        std::vector<std::unique_ptr<AudioSource>> m_sources;
        size_t m_maxVoices{32};
        uint64_t m_nextSourceID{1};
        uint64_t m_totalSoundsPlayed{0};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_AUDIO_MANAGER_HPP
