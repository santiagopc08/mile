#include "engine/graphics/camera/CameraManager.hpp"
#include "engine/core/Logger.hpp"
#include <algorithm>

namespace platform
{
    CameraManager::CameraManager() = default;
    CameraManager::~CameraManager() = default;

    Camera2D *CameraManager::CreateCamera(float viewportWidth, float viewportHeight)
    {
        auto camera = std::make_unique<Camera2D>(viewportWidth, viewportHeight);
        auto *raw = camera.get();
        m_cameras.push_back(std::move(camera));

        if (!m_activeCamera)
        {
            SetActiveCamera(raw);
        }

        return raw;
    }

    void CameraManager::DestroyCamera(Camera2D *camera)
    {
        if (!camera)
        {
            return;
        }

        if (m_activeCamera == camera)
        {
            m_activeCamera = nullptr;
        }

        auto it = std::find_if(m_cameras.begin(), m_cameras.end(), [camera](const auto &ptr) {
            return ptr.get() == camera;
        });

        if (it != m_cameras.end())
        {
            m_cameras.erase(it);
        }

        if (!m_activeCamera && !m_cameras.empty())
        {
            m_activeCamera = m_cameras[0].get();
        }
    }

    void CameraManager::SetActiveCamera(Camera2D *camera)
    {
        m_activeCamera = camera;
        if (m_activeCamera)
        {
            LOG_INFO("[CameraManager] Active camera set (Viewport: {}x{}).",
                     m_activeCamera->GetViewportWidth(), m_activeCamera->GetViewportHeight());
        }
    }
}
