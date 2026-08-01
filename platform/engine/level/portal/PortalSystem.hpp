#ifndef PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_SYSTEM_HPP
#define PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_SYSTEM_HPP

#include "engine/level/portal/PortalSettingsComponent.hpp"
#include "engine/level/portal/PortalRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"

namespace platform
{
    class PortalSystem
    {
    public:
        PortalSystem() = default;

        void activatePortal(Registry &registry, EntityID portalEntity);
        void deactivatePortal(Registry &registry, EntityID portalEntity);

        bool travel(Registry &registry, EntityID portalEntity, EntityID travelerEntity);
        void cancelTravel(Registry &registry, EntityID portalEntity);

        [[nodiscard]] bool isActive(Registry &registry, EntityID portalEntity) const;
        [[nodiscard]] bool isOccupied(Registry &registry, EntityID portalEntity) const;
        [[nodiscard]] LevelID destinationLevel(Registry &registry, EntityID portalEntity) const;
    };
}

#endif // PLATFORM_ENGINE_LEVEL_PORTAL_PORTAL_SYSTEM_HPP
