#ifndef PLATFORM_ENGINE_AUDIO_AUDIO_SOURCE_HPP
#define PLATFORM_ENGINE_AUDIO_AUDIO_SOURCE_HPP

#include "engine/audio/AudioTypes.hpp"
#include <glm/glm.hpp>
#include <string>

namespace platform
{
    class AudioSource
    {
    public:
        AudioSource();
        explicit AudioSource(uint64_t sourceID, std::string soundName = "");

        void Play();
        void Pause();
        void Resume();
        void Stop();
        void Restart();

        void SetState(PlaybackState state) { m_state = state; }
        [[nodiscard]] PlaybackState GetState() const { return m_state; }
        [[nodiscard]] bool IsPlaying() const { return m_state == PlaybackState::Playing; }
        [[nodiscard]] bool IsPaused() const { return m_state == PlaybackState::Paused; }

        void SetSourceID(uint64_t id) { m_sourceID = id; }
        [[nodiscard]] uint64_t GetSourceID() const { return m_sourceID; }

        void SetSoundName(std::string name) { m_soundName = std::move(name); }
        [[nodiscard]] const std::string &GetSoundName() const { return m_soundName; }

        void SetBusType(AudioBusType bus) { m_busType = bus; }
        [[nodiscard]] AudioBusType GetBusType() const { return m_busType; }

        void SetVolume(float volume) { m_volume = glm::clamp(volume, 0.0f, 1.0f); }
        [[nodiscard]] float GetVolume() const { return m_volume; }

        void SetPitch(float pitch) { m_pitch = glm::clamp(pitch, 0.1f, 4.0f); }
        [[nodiscard]] float GetPitch() const { return m_pitch; }

        void SetLoop(bool loop) { m_loop = loop; }
        [[nodiscard]] bool IsLooping() const { return m_loop; }

        void SetSpatial(bool spatial) { m_spatial = spatial; }
        [[nodiscard]] bool IsSpatial() const { return m_spatial; }

        void SetPosition(const glm::vec2 &position) { m_position = position; }
        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }

        void SetMinDistance(float minDist) { m_minDistance = minDist; }
        [[nodiscard]] float GetMinDistance() const { return m_minDistance; }

        void SetMaxDistance(float maxDist) { m_maxDistance = maxDist; }
        [[nodiscard]] float GetMaxDistance() const { return m_maxDistance; }

        void SetFalloffMode(SpatialFalloffMode mode) { m_falloffMode = mode; }
        [[nodiscard]] SpatialFalloffMode GetFalloffMode() const { return m_falloffMode; }

        void SetEffectiveVolume(float vol) { m_effectiveVolume = vol; }
        [[nodiscard]] float GetEffectiveVolume() const { return m_effectiveVolume; }

        void SetStereoPan(float pan) { m_stereoPan = glm::clamp(pan, -1.0f, 1.0f); }
        [[nodiscard]] float GetStereoPan() const { return m_stereoPan; }

    private:
        uint64_t m_sourceID{0};
        std::string m_soundName;
        AudioBusType m_busType{AudioBusType::SFX};
        PlaybackState m_state{PlaybackState::Stopped};

        float m_volume{1.0f};
        float m_pitch{1.0f};
        float m_effectiveVolume{1.0f};
        float m_stereoPan{0.0f};
        bool m_loop{false};

        // 2D Spatial attributes
        bool m_spatial{false};
        glm::vec2 m_position{0.0f, 0.0f};
        float m_minDistance{10.0f};
        float m_maxDistance{500.0f};
        SpatialFalloffMode m_falloffMode{SpatialFalloffMode::Linear};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_AUDIO_SOURCE_HPP
