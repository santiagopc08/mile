#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_RUNTIME_COMPONENT_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_RUNTIME_COMPONENT_HPP

#include "engine/graphics/camera/CameraView.hpp"
#include <cstdint>

namespace platform
{
    enum class CameraTimelineState
    {
        Inactive,
        Playing,
        Paused,
        Completed
    };

    struct CameraTimelineRuntimeComponent
    {
        CameraTimelineState state{CameraTimelineState::Inactive};
        double currentTime{0.0};
        uint32_t currentKeyframe{0};
        uint32_t currentTrack{1};
        CameraView currentView{};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_TIMELINE_RUNTIME_COMPONENT_HPP
