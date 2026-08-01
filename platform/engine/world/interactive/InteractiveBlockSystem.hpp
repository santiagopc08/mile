#ifndef PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_BLOCK_SYSTEM_HPP
#define PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_BLOCK_SYSTEM_HPP

#include "engine/world/interactive/InteractiveObjectSettingsComponent.hpp"
#include "engine/world/interactive/InteractiveObjectRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class InteractiveBlockSystem
    {
    public:
        InteractiveBlockSystem() = default;

        bool interact(Registry &registry, EntityID blockEntity, EntityID activatorEntity);
        void activate(Registry &registry, EntityID blockEntity, EntityID activatorEntity);
        void deactivate(Registry &registry, EntityID blockEntity);
        void reset(Registry &registry, EntityID blockEntity);

        [[nodiscard]] bool isActivated(Registry &registry, EntityID blockEntity) const;
    };
}

#endif // PLATFORM_ENGINE_WORLD_INTERACTIVE_INTERACTIVE_BLOCK_SYSTEM_HPP
