#ifndef PLATFORM_ENGINE_AUDIO_MUSIC_MUSIC_SYSTEM_HPP
#define PLATFORM_ENGINE_AUDIO_MUSIC_MUSIC_SYSTEM_HPP

#include "engine/audio/AudioTypes.hpp"
#include "engine/audio/assets/AudioBank.hpp"
#include <string>
#include <unordered_map>

namespace platform
{
    class MusicSystem
    {
    public:
        MusicSystem();

        void SetState(MusicState state, double fadeDurationSec = 0.5);
        void SetTrackForState(MusicState state, std::string trackName);

        void Update(double dt, AudioBank *bank);

        [[nodiscard]] MusicState GetCurrentState() const { return m_currentState; }
        [[nodiscard]] const std::string &GetCurrentTrackName() const { return m_currentTrackName; }
        [[nodiscard]] float GetMusicVolume() const { return m_volume; }
        [[nodiscard]] bool IsCrossfading() const { return m_crossfading; }

    private:
        MusicState m_currentState{MusicState::Gameplay};
        std::string m_currentTrackName{"GameplayTheme"};
        std::unordered_map<MusicState, std::string> m_stateTracks;

        float m_volume{0.8f};
        double m_fadeDuration{0.5};
        double m_fadeElapsed{0.0};
        bool m_crossfading{false};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_MUSIC_MUSIC_SYSTEM_HPP
