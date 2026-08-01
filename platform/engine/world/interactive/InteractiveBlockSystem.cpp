#include "engine/world/interactive/InteractiveBlockSystem.hpp"
#include "engine/core/Logger.hpp"

namespace platform
{
    bool InteractiveBlockSystem::interact(Registry &registry, EntityID blockEntity, EntityID activatorEntity)
    {
        auto *settings = registry.GetComponent<InteractiveObjectSettingsComponent>(blockEntity);
        auto *runtime = registry.GetComponent<InteractiveObjectRuntimeComponent>(blockEntity);

        if (!settings) settings = &registry.AddComponent<InteractiveObjectSettingsComponent>(blockEntity);
        if (!runtime) runtime = &registry.AddComponent<InteractiveObjectRuntimeComponent>(blockEntity);

        if (!settings->enabled) return false;

        if (!runtime->activated || settings->repeatable)
        {
            activate(registry, blockEntity, activatorEntity);
            return true;
        }
        return false;
    }

    void InteractiveBlockSystem::activate(Registry &registry, EntityID blockEntity, EntityID activatorEntity)
    {
        auto *runtime = registry.GetComponent<InteractiveObjectRuntimeComponent>(blockEntity);
        if (!runtime) runtime = &registry.AddComponent<InteractiveObjectRuntimeComponent>(blockEntity);

        runtime->activated = true;
        runtime->activator = activatorEntity;
        LOG_INFO("[InteractiveBlockSystem] Activated block entity #{} by activator #{}.", blockEntity, activatorEntity);
    }

    void InteractiveBlockSystem::deactivate(Registry &registry, EntityID blockEntity)
    {
        auto *runtime = registry.GetComponent<InteractiveObjectRuntimeComponent>(blockEntity);
        if (runtime)
        {
            runtime->activated = false;
            runtime->activator = kNullEntity;
        }
    }

    void InteractiveBlockSystem::reset(Registry &registry, EntityID blockEntity)
    {
        deactivate(registry, blockEntity);
    }

    bool InteractiveBlockSystem::isActivated(Registry &registry, EntityID blockEntity) const
    {
        auto *runtime = registry.GetComponent<InteractiveObjectRuntimeComponent>(blockEntity);
        return runtime ? runtime->activated : false;
    }
}
