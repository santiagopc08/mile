#ifndef PLATFORM_ENGINE_SETTINGS_USER_SETTINGS_HPP
#define PLATFORM_ENGINE_SETTINGS_USER_SETTINGS_HPP

#include <string>

namespace platform
{
    struct UserSettingsData
    {
        float masterVolume{1.0f};
        float musicVolume{0.8f};
        float sfxVolume{0.9f};
        bool fullscreen{false};
        std::string resolution{"1280x720"};
        bool vsync{true};
    };

    class UserSettings
    {
    public:
        UserSettings() = default;

        bool loadSettings();
        bool saveSettings();
        void applySettings();
        void resetDefaults();

        [[nodiscard]] const UserSettingsData &GetSettings() const { return m_settings; }
        UserSettingsData &GetSettingsMutable() { return m_settings; }

    private:
        UserSettingsData m_settings{};
    };
}

#endif // PLATFORM_ENGINE_SETTINGS_USER_SETTINGS_HPP
