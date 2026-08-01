#include "engine/graphics/Camera2D.hpp"

namespace platform
{
    Camera2D::Camera2D()
    {
        RecalculateMatrix();
    }

    Camera2D::Camera2D(float viewportWidth, float viewportHeight)
        : m_viewportWidth(viewportWidth), m_viewportHeight(viewportHeight)
    {
        RecalculateMatrix();
    }

    void Camera2D::SetViewport(float width, float height)
    {
        m_viewportWidth = width;
        m_viewportHeight = height;
        RecalculateMatrix();
    }

    void Camera2D::RecalculateMatrix()
    {
        float halfW = (m_viewportWidth * 0.5f) / m_zoom;
        float halfH = (m_viewportHeight * 0.5f) / m_zoom;

        m_projectionMatrix = glm::ortho(-halfW, halfW, halfH, -halfH, -1.0f, 1.0f);

        glm::mat4 transform = glm::translate(glm::mat4(1.0f), glm::vec3(m_position, 0.0f)) *
                              glm::rotate(glm::mat4(1.0f), glm::radians(m_rotation), glm::vec3(0.0f, 0.0f, 1.0f));

        m_viewMatrix = glm::inverse(transform);
        m_viewProjectionMatrix = m_projectionMatrix * m_viewMatrix;
    }
}
