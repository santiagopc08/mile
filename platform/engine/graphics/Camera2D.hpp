#ifndef PLATFORM_ENGINE_GRAPHICS_CAMERA2D_HPP
#define PLATFORM_ENGINE_GRAPHICS_CAMERA2D_HPP

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

namespace platform
{
    class Camera2D
    {
    public:
        Camera2D();
        Camera2D(float viewportWidth, float viewportHeight);

        void SetViewport(float width, float height);
        void SetPosition(const glm::vec2 &position) { m_position = position; RecalculateMatrix(); }
        void SetZoom(float zoom) { m_zoom = zoom; RecalculateMatrix(); }
        void SetRotation(float rotationDegrees) { m_rotation = rotationDegrees; RecalculateMatrix(); }

        [[nodiscard]] const glm::vec2 &GetPosition() const { return m_position; }
        [[nodiscard]] float GetZoom() const { return m_zoom; }
        [[nodiscard]] float GetRotation() const { return m_rotation; }
        [[nodiscard]] float GetViewportWidth() const { return m_viewportWidth; }
        [[nodiscard]] float GetViewportHeight() const { return m_viewportHeight; }

        [[nodiscard]] const glm::mat4 &GetProjectionMatrix() const { return m_projectionMatrix; }
        [[nodiscard]] const glm::mat4 &GetViewMatrix() const { return m_viewMatrix; }
        [[nodiscard]] const glm::mat4 &GetViewProjectionMatrix() const { return m_viewProjectionMatrix; }

    private:
        void RecalculateMatrix();

        glm::vec2 m_position{0.0f, 0.0f};
        float m_zoom{1.0f};
        float m_rotation{0.0f};
        float m_viewportWidth{1280.0f};
        float m_viewportHeight{720.0f};

        glm::mat4 m_projectionMatrix{1.0f};
        glm::mat4 m_viewMatrix{1.0f};
        glm::mat4 m_viewProjectionMatrix{1.0f};
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_CAMERA2D_HPP
