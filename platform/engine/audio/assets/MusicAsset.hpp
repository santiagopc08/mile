#ifndef PLATFORM_ENGINE_AUDIO_ASSETS_MUSIC_ASSET_HPP
#define PLATFORM_ENGINE_AUDIO_ASSETS_MUSIC_ASSET_HPP

#include "engine/audio/assets/AudioSample.hpp"
#include <string>

namespace platform
{
    class MusicAsset
    {
    public:
        MusicAsset() = default;
        explicit MusicAsset(std::string title, AudioSample sample)
            : m_title(std::move(title)), m_sample(std::move(sample)) {}

        [[nodiscard]] const std::string &GetTitle() const { return m_title; }
        [[nodiscard]] const AudioSample &GetSample() const { return m_sample; }
        [[nodiscard]] double GetDuration() const { return m_sample.GetDuration(); }

    private:
        std::string m_title{"Music Track"};
        AudioSample m_sample;
    };
}

#endif // PLATFORM_ENGINE_AUDIO_ASSETS_MUSIC_ASSET_HPP
