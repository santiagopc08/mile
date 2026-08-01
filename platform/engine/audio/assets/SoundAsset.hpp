#ifndef PLATFORM_ENGINE_AUDIO_ASSETS_SOUND_ASSET_HPP
#define PLATFORM_ENGINE_AUDIO_ASSETS_SOUND_ASSET_HPP

#include "engine/audio/assets/AudioSample.hpp"
#include <memory>
#include <string>

namespace platform
{
    class SoundAsset
    {
    public:
        SoundAsset() = default;
        explicit SoundAsset(std::string name, AudioSample sample)
            : m_name(std::move(name)), m_sample(std::move(sample)) {}

        [[nodiscard]] const std::string &GetName() const { return m_name; }
        [[nodiscard]] const AudioSample &GetSample() const { return m_sample; }
        [[nodiscard]] double GetDuration() const { return m_sample.GetDuration(); }

        void IncrementRefCount() { m_refCount++; }
        void DecrementRefCount() { if (m_refCount > 0) m_refCount--; }
        [[nodiscard]] size_t GetRefCount() const { return m_refCount; }

    private:
        std::string m_name{"Sound"};
        AudioSample m_sample;
        size_t m_refCount{1};
    };
}

#endif // PLATFORM_ENGINE_AUDIO_ASSETS_SOUND_ASSET_HPP
