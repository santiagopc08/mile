#include "engine/graphics/RenderCommand.hpp"
#include <SDL3/SDL.h>
#include <algorithm>
#include <cmath>

namespace platform
{
    void ClearCommand::Execute(SDL_Renderer *renderer)
    {
        if (renderer)
        {
            SDL_SetRenderDrawColorFloat(renderer, m_r, m_g, m_b, m_a);
            SDL_RenderClear(renderer);
        }
    }

    void DrawRectangleCommand::Execute(SDL_Renderer *renderer)
    {
        if (!renderer)
        {
            return;
        }

        if (m_rotation != 0.0f)
        {
            ExecuteRotated(renderer);
            return;
        }

        SDL_SetRenderDrawColorFloat(renderer, m_color.r, m_color.g, m_color.b, m_color.a);

        SDL_FRect rect;
        rect.x = m_screenPos.x - (m_size.x * 0.5f); // Center origin
        rect.y = m_screenPos.y - (m_size.y * 0.5f);
        rect.w = m_size.x;
        rect.h = m_size.y;

        SDL_RenderFillRect(renderer, &rect);
    }

    void DrawRectangleCommand::ExecuteRotated(SDL_Renderer *renderer)
    {
        const float radians = m_rotation * 0.01745329252f; // degrees -> radians
        const float cosR = std::cos(radians);
        const float sinR = std::sin(radians);
        const float halfW = m_size.x * 0.5f;
        const float halfH = m_size.y * 0.5f;

        const SDL_FColor color{m_color.r, m_color.g, m_color.b, m_color.a};
        const float cornersX[4] = {-halfW, halfW, halfW, -halfW};
        const float cornersY[4] = {-halfH, -halfH, halfH, halfH};

        SDL_Vertex vertices[4]{};
        for (int i = 0; i < 4; ++i)
        {
            vertices[i].position.x = m_screenPos.x + (cornersX[i] * cosR) - (cornersY[i] * sinR);
            vertices[i].position.y = m_screenPos.y + (cornersX[i] * sinR) + (cornersY[i] * cosR);
            vertices[i].color = color;
        }

        static const int indices[6] = {0, 1, 2, 0, 2, 3};
        SDL_RenderGeometry(renderer, nullptr, vertices, 4, indices, 6);
    }

    void DrawRectangleOutlineCommand::Execute(SDL_Renderer *renderer)
    {
        if (!renderer)
        {
            return;
        }

        SDL_SetRenderDrawColorFloat(renderer, m_color.r, m_color.g, m_color.b, m_color.a);

        const float thickness = std::max(1.0f, m_thickness);
        for (float inset = 0.0f; inset < thickness; inset += 1.0f)
        {
            SDL_FRect rect;
            rect.x = m_screenPos.x - (m_size.x * 0.5f) + inset;
            rect.y = m_screenPos.y - (m_size.y * 0.5f) + inset;
            rect.w = m_size.x - (inset * 2.0f);
            rect.h = m_size.y - (inset * 2.0f);
            if (rect.w <= 0.0f || rect.h <= 0.0f)
            {
                break;
            }
            SDL_RenderRect(renderer, &rect);
        }
    }

    void DrawCircleCommand::Execute(SDL_Renderer *renderer)
    {
        if (!renderer || m_radius <= 0.0f)
        {
            return;
        }

        constexpr int kSegments = 24;
        const SDL_FColor color{m_color.r, m_color.g, m_color.b, m_color.a};

        SDL_Vertex vertices[kSegments + 1]{};
        vertices[0].position = {m_screenPos.x, m_screenPos.y};
        vertices[0].color = color;

        for (int i = 0; i < kSegments; ++i)
        {
            const float angle = static_cast<float>(i) / static_cast<float>(kSegments) * 6.28318530718f;
            vertices[i + 1].position = {m_screenPos.x + std::cos(angle) * m_radius,
                                        m_screenPos.y + std::sin(angle) * m_radius};
            vertices[i + 1].color = color;
        }

        int indices[kSegments * 3]{};
        for (int i = 0; i < kSegments; ++i)
        {
            indices[i * 3 + 0] = 0;
            indices[i * 3 + 1] = i + 1;
            indices[i * 3 + 2] = ((i + 1) % kSegments) + 1;
        }

        SDL_RenderGeometry(renderer, nullptr, vertices, kSegments + 1, indices, kSegments * 3);

        if (m_spokeRotation != 0.0f)
        {
            const float radians = m_spokeRotation * 0.01745329252f;
            SDL_SetRenderDrawColorFloat(renderer, m_color.r * 2.4f + 0.18f, m_color.g * 2.4f + 0.18f,
                                        m_color.b * 2.4f + 0.18f, m_color.a);
            for (int i = 0; i < 2; ++i)
            {
                const float angle = radians + static_cast<float>(i) * 1.5707963f;
                SDL_RenderLine(renderer,
                               m_screenPos.x - std::cos(angle) * m_radius * 0.78f,
                               m_screenPos.y - std::sin(angle) * m_radius * 0.78f,
                               m_screenPos.x + std::cos(angle) * m_radius * 0.78f,
                               m_screenPos.y + std::sin(angle) * m_radius * 0.78f);
            }
        }
    }

