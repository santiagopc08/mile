#ifndef PLATFORM_ENGINE_GRAPHICS_RENDER_COMMAND_QUEUE_HPP
#define PLATFORM_ENGINE_GRAPHICS_RENDER_COMMAND_QUEUE_HPP

#include "engine/graphics/RenderCommand.hpp"
#include <vector>
#include <memory>

namespace platform
{
    class RenderCommandQueue
    {
    public:
        RenderCommandQueue();

        void Enqueue(std::unique_ptr<RenderCommand> command);
        void Flush(SDL_Renderer *renderer);
        void ClearQueue();

        [[nodiscard]] size_t GetCommandCount() const { return m_commands.size(); }

    private:
        std::vector<std::unique_ptr<RenderCommand>> m_commands;
    };
}

#endif // PLATFORM_ENGINE_GRAPHICS_RENDER_COMMAND_QUEUE_HPP
