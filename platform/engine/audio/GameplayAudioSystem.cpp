#include "engine/audio/GameplayAudioSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void GameplayAudioSystem::PlayEvent(AudioEvent event)
    {
        m_history.push_back(event);
        LOG_INFO("[GameplayAudioSystem] Triggered audio event code {}.", static_cast<int>(event));
    }

    bool GameplayAudioSystem::HasPlayed(AudioEvent event) const
    {
        return std::find(m_history.begin(), m_history.end(), event) != m_history.end();
    }
}
