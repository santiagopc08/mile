#ifndef PLATFORM_ENGINE_FILESYSTEM_MOUNT_POINT_HPP
#define PLATFORM_ENGINE_FILESYSTEM_MOUNT_POINT_HPP

#include "engine/filesystem/providers/IFileProvider.hpp"
#include <string>
#include <memory>

namespace platform
{
    struct MountPoint
    {
        std::string Scheme;       // e.g. "assets", "engine", "game"
        std::string PhysicalRoot; // e.g. "Assets/", "Project/Assets/"
        IFileProvider *Provider{nullptr};
        int Priority{0};
    };
}

#endif // PLATFORM_ENGINE_FILESYSTEM_MOUNT_POINT_HPP
