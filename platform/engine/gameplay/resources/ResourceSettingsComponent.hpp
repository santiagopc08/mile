#ifndef PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_SETTINGS_COMPONENT_HPP
#define PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_SETTINGS_COMPONENT_HPP

#include <cstdint>
#include <string>

namespace platform
{
    using ResourceID = uint32_t;

    struct ResourceSettingsComponent
    {
        ResourceID id{0};
        std::string name{"Fuel"};
        float maximum{100.0f};
        float initial{100.0f};
        float minimum{0.0f};
        bool allowOverflow{false};
    };
}

#endif // PLATFORM_ENGINE_GAMEPLAY_RESOURCES_RESOURCE_SETTINGS_COMPONENT_HPP
