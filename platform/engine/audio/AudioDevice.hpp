#ifndef PLATFORM_ENGINE_AUDIO_AUDIO_DEVICE_HPP
#define PLATFORM_ENGINE_AUDIO_AUDIO_DEVICE_HPP

#include "engine/audio/AudioConfiguration.hpp"
#include <vector>
#include <string>

namespace platform
{
    class AudioDevice
    {
    public:
        AudioDevice();
        ~AudioDevice();

        bool Initialize(const AudioConfiguration &config);
        void Shutdown();

        [[nodiscard]] bool IsInitialized() const { return m_initialized; }
        [[nodiscard]] const AudioConfiguration &GetConfiguration() const { return m_config; }
        [[nodiscard]] static std::vector<std::string> GetAvailableDevices();

    private:
        AudioConfiguration m_config{};
        uint32_t m_deviceID{0};
        bool m_initialized{false};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_AUDIO_DEVICE_HPP
