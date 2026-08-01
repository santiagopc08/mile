#ifndef PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_SYSTEM_HPP

#include "engine/gameplay/resources/ResourceSettingsComponent.hpp"
#include "engine/gameplay/resources/ResourceRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class ResourceSystem
    {
    public:
        ResourceSystem() = default;

        EntityID createResource(Registry &registry, ResourceID id, const std::string &name, float maximum, float initial = 100.0f);
        void destroyResource(Registry &registry, EntityID resourceEntity);

        void consume(Registry &registry, EntityID resourceEntity, float amount);
        void restore(Registry &registry, EntityID resourceEntity, float amount);

        void setValue(Registry &registry, EntityID resourceEntity, float value);
        [[nodiscard]] float getValue(Registry &registry, EntityID resourceEntity) const;

        void Update(Registry &registry, double dt);
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_SYSTEM_HPP
