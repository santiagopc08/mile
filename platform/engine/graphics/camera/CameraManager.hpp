#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_MANAGER_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_MANAGER_HPP

#include "engine/graphics/Camera2D.hpp"
#include <memory>
#include <vector>

namespace platform
{
    class CameraManager
    {
    public:
        CameraManager();
        ~CameraManager();

        Camera2D *CreateCamera(float viewportWidth = 1280.0f, float viewportHeight = 720.0f);
        void DestroyCamera(Camera2D *camera);
        void SetActiveCamera(Camera2D *camera);

        [[nodiscard]] Camera2D *GetActiveCamera() const { return m_activeCamera; }
        [[nodiscard]] bool HasActiveCamera() const { return m_activeCamera != nullptr; }

    private:
        std::vector<std::unique_ptr<Camera2D>> m_cameras;
        Camera2D *m_activeCamera{nullptr};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA_CAMERA_MANAGER_HPP
