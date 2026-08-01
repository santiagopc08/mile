#include "engine/gameplay/resources/ResourceSystem.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    EntityID ResourceSystem::createResource(Registry &registry, ResourceID id, const std::string &name, float maximum, float initial)
    {
        EntityID entity = registry.CreateEntity("Resource_" + name);
        auto &settings = registry.AddComponent<ResourceSettingsComponent>(entity);
        auto &runtime = registry.AddComponent<ResourceRuntimeComponent>(entity);

        settings.id = id;
        settings.name = name;
        settings.maximum = maximum;
        settings.initial = initial;

        runtime.current = initial;
        runtime.previous = initial;
        runtime.depleted = (initial <= 0.0f);

        LOG_INFO("[ResourceSystem] Created resource '{}' (ID: {}, Maximum: {:.1f}, Initial: {:.1f}).",
                 name, id, maximum, initial);
        return entity;
    }

    void ResourceSystem::destroyResource(Registry &registry, EntityID resourceEntity)
    {
        registry.DestroyEntity(resourceEntity);
    }

    void ResourceSystem::consume(Registry &registry, EntityID resourceEntity, float amount)
    {
        auto *settings = registry.GetComponent<ResourceSettingsComponent>(resourceEntity);
        auto *runtime = registry.GetComponent<ResourceRuntimeComponent>(resourceEntity);

        if (settings && runtime)
        {
            runtime->previous = runtime->current;
            runtime->current = std::max(settings->minimum, runtime->current - amount);
            runtime->dirty = true;
            if (runtime->current <= settings->minimum)
            {
                runtime->depleted = true;
            }
        }
    }

    void ResourceSystem::restore(Registry &registry, EntityID resourceEntity, float amount)
    {
        auto *settings = registry.GetComponent<ResourceSettingsComponent>(resourceEntity);
        auto *runtime = registry.GetComponent<ResourceRuntimeComponent>(resourceEntity);

        if (settings && runtime)
        {
            runtime->previous = runtime->current;
            runtime->current = settings->allowOverflow ? (runtime->current + amount) : std::min(settings->maximum, runtime->current + amount);
            runtime->depleted = false;
            runtime->dirty = true;
        }
    }

    void ResourceSystem::setValue(Registry &registry, EntityID resourceEntity, float value)
    {
        auto *settings = registry.GetComponent<ResourceSettingsComponent>(resourceEntity);
        auto *runtime = registry.GetComponent<ResourceRuntimeComponent>(resourceEntity);

        if (settings && runtime)
        {
            runtime->previous = runtime->current;
            runtime->current = std::clamp(value, settings->minimum, settings->maximum);
            runtime->depleted = (runtime->current <= settings->minimum);
            runtime->dirty = true;
        }
    }

    float ResourceSystem::getValue(Registry &registry, EntityID resourceEntity) const
    {
        auto *runtime = registry.GetComponent<ResourceRuntimeComponent>(resourceEntity);
        return runtime ? runtime->current : 0.0f;
    }

    void ResourceSystem::Update(Registry &registry, double dt)
    {
        (void)dt;
        auto view = registry.GetView<ResourceSettingsComponent, ResourceRuntimeComponent>();
        view.Each([](EntityID entity, ResourceSettingsComponent &settings, ResourceRuntimeComponent &runtime) {
            (void)entity;
            runtime.low = (runtime.current <= (settings.maximum * 0.2f));
        });
    }
}
