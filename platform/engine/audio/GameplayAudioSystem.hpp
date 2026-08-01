#ifndef PLATFORM_ENGINE_AUDIO_GAMEPLAY_AUDIO_SYSTEM_HPP
#define PLATFORM_ENGINE_AUDIO_GAMEPLAY_AUDIO_SYSTEM_HPP

#include <string>
#include <vector>

namespace platform
{
    enum class AudioEvent
    {
        EngineIdle,
        EngineRunning,
        Coin,
        Fuel,
        Checkpoint,
        Crash,
        MenuTheme,
        GameplayTheme
    };

    class GameplayAudioSystem
    {
    public:
        GameplayAudioSystem() = default;

        void PlayEvent(AudioEvent event);

        [[nodiscard]] size_t GetPlayedEventsCount() const { return m_history.size(); }
        [[nodiscard]] bool HasPlayed(AudioEvent event) const;

    private:
        std::vector<AudioEvent> m_history;
    };
}

#endif // PLATFORM_ENGINE_AUDIO_GAMEPLAY_AUDIO_SYSTEM_HPP
