#ifndef PLATFORM_ENGINE_AUDIO_DEBUG_AUDIO_DIAGNOSTICS_HPP
#define PLATFORM_ENGINE_AUDIO_DEBUG_AUDIO_DIAGNOSTICS_HPP

#include <cstdint>

namespace platform
{
    struct AudioDiagnostics
    {
        uint64_t TotalSoundsPlayed{0};
        size_t MaxConcurrentVoices{0};
        uint64_t DroppedSounds{0};
        double AverageLatencyMs{8.0};
        size_t ActiveVoiceCount{0};
        size_t TotalBuses{5};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_DEBUG_AUDIO_DIAGNOSTICS_HPP
