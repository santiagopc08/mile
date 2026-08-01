#ifndef PLATFORM_ENGINE_AUDIO_ASSETS_AUDIO_BANK_HPP
#define PLATFORM_ENGINE_AUDIO_ASSETS_AUDIO_BANK_HPP

#include "engine/audio/assets/SoundAsset.hpp"
#include "engine/audio/assets/MusicAsset.hpp"
#include <unordered_map>
#include <memory>
#include <string>

namespace platform
{
    class AudioBank
    {
    public:
        AudioBank();

        bool RegisterSound(const std::string &name, SoundAsset sound);
        bool RegisterMusic(const std::string &name, MusicAsset music);

        [[nodiscard]] SoundAsset *GetSound(const std::string &name);
        [[nodiscard]] MusicAsset *GetMusic(const std::string &name);

        [[nodiscard]] bool HasSound(const std::string &name) const;
        [[nodiscard]] bool HasMusic(const std::string &name) const;

        void UnloadAll();

        [[nodiscard]] size_t GetSoundCount() const { return m_sounds.size(); }
        [[nodiscard]] size_t GetMusicCount() const { return m_musicTracks.size(); }

    private:
        std::unordered_map<std::string, SoundAsset> m_sounds;
        std::unordered_map<std::string, MusicAsset> m_musicTracks;
    };
}

#endif // PLATFORM_ENGINE_AUDIO_ASSETS_AUDIO_BANK_HPP