    void DrawConvexPolygonCommand::Execute(SDL_Renderer *renderer)
    {
        if (!renderer || m_points.size() < 3)
        {
            return;
        }

        const SDL_FColor color{m_color.r, m_color.g, m_color.b, m_color.a};

        std::vector<SDL_Vertex> vertices(m_points.size());
        for (size_t i = 0; i < m_points.size(); ++i)
        {
            vertices[i].position = {m_points[i].x, m_points[i].y};
            vertices[i].color = color;
        }

        std::vector<int> indices;
        indices.reserve((m_points.size() - 2) * 3);
        for (size_t i = 1; i + 1 < m_points.size(); ++i)
        {
            indices.push_back(0);
            indices.push_back(static_cast<int>(i));
            indices.push_back(static_cast<int>(i + 1));
        }

        SDL_RenderGeometry(renderer, nullptr, vertices.data(), static_cast<int>(vertices.size()),
                           indices.data(), static_cast<int>(indices.size()));
    }

    void DrawPolylineCommand::Execute(SDL_Renderer *renderer)
    {
        if (!renderer || m_points.size() < 2)
        {
            return;
        }

        SDL_SetRenderDrawColorFloat(renderer, m_color.r, m_color.g, m_color.b, m_color.a);

        for (size_t i = 0; i + 1 < m_points.size(); ++i)
        {
            SDL_RenderLine(renderer, m_points[i].x, m_points[i].y, m_points[i + 1].x, m_points[i + 1].y);
        }

        if (m_closed)
        {
            SDL_RenderLine(renderer, m_points.back().x, m_points.back().y, m_points.front().x, m_points.front().y);
        }
    }

    void DrawLineCommand::Execute(SDL_Renderer *renderer)
    {
        if (!renderer)
        {
            return;
        }

        SDL_SetRenderDrawColorFloat(renderer, m_color.r, m_color.g, m_color.b, m_color.a);
        SDL_RenderLine(renderer, m_from.x, m_from.y, m_to.x, m_to.y);
    }

    void DrawTextCommand::Execute(SDL_Renderer *renderer)
    {
        if (!renderer || m_text.empty())
        {
            return;
        }

        SDL_SetRenderDrawColorFloat(renderer, m_color.r, m_color.g, m_color.b, m_color.a);

        if (m_scale <= 1.0f)
        {
            SDL_RenderDebugText(renderer, m_screenPos.x, m_screenPos.y, m_text.c_str());
            return;
        }

        // The built-in debug font is a fixed 8x8 bitmap; scaling the render target is
        // the only way to make it legible on a 1600x900 workspace.
        float previousX = 1.0f;
        float previousY = 1.0f;
        SDL_GetRenderScale(renderer, &previousX, &previousY);
        SDL_SetRenderScale(renderer, previousX * m_scale, previousY * m_scale);
        SDL_RenderDebugText(renderer, m_screenPos.x / m_scale, m_screenPos.y / m_scale, m_text.c_str());
        SDL_SetRenderScale(renderer, previousX, previousY);
    }

    void SetClipRectCommand::Execute(SDL_Renderer *renderer)
    {
        if (!renderer)
        {
            return;
        }

        if (!m_enabled)
        {
            SDL_SetRenderClipRect(renderer, nullptr);
            return;
        }

        SDL_Rect clip;
        clip.x = static_cast<int>(m_topLeft.x);
        clip.y = static_cast<int>(m_topLeft.y);
        clip.w = static_cast<int>(m_size.x);
        clip.h = static_cast<int>(m_size.y);
        SDL_SetRenderClipRect(renderer, &clip);
    }

    void PresentCommand::Execute(SDL_Renderer *renderer)
    {
        if (renderer)
        {
            SDL_RenderPresent(renderer);
        }
    }
}
