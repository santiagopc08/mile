#include "engine/level/boss/BossSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    void BossSystem::startBoss(Registry &registry, EntityID bossEntity)
    {
        auto *settings = registry.GetComponent<BossSettingsComponent>(bossEntity);
        auto *runtime = registry.GetComponent<BossRuntimeComponent>(bossEntity);

        if (!settings) settings = &registry.AddComponent<BossSettingsComponent>(bossEntity);
        if (!runtime) runtime = &registry.AddComponent<BossRuntimeComponent>(bossEntity);

        runtime->active = true;
        runtime->currentPhase = 1;
        runtime->enraged = false;
        runtime->defeated = false;

        LOG_INFO("[BossSystem] Started boss encounter on entity #{}.", bossEntity);
    }

    void BossSystem::changePhase(Registry &registry, EntityID bossEntity, uint32_t phase)
    {
        auto *runtime = registry.GetComponent<BossRuntimeComponent>(bossEntity);
        if (!runtime) runtime = &registry.AddComponent<BossRuntimeComponent>(bossEntity);

        runtime->currentPhase = phase;
        LOG_INFO("[BossSystem] Boss entity #{} transitioned to Phase {}.", bossEntity, phase);
    }

    void BossSystem::enrage(Registry &registry, EntityID bossEntity)
    {
        auto *runtime = registry.GetComponent<BossRuntimeComponent>(bossEntity);
        if (!runtime) runtime = &registry.AddComponent<BossRuntimeComponent>(bossEntity);

        runtime->enraged = true;
        LOG_INFO("[BossSystem] Boss entity #{} is now ENRAGED!", bossEntity);
    }

    void BossSystem::finishBoss(Registry &registry, EntityID bossEntity)
    {
        auto *runtime = registry.GetComponent<BossRuntimeComponent>(bossEntity);
        if (runtime)
        {
            runtime->active = false;
            runtime->defeated = true;
            LOG_INFO("[BossSystem] Boss entity #{} defeated!", bossEntity);
        }
    }

    uint32_t BossSystem::currentPhase(Registry &registry, EntityID bossEntity) const
    {
        auto *runtime = registry.GetComponent<BossRuntimeComponent>(bossEntity);
        return runtime ? runtime->currentPhase : 1;
    }

    bool BossSystem::isEnraged(Registry &registry, EntityID bossEntity) const
    {
        auto *runtime = registry.GetComponent<BossRuntimeComponent>(bossEntity);
        return runtime ? runtime->enraged : false;
    }

    bool BossSystem::isDefeated(Registry &registry, EntityID bossEntity) const
    {
        auto *runtime = registry.GetComponent<BossRuntimeComponent>(bossEntity);
        return runtime ? runtime->defeated : false;
    }
}
