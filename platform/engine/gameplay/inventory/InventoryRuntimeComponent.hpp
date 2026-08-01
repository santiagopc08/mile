#ifndef PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_RUNTIME_COMPONENT_HPP

#include <unordered_map>
#include <string>
#include <cstdint>

namespace platform
{
    struct InventoryRuntimeComponent
    {
        std::unordered_map<std::string, uint32_t> items;
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_INVENTORY_INVENTORY_RUNTIME_COMPONENT_HPP
