#ifndef PLATFORM_EDITOR_GIZMOS_GIZMO_TYPES_HPP
#define PLATFORM_EDITOR_GIZMOS_GIZMO_TYPES_HPP

#include <cstdint>

namespace platform
{
    enum class GizmoMode : uint8_t
    {
        None = 0,
        Translate,
        Rotate,
        Scale,
        Bounds,
        Pivot
    };

    enum class GizmoAxis : uint8_t
    {
        None = 0,
        X,
        Y,
        XY
    };
}

#endif // PLATFORM_EDITOR_GIZMOS_GIZMO_TYPES_HPP
