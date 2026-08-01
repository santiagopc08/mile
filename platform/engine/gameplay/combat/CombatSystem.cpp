#include "engine/gameplay/combat/CombatSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    bool CombatSystem::attack(Registry &registry, EntityID attacker, EntityID defender)
    {
        auto *settings = registry.GetComponent<CombatSettingsComponent>(attacker);
        auto *runtime = registry.GetComponent<CombatRuntimeComponent>(attacker);

        if (!settings) settings = &registry.AddComponent<CombatSettingsComponent>(attacker);
        if (!runtime) runtime = &registry.AddComponent<CombatRuntimeComponent>(attacker);

        if (canAttack(registry, attacker))
        {
            runtime->attacking = true;
            runtime->cooldownRemaining = settings->cooldown;
            LOG_INFO("[CombatSystem] Entity #{} attacked target #{} for {:.1f} damage.", attacker, defender, settings->damage);
            return true;
        }
        return false;
    }

    void CombatSystem::cancelAttack(Registry &registry, EntityID attacker)
    {
        auto *runtime = registry.GetComponent<CombatRuntimeComponent>(attacker);
        if (runtime) runtime->attacking = false;
    }

    bool CombatSystem::canAttack(Registry &registry, EntityID attacker) const
    {
        auto *runtime = registry.GetComponent<CombatRuntimeComponent>(attacker);
        return runtime ? (runtime->cooldownRemaining <= 0.0f) : true;
    }

    float CombatSystem::cooldown(Registry &registry, EntityID attacker) const
    {
        auto *runtime = registry.GetComponent<CombatRuntimeComponent>(attacker);
        return runtime ? runtime->cooldownRemaining : 0.0f;
    }

    void CombatSystem::Update(Registry &registry, double dt)
    {
        float delta = static_cast<float>(dt);
        auto view = registry.GetView<CombatRuntimeComponent>();
        view.Each([delta](EntityID, CombatRuntimeComponent &runtime) {
            if (runtime.cooldownRemaining > 0.0f)
            {
                runtime.cooldownRemaining = std::max(0.0f, runtime.cooldownRemaining - delta);
            }
            else
            {
                runtime.attacking = false;
            }
        });
    }
}
