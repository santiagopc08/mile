#ifndef PLATFORM_ENGINE_MODULES_MODULE_DESCRIPTOR_HPP
#define PLATFORM_ENGINE_MODULES_MODULE_DESCRIPTOR_HPP

#include <string>
#include <vector>
#include <cstdint>

namespace platform
{
    struct ModuleDescriptor
    {
        std::string Name;
        uint32_t ID{0};
        std::string Version{"1.0.0"};
        std::vector<std::string> Dependencies;
        std::vector<std::string> Capabilities;
        int32_t Priority{0};
    };
}

#endif // PLATFORM_ENGINE_MODULES_MODULE_DESCRIPTOR_HPP
