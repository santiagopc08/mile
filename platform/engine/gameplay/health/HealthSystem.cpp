#include "engine/gameplay/health/HealthSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    void HealthSystem::damage(Registry &registry, EntityID entity, float damagePoints)
    {
        auto *settings = registry.GetComponent<HealthSettingsComponent>(entity);
        auto *runtime = registry.GetComponent<HealthRuntimeComponent>(entity);

        if (!settings) settings = &registry.AddComponent<HealthSettingsComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<HealthRuntimeComponent>(entity);

        if (settings->invulnerable || runtime->dead) return;

        if (runtime->currentHealth <= damagePoints)
        {
            kill(registry, entity);
        }
        else
        {
            runtime->currentHealth -= damagePoints;
            LOG_INFO("[HealthSystem] Entity #{} took {:.1f} damage (HP: {:.1f}).", entity, damagePoints, runtime->currentHealth);
        }
    }

    void HealthSystem::heal(Registry &registry, EntityID entity, float healPoints)
    {
        auto *settings = registry.GetComponent<HealthSettingsComponent>(entity);
        auto *runtime = registry.GetComponent<HealthRuntimeComponent>(entity);

        if (settings && runtime && !runtime->dead)
        {
            runtime->currentHealth = std::min(runtime->currentHealth + healPoints, settings->maximumHealth);
            LOG_INFO("[HealthSystem] Entity #{} healed {:.1f} HP (Current: {:.1f}).", entity, healPoints, runtime->currentHealth);
        }
    }

    void HealthSystem::kill(Registry &registry, EntityID entity)
    {
        auto *runtime = registry.GetComponent<HealthRuntimeComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<HealthRuntimeComponent>(entity);

        runtime->currentHealth = 0.0f;
        runtime->dead = true;
        LOG_INFO("[HealthSystem] Entity #{} killed.", entity);
    }

    void HealthSystem::revive(Registry &registry, EntityID entity)
    {
        auto *settings = registry.GetComponent<HealthSettingsComponent>(entity);
        auto *runtime = registry.GetComponent<HealthRuntimeComponent>(entity);

        if (!settings) settings = &registry.AddComponent<HealthSettingsComponent>(entity);
        if (!runtime) runtime = &registry.AddComponent<HealthRuntimeComponent>(entity);

        runtime->dead = false;
        runtime->currentHealth = settings->maximumHealth;
        LOG_INFO("[HealthSystem] Entity #{} revived with {:.1f} HP.", entity, runtime->currentHealth);
    }

    bool HealthSystem::isDead(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<HealthRuntimeComponent>(entity);
        return runtime ? runtime->dead : false;
    }

    float HealthSystem::currentHealth(Registry &registry, EntityID entity) const
    {
        auto *runtime = registry.GetComponent<HealthRuntimeComponent>(entity);
        return runtime ? runtime->currentHealth : 0.0f;
    }
}
