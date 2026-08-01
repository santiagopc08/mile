#ifndef PLATFORM_ENGINE_LEVEL_BOSS_BOSS_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_LEVEL_BOSS_BOSS_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct BossSettingsComponent
    {
        uint32_t phases{3};
        float enrageHealth{25.0f};
    };
}

#endif // PLATFORM_ENGINE_LEVEL_BOSS_BOSS_SETTINGS_COMPONENT_HPP
