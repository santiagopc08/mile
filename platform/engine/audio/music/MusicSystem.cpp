#include "engine/audio/music/MusicSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    MusicSystem::MusicSystem()
    {
        m_stateTracks[MusicState::Menu] = "MenuTheme";
        m_stateTracks[MusicState::Gameplay] = "GameplayTheme";
        m_stateTracks[MusicState::Pause] = "PauseTheme";
        m_stateTracks[MusicState::GameOver] = "GameOverTheme";
    }

    void MusicSystem::SetState(MusicState state, double fadeDurationSec)
    {
        if (m_currentState == state)
        {
            return;
        }

        m_currentState = state;
        m_fadeDuration = fadeDurationSec;
        m_fadeElapsed = 0.0;
        m_crossfading = true;

        auto it = m_stateTracks.find(state);
        if (it != m_stateTracks.end())
        {
            m_currentTrackName = it->second;
            LOG_INFO("[MusicSystem] Crossfading to music state '{}' (Track: '{}').",
                     static_cast<int>(state), m_currentTrackName);
        }
    }

    void MusicSystem::SetTrackForState(MusicState state, std::string trackName)
    {
        m_stateTracks[state] = std::move(trackName);
    }

    void MusicSystem::Update(double dt, AudioBank *bank)
    {
        (void)bank;
        if (!m_crossfading)
        {
            return;
        }

        m_fadeElapsed += dt;
        if (m_fadeElapsed >= m_fadeDuration)
        {
            m_crossfading = false;
        }
    }
}
