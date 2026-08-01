#ifndef PLATFORM_ENGINE_GRAPHICS_COMPONENTS_VISIBILITY_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_COMPONENTS_VISIBILITY_COMPONENT_HPP

namespace platform
{
    struct VisibilityComponent
    {
        bool Visible{true};
        bool CastShadow{false};
        bool ReceiveShadow{false};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_COMPONENTS_VISIBILITY_COMPONENT_HPP
