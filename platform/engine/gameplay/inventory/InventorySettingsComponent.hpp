#ifndef PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_SETTINGS_COMPONENT_HPP

#include <cstdint>

namespace platform
{
    struct InventorySettingsComponent
    {
        uint32_t slotCount{20};
        bool unlimited{false};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_SETTINGS_COMPONENT_HPP
