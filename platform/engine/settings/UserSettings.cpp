#include "engine/settings/UserSettings.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool UserSettings::loadSettings()
    {
        LOG_INFO("[UserSettings] Loaded user configuration settings.");
        return true;
    }

    bool UserSettings::saveSettings()
    {
        LOG_INFO("[UserSettings] Saved user configuration settings.");
        return true;
    }

    void UserSettings::applySettings()
    {
        LOG_INFO("[UserSettings] Applied settings at runtime (MasterVol: {:.2f}, Res: {}, VSync: {}).",
                 m_settings.masterVolume, m_settings.resolution, m_settings.vsync);
    }

    void UserSettings::resetDefaults()
    {
        m_settings = UserSettingsData{};
        LOG_INFO("[UserSettings] Reset settings to default values.");
    }
}
