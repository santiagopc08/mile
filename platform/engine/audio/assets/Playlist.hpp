#ifndef PLATFORM_ENGINE_AUDIO_ASSETS_PLAYLIST_HPP
#define PLATFORM_ENGINE_AUDIO_ASSETS_PLAYLIST_HPP

#include <vector>
#include <string>

namespace platform
{
    class Playlist
    {
    public:
        Playlist() = default;
        explicit Playlist(std::string name) : m_name(std::move(name)) {}

        void AddTrack(std::string trackName) { m_tracks.push_back(std::move(trackName)); }
        [[nodiscard]] const std::vector<std::string> &GetTracks() const { return m_tracks; }

        [[nodiscard]] const std::string &GetName() const { return m_name; }
        [[nodiscard]] size_t GetTrackCount() const { return m_tracks.size(); }

        [[nodiscard]] std::string GetTrack(size_t index) const
        {
            if (index < m_tracks.size()) return m_tracks[index];
            return "";
        }

    private:
        std::string m_name{"Default Playlist"};
        std::vector<std::string> m_tracks;
    };
}

#endif // PLATFORM_ENGINE_AUDIO_ASSETS_PLAYLIST_HPP
