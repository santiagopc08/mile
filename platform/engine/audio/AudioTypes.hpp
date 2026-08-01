#ifndef PLATFORM_ENGINE_AUDIO_AUDIO_TYPES_HPP
#define PLATFORM_ENGINE_AUDIO_AUDIO_TYPES_HPP

#include <cstdint>

namespace platform
{
    enum class PlaybackState : uint8_t
    {
        Stopped = 0,
        Playing,
        Paused,
        Finished
    };

    enum class AudioBusType : uint8_t
    {
        Master = 0,
        Music,
        SFX,
        UI,
        Ambient
    };

    enum class SpatialFalloffMode : uint8_t
    {
        Linear = 0,
        Inverse
    };

    enum class MusicState : uint8_t
    {
        Menu = 0,
        Gameplay,
        Pause,
        GameOver
    };
}

#endif // PLATFORM_ENGINE_AUDIO_AUDIO_TYPES_HPP
