#ifndef PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_SYSTEM_HPP
#define PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_SYSTEM_HPP

#include "engine/gameplay/inventory/InventorySettingsComponent.hpp"
#include "engine/gameplay/inventory/InventoryRuntimeComponent.hpp"
#include "engine/scene/Registry.hpp"
#include "engine/scene/Entity.hpp"
#include <string>

namespace platform
{
    class InventorySystem
    {
    public:
        InventorySystem() = default;

        bool addItem(Registry &registry, EntityID entity, const std::string &itemID, uint32_t amount = 1);
        bool removeItem(Registry &registry, EntityID entity, const std::string &itemID, uint32_t amount = 1);

        [[nodiscard]] bool contains(Registry &registry, EntityID entity, const std::string &itemID) const;
        void clear(Registry &registry, EntityID entity);

        [[nodiscard]] uint32_t quantity(Registry &registry, EntityID entity, const std::string &itemID) const;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_SYSTEM_HPP
