#ifndef PLATFORM_ENGINE_LEVEL_BOSS_BOSS_SYSTEM_HPP
#define PLATFORM_ENGINE_LEVEL_BOSS_BOSS_SYSTEM_HPP

#include "engine/level/boss/BossSettingsComponent.hpp"
#include "engine/level/boss/BossRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class BossSystem
    {
    public:
        BossSystem() = default;

        void startBoss(Registry &registry, EntityID bossEntity);
        void changePhase(Registry &registry, EntityID bossEntity, uint32_t phase);
        void enrage(Registry &registry, EntityID bossEntity);
        void finishBoss(Registry &registry, EntityID bossEntity);

        [[nodiscard]] uint32_t currentPhase(Registry &registry, EntityID bossEntity) const;
        [[nodiscard]] bool isEnraged(Registry &registry, EntityID bossEntity) const;
        [[nodiscard]] bool isDefeated(Registry &registry, EntityID bossEntity) const;
    };
}

#endif // PLATFORM_ENGINE_LEVEL_BOSS_BOSS_SYSTEM_HPP
