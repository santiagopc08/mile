#ifndef PLATFORM_ENGINE_AUDIO_BUS_AUDIO_BUS_SYSTEM_HPP
#define PLATFORM_ENGINE_AUDIO_BUS_AUDIO_BUS_SYSTEM_HPP

#include "engine/audio/bus/AudioBus.hpp"
#include <unordered_map>
#include <memory>

namespace platform
{
    class AudioBusSystem
    {
    public:
        AudioBusSystem();

        void Initialize();

        AudioBus *GetBus(AudioBusType type);
        [[nodiscard]] const AudioBus *GetBus(AudioBusType type) const;

        void SetBusVolume(AudioBusType type, float volume);
        void SetBusMute(AudioBusType type, bool mute);

        [[nodiscard]] float GetBusEffectiveVolume(AudioBusType type) const;
        [[nodiscard]] const std::unordered_map<AudioBusType, std::unique_ptr<AudioBus>> &GetBuses() const { return m_buses; }

    private:
        std::unordered_map<AudioBusType, std::unique_ptr<AudioBus>> m_buses;
    };
}

#endif // PLATFORM_ENGINE_AUDIO_BUS_AUDIO_BUS_SYSTEM_HPP
