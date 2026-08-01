#ifndef PLATFORM_ENGINE_AUDIO_AUDIO_CONFIGURATION_HPP
#define PLATFORM_ENGINE_AUDIO_AUDIO_CONFIGURATION_HPP

#include <string>
#include <cstdint>

namespace platform
{
    struct AudioConfiguration
    {
        std::string DeviceName{"Default Audio Output"};
        uint32_t SampleRate{44100};
        uint8_t Channels{2}; // Stereo
        uint16_t BufferSize{1024};
        size_t MaxConcurrentVoices{32};
        float MasterVolume{1.0f};
        bool EnableSpatialAudio{true};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_AUDIO_CONFIGURATION_HPP
