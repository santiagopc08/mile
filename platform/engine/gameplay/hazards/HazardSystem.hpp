#ifndef PLATFORM_ENGINE_GAMEPLAY_HAZARDS_HAZARD_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_HAZARDS_HAZARD_SYSTEM_HPP

#include "engine/gameplay/hazards/HazardSettingsComponent.hpp"
#include "engine/gameplay/hazards/HazardRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class HazardSystem
    {
    public:
        HazardSystem() = default;

        void activate(Registry &registry, EntityID hazardEntity);
        void deactivate(Registry &registry, EntityID hazardEntity);
        void damage(Registry &registry, EntityID hazardEntity, EntityID victimEntity);
        void kill(Registry &registry, EntityID hazardEntity, EntityID victimEntity);

        [[nodiscard]] bool isActive(Registry &registry, EntityID hazardEntity) const;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_HAZARDS_HAZARD_SYSTEM_HPP
